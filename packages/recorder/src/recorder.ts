import type { Walkthrough } from "@walkrstudio/core";
import { CDPClient } from "./cdp.js";
import { launchChromium } from "./chromium.js";
import { encodeFrames } from "./encoder.js";
import type { RecordOptions, RecordResult } from "./types.js";
import { startStudioServer } from "./vite-server.js";

interface CDPTarget {
  webSocketDebuggerUrl?: string;
  type?: string;
}

async function getPageWsUrl(browserWsUrl: string): Promise<string> {
  // Extract host:port from ws://host:port/devtools/browser/...
  const url = new URL(browserWsUrl);
  const httpUrl = `http://${url.host}/json/list`;

  const res = await fetch(httpUrl);
  if (!res.ok) {
    throw new Error(`Failed to list CDP targets: ${res.status}`);
  }

  const targets = (await res.json()) as CDPTarget[];
  const page = targets.find((t) => t.type === "page");
  if (!page?.webSocketDebuggerUrl) {
    throw new Error("No page target found in Chromium");
  }

  return page.webSocketDebuggerUrl;
}

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_FPS = 30;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export async function recordWalkthrough(
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
  const frameIntervalMs = 1000 / fps;

  // 1. Start studio Vite dev server
  const server = await startStudioServer(walkthrough);
  let chromium: { close: () => void } | null = null;
  let cdp: CDPClient | null = null;

  try {
    // 2. Launch system Chromium headlessly
    const browser = await launchChromium({ width, height });
    chromium = browser;

    // 3. Connect CDP to page target (not browser endpoint)
    const pageWsUrl = await getPageWsUrl(browser.wsUrl);
    cdp = await CDPClient.connect(pageWsUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // Set viewport
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 4. Set up console listener before navigating (so we don't miss messages)
    const readyPromise = waitForConsoleMessage(cdp, "__WALKR_RECORD_READY__");

    // Navigate to studio in record mode
    await cdp.send("Page.navigate", {
      url: `${server.url}?mode=record`,
    });

    // 5. Wait for __WALKR_RECORD_READY__ console message
    await readyPromise;

    // Allow React StrictMode re-mount cycle to settle (dev mode runs effects twice)
    await new Promise((r) => setTimeout(r, 500));

    // 6. Listen for completion signal, then trigger playback
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

    // Wait for iframe content to load before capturing
    await waitForConsoleMessage(cdp, "__WALKR_RECORD_STEPPING__");

    // 7. Real-time frame capture loop
    // Capture screenshots while the walkthrough plays in real time.
    // Virtual time is not used because WebSocket/network activity in
    // Vite dev-served pages prevents Chrome's virtual time from advancing.
    const totalDurationMs = walkthrough.steps.reduce(
      (sum, step) => sum + Math.max(0, step.duration),
      0,
    );

    const frames: Buffer[] = [];
    const captureStart = Date.now();
    let lastCaptureTime = captureStart;

    while (!isComplete) {
      // Safety timeout: walkthrough duration + generous buffer
      if (Date.now() - captureStart > totalDurationMs + 10_000) {
        break;
      }

      // Pace captures to target FPS
      const timeSinceLastCapture = Date.now() - lastCaptureTime;
      if (timeSinceLastCapture < frameIntervalMs) {
        await new Promise((r) => setTimeout(r, frameIntervalMs - timeSinceLastCapture));
      }

      // Capture screenshot (JPEG is ~3-5x faster than PNG to encode)
      const result = (await cdp.send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 90,
      })) as { data: string };
      frames.push(Buffer.from(result.data, "base64"));
      lastCaptureTime = Date.now();

      // Report progress based on elapsed time vs total duration
      const elapsed = Date.now() - captureStart;
      options.onProgress?.(Math.min(100, (elapsed / totalDurationMs) * 100));
    }

    // 9. Encode frames using effective FPS to preserve correct playback duration
    const captureDurationMs = Date.now() - captureStart;
    const effectiveFps = frames.length / (captureDurationMs / 1000);

    return await encodeFrames(frames, {
      ...options,
      width,
      height,
      fps: effectiveFps,
      walkthrough,
    });
  } finally {
    // 10. Cleanup
    cdp?.close();
    chromium?.close();
    server.close();
  }
}

async function waitForConsoleMessage(cdp: CDPClient, message: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cdp.off("Runtime.consoleAPICalled", handler);
      reject(new Error(`Timed out waiting for console message: ${message}`));
    }, 30_000);

    const handler = (params: unknown): void => {
      const event = params as {
        type: string;
        args?: Array<{ type: string; value?: string }>;
      };
      if (event.type !== "log") return;

      const text = event.args?.map((a) => a.value ?? "").join(" ") ?? "";
      if (text.includes(message)) {
        clearTimeout(timeout);
        cdp.off("Runtime.consoleAPICalled", handler);
        resolve();
      }
    };

    cdp.on("Runtime.consoleAPICalled", handler);
  });
}
