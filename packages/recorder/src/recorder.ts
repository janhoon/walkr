import * as path from "node:path";
import type { Walkthrough } from "@walkrstudio/core";
import { encodeFrames } from "./encoder.js";
import { recordRealtimeWalkthrough } from "./realtime-recorder.js";
import {
  createRecordingSession,
  DEFAULT_FPS,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  getDefaultOutput,
  isFiniteNumber,
  waitForConsoleMessage,
} from "./recording-session.js";
import { StreamingEncoder } from "./streaming-encoder.js";
import type { RecordOptions, RecordResult } from "./types.js";

export async function recordWalkthrough(
  walkthrough: Walkthrough,
  options: RecordOptions = {},
): Promise<RecordResult> {
  if (options.realtime) {
    return recordRealtimeWalkthrough(walkthrough, options);
  }

  const width = isFiniteNumber(options.width)
    ? Math.max(1, Math.round(options.width))
    : DEFAULT_WIDTH;
  const height = isFiniteNumber(options.height)
    ? Math.max(1, Math.round(options.height))
    : DEFAULT_HEIGHT;
  const fps = isFiniteNumber(options.fps) ? Math.max(1, Math.round(options.fps)) : DEFAULT_FPS;
  const frameIntervalMs = 1000 / fps;
  const format = options.format ?? "mp4";
  const isEmbed = format === "embed";
  const outputPath = path.resolve(options.output ?? getDefaultOutput(format));

  const session = await createRecordingSession(walkthrough, { width, height });

  try {
    const { cdp, server } = session;

    // Patch browser APIs for virtual time compatibility.
    // - WebSocket: block connections (pending WebSockets prevent virtual time advance)
    // - requestAnimationFrame: replace with setTimeout (rAF doesn't fire during
    //   virtual time, but setTimeout does — the engine uses rAF for step timing)
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        window.WebSocket = class extends EventTarget {
          static CONNECTING = 0;
          static OPEN = 1;
          static CLOSING = 2;
          static CLOSED = 3;
          CONNECTING = 0;
          OPEN = 1;
          CLOSING = 2;
          CLOSED = 3;
          readyState = 3;
          bufferedAmount = 0;
          extensions = '';
          protocol = '';
          binaryType = 'blob';
          url = '';
          constructor(url) {
            super();
            this.url = typeof url === 'string' ? url : '';
            setTimeout(() => {
              this.dispatchEvent(new CloseEvent('error'));
              this.dispatchEvent(new CloseEvent('close', { code: 1006 }));
            }, 0);
          }
          send() {}
          close() {}
        };

        // Replace rAF with setTimeout so callbacks fire during virtual time.
        // Chrome's virtual time advances setTimeout but not rAF.
        // The delay matches the frame capture interval so exactly 1 rAF
        // callback fires per frame budget — minimal overhead with best
        // timing accuracy. setTimeout(0) doesn't work because
        // maxVirtualTimeTaskStarvationCount batches same-time tasks.
        window.requestAnimationFrame = function(cb) {
          return setTimeout(() => cb(performance.now()), ${Math.round(frameIntervalMs)});
        };
        window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
        };
      `,
      worldName: "",
      runImmediately: true,
    });

    // Pause virtual time before navigation
    await cdp.send("Emulation.setVirtualTimePolicy", {
      policy: "pause",
    });

    // Set up console listener before navigating
    const readyPromise = waitForConsoleMessage(cdp, "__WALKR_RECORD_READY__");

    // Navigate to studio in record mode
    await cdp.send("Page.navigate", {
      url: `${server.url}?mode=record`,
    });

    // Grant load budget — let page load, fetch walkthrough.json, load iframe
    await cdp.send("Emulation.setVirtualTimePolicy", {
      policy: "pauseIfNetworkFetchesPending",
      budget: 30000,
      maxVirtualTimeTaskStarvationCount: 100000,
      waitForNavigation: true,
    });

    // Wait for __WALKR_RECORD_READY__
    await readyPromise;

    // Trigger playback
    let isComplete = false;
    cdp.on("Runtime.consoleAPICalled", (params: unknown) => {
      const event = params as { type: string; args?: Array<{ value?: string }> };
      const text = event.args?.map((a) => a.value ?? "").join(" ") ?? "";
      if (text.includes("__WALKR_RECORD_COMPLETE__")) {
        isComplete = true;
      }
    });

    await cdp.send("Runtime.evaluate", {
      expression: "window.__walkrPlay()",
      awaitPromise: false,
    });

    // Advance time in chunks until STEPPING fires (iframe loaded, first step executing)
    await waitForConsoleMessage(cdp, "__WALKR_RECORD_STEPPING__");

    // Pause virtual time to cancel the remaining load budget, then drain
    // any stale virtualTimeBudgetExpired event from the cancelled budget.
    await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
    await new Promise((r) => setTimeout(r, 0));

    // Frame capture loop using virtual time
    const totalDurationMs = walkthrough.steps.reduce(
      (sum, step) => sum + Math.max(0, step.duration),
      0,
    );
    const expectedFrames = Math.ceil(totalDurationMs / frameIntervalMs);

    // For embed format, buffer all frames. For video formats, stream to encoder.
    const frames: Buffer[] = [];
    let encoder: StreamingEncoder | null = null;

    if (!isEmbed) {
      encoder = new StreamingEncoder({
        format: format as "mp4" | "gif" | "webm",
        fps,
        width,
        height,
        outputPath,
        expectedFrames,
      });
    }

    let capturedCount = 0;

    while (!isComplete && capturedCount < expectedFrames) {
      // Register listener BEFORE send — the response and event may arrive
      // in the same TCP packet, so the event could be dispatched before
      // the send promise resolves.
      const budgetExpired = cdp.once("Emulation.virtualTimeBudgetExpired");
      await cdp.send("Emulation.setVirtualTimePolicy", {
        policy: "pauseIfNetworkFetchesPending",
        budget: frameIntervalMs,
        maxVirtualTimeTaskStarvationCount: 100000,
      });
      await budgetExpired;

      // Switch to clean pause so the compositor can produce a frame.
      // With pauseIfNetworkFetchesPending the compositor may block on
      // pending requests, causing captureScreenshot to hang.
      await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });

      // Capture screenshot
      const result = (await cdp.send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 90,
      })) as { data: string };
      const frameBuffer = Buffer.from(result.data, "base64");

      if (isEmbed) {
        frames.push(frameBuffer);
      } else if (encoder) {
        await encoder.write(frameBuffer);
      }

      capturedCount++;

      // Report progress
      options.onProgress?.(Math.min(100, (capturedCount / expectedFrames) * 100));
    }

    // Finalize
    if (isEmbed) {
      // Trim to exact expected frame count — virtual time rounding may produce extras
      const finalFrames = frames.slice(0, expectedFrames);
      return await encodeFrames(finalFrames, {
        ...options,
        width,
        height,
        fps,
        walkthrough,
      });
    }

    if (encoder) {
      return await encoder.finish();
    }

    throw new Error("Unexpected state: no encoder and not embed format");
  } finally {
    session.cleanup();
  }
}
