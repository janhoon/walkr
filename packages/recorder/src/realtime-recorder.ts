import * as path from "node:path";
import type { Walkthrough } from "@walkrstudio/core";
import { encodeFrames } from "./encoder.js";
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

export async function recordRealtimeWalkthrough(
  walkthrough: Walkthrough,
  options: RecordOptions = {},
): Promise<RecordResult> {
  const width = isFiniteNumber(options.width)
    ? Math.max(1, Math.round(options.width))
    : DEFAULT_WIDTH;
  const height = isFiniteNumber(options.height)
    ? Math.max(1, Math.round(options.height))
    : DEFAULT_HEIGHT;
  const fps = isFiniteNumber(options.fps) ? Math.max(1, Math.round(options.fps)) : DEFAULT_FPS;
  const format = options.format ?? "mp4";
  const isEmbed = format === "embed";
  const outputPath = path.resolve(options.output ?? getDefaultOutput(format));

  const totalDurationMs = walkthrough.steps.reduce(
    (sum, step) => sum + Math.max(0, step.duration),
    0,
  );
  const expectedFrames = Math.ceil(totalDurationMs / (1000 / fps));

  const session = await createRecordingSession(walkthrough, { width, height });

  try {
    const { cdp, server } = session;

    // No browser API patching — real-time mode uses wall clock

    // Set up console listener before navigating
    const readyPromise = waitForConsoleMessage(cdp, "__WALKR_RECORD_READY__");

    // Navigate to studio in record mode
    await cdp.send("Page.navigate", {
      url: `${server.url}?mode=record`,
    });

    await readyPromise;

    // Set up completion listener
    const completePromise = new Promise<void>((resolve) => {
      const handler = (params: unknown): void => {
        const event = params as { type: string; args?: Array<{ value?: string }> };
        const text = event.args?.map((a) => a.value ?? "").join(" ") ?? "";
        if (text.includes("__WALKR_RECORD_COMPLETE__")) {
          cdp.off("Runtime.consoleAPICalled", handler);
          resolve();
        }
      };
      cdp.on("Runtime.consoleAPICalled", handler);
    });

    // For embed format, buffer frames. For video formats, stream to encoder.
    const frames: Buffer[] = [];
    let encoder: StreamingEncoder | null = null;
    let frameCount = 0;

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

    // Start screencast — push-based frame delivery
    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 90,
      maxWidth: width,
      maxHeight: height,
      everyNthFrame: 1,
    });

    // Handle incoming screencast frames with serialized writes
    let writeChain = Promise.resolve();

    cdp.on("Page.screencastFrame", (params: unknown) => {
      const event = params as { data: string; sessionId: number };

      // Ack immediately so Chrome keeps sending frames
      void cdp.send("Page.screencastFrameAck", { sessionId: event.sessionId });

      const frameBuffer = Buffer.from(event.data, "base64");

      if (isEmbed) {
        frames.push(frameBuffer);
      } else if (encoder) {
        const enc = encoder;
        writeChain = writeChain.then(() => enc.write(frameBuffer));
      }

      frameCount++;
      options.onProgress?.(Math.min(100, (frameCount / expectedFrames) * 100));
    });

    // Trigger playback
    await cdp.send("Runtime.evaluate", {
      expression: "window.__walkrPlay()",
      awaitPromise: false,
    });

    // Wait for walkthrough completion
    await completePromise;

    // Stop screencast and drain pending writes
    await cdp.send("Page.stopScreencast");
    await writeChain;

    // Finalize
    if (isEmbed) {
      return await encodeFrames(frames, {
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
