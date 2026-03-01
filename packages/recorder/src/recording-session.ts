import type { Walkthrough } from "@walkrstudio/core";
import { CDPClient } from "./cdp.js";
import { launchChromium } from "./chromium.js";
import { startStaticServer } from "./static-server.js";
import type { RecordOptions } from "./types.js";

interface CDPTarget {
  webSocketDebuggerUrl?: string;
  type?: string;
}

interface RecordingSession {
  server: { url: string; close: () => void };
  chromium: { close: () => void };
  cdp: CDPClient;
  cleanup: () => void;
}

export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
export const DEFAULT_FPS = 30;

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const getDefaultOutput = (format: RecordOptions["format"]): string => {
  if (format === "gif") return "output.gif";
  if (format === "webm") return "output.webm";
  if (format === "embed") return "output.html";
  return "output.mp4";
};

async function getPageWsUrl(browserWsUrl: string): Promise<string> {
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

export async function createRecordingSession(
  walkthrough: Walkthrough,
  opts: { width: number; height: number },
): Promise<RecordingSession> {
  const server = await startStaticServer(walkthrough);
  let chromium: { close: () => void } | null = null;
  let cdp: CDPClient | null = null;

  try {
    const browser = await launchChromium({ width: opts.width, height: opts.height });
    chromium = browser;

    const pageWsUrl = await getPageWsUrl(browser.wsUrl);
    cdp = await CDPClient.connect(pageWsUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: opts.width,
      height: opts.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const sessionCdp = cdp;
    const sessionChromium = chromium;

    return {
      server,
      chromium,
      cdp,
      cleanup() {
        sessionCdp.close();
        sessionChromium.close();
        server.close();
      },
    };
  } catch (err) {
    cdp?.close();
    chromium?.close();
    server.close();
    throw err;
  }
}

export async function waitForConsoleMessage(cdp: CDPClient, message: string): Promise<void> {
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
