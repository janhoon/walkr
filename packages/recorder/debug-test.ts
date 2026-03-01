/**
 * Debug script to trace where the virtual-time recorder hangs.
 */

import { pathToFileURL } from "node:url";
import type { Walkthrough } from "@walkrstudio/core";
import { CDPClient } from "./src/cdp.js";
import { launchChromium } from "./src/chromium.js";
import { startStaticServer } from "./src/static-server.js";

const DEMO_PATH = new URL("../../examples/ace-demo/demo.ts", import.meta.url).pathname;

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function loadWalkthrough(scriptPath: string): Promise<Walkthrough> {
  const url = pathToFileURL(scriptPath);
  url.searchParams.set("t", String(Date.now()));
  const mod = (await import(url.toString())) as { default?: unknown };
  return mod.default as Walkthrough;
}

async function getPageWsUrl(browserWsUrl: string): Promise<string> {
  const url = new URL(browserWsUrl);
  const res = await fetch(`http://${url.host}/json/list`);
  const targets = (await res.json()) as Array<{ webSocketDebuggerUrl?: string; type?: string }>;
  const page = targets.find((t) => t.type === "page");
  if (!page?.webSocketDebuggerUrl) {
    throw new Error("No page target found");
  }
  return page.webSocketDebuggerUrl;
}

async function main(): Promise<void> {
  log("Loading walkthrough…");
  const walkthrough = await loadWalkthrough(DEMO_PATH);

  log("Starting static server…");
  const server = await startStaticServer(walkthrough);
  log(`Server at ${server.url}`);

  log("Launching Chromium…");
  const browser = await launchChromium({ width: 1920, height: 1080 });
  log(`Browser WS: ${browser.wsUrl}`);

  const pageWsUrl = await getPageWsUrl(browser.wsUrl);
  log("Connecting CDP…");
  const cdp = await CDPClient.connect(pageWsUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Log all console messages
  cdp.on("Runtime.consoleAPICalled", (params: unknown) => {
    const event = params as { type: string; args?: Array<{ value?: string }> };
    const text = event.args?.map((a) => a.value ?? "").join(" ") ?? "";
    log(`[CONSOLE.${event.type}] ${text.slice(0, 200)}`);
  });

  // Block WebSocket connections globally via constructor override
  log("Blocking WebSocket connections…");
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
    `,
    worldName: "",
    runImmediately: true,
  });

  // Listen for virtualTimeBudgetExpired
  cdp.on("Emulation.virtualTimeBudgetExpired", () => {
    log("[VIRTUAL TIME] Budget expired!");
  });

  log("Pausing virtual time…");
  await cdp.send("Emulation.setVirtualTimePolicy", {
    policy: "pause",
  });

  log("Navigating…");
  await cdp.send("Page.navigate", {
    url: `${server.url}?mode=record`,
  });

  log("Setting 30s virtual time budget…");
  await cdp.send("Emulation.setVirtualTimePolicy", {
    policy: "pauseIfNetworkFetchesPending",
    budget: 30000,
    maxVirtualTimeTaskStarvationCount: 100000,
    waitForNavigation: true,
  });

  log("Waiting for __WALKR_RECORD_READY__ (30s timeout)…");

  // Simple timeout-based wait
  const ready = await Promise.race([
    new Promise<"ready">((resolve) => {
      const handler = (params: unknown): void => {
        const event = params as { type: string; args?: Array<{ value?: string }> };
        const text = event.args?.map((a) => a.value ?? "").join(" ") ?? "";
        if (text.includes("__WALKR_RECORD_READY__")) {
          cdp.off("Runtime.consoleAPICalled", handler);
          resolve("ready");
        }
      };
      cdp.on("Runtime.consoleAPICalled", handler);
    }),
    new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 30_000)),
  ]);

  log(`Result: ${ready}`);

  if (ready === "ready") {
    log("Triggering playback…");
    await cdp.send("Runtime.evaluate", {
      expression: "window.__walkrPlay()",
      awaitPromise: false,
    });

    log("Waiting for __WALKR_RECORD_STEPPING__ (15s)…");
    const stepping = await Promise.race([
      new Promise<"stepping">((resolve) => {
        const handler = (params: unknown): void => {
          const event = params as { type: string; args?: Array<{ value?: string }> };
          const text = event.args?.map((a) => a.value ?? "").join(" ") ?? "";
          if (text.includes("__WALKR_RECORD_STEPPING__")) {
            cdp.off("Runtime.consoleAPICalled", handler);
            resolve("stepping");
          }
        };
        cdp.on("Runtime.consoleAPICalled", handler);
      }),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 15_000)),
    ]);
    log(`Stepping result: ${stepping}`);

    if (stepping === "stepping") {
      // Pause virtual time to cancel the remaining load budget
      await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
      await new Promise((r) => setTimeout(r, 0));
      log("Paused virtual time after STEPPING");

      log("Capturing 5 test frames…");
      for (let i = 0; i < 5; i++) {
        log(`Frame ${i + 1}: advancing virtual time`);
        const budgetExpired = cdp.once("Emulation.virtualTimeBudgetExpired");
        await cdp.send("Emulation.setVirtualTimePolicy", {
          policy: "pauseIfNetworkFetchesPending",
          budget: 1000 / 30,
          maxVirtualTimeTaskStarvationCount: 100000,
        });
        await budgetExpired;
        log(`Frame ${i + 1}: budget expired, pausing + screenshot`);
        await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
        const result = (await cdp.send("Page.captureScreenshot", {
          format: "jpeg",
          quality: 90,
        })) as { data: string };
        log(`Frame ${i + 1}: ${result.data.length} base64 chars`);
      }
    }
  }

  log("Cleaning up…");
  cdp.close();
  browser.close();
  server.close();
  log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
