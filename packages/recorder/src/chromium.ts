import { type ChildProcess, spawn } from "node:child_process";
import * as fs from "node:fs";

const CHROMIUM_PATHS = [
  process.env.CHROMIUM_PATH,
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/brave-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

function findChromium(): string {
  for (const candidate of CHROMIUM_PATHS) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Could not find Chromium. Install chromium or set the CHROMIUM_PATH environment variable.",
  );
}

interface ChromiumInstance {
  process: ChildProcess;
  wsUrl: string;
  close: () => void;
}

export async function launchChromium(options: {
  width: number;
  height: number;
}): Promise<ChromiumInstance> {
  const chromiumPath = findChromium();

  const args = [
    "--headless=new",
    "--remote-debugging-port=0",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-translate",
    "--mute-audio",
    `--window-size=${options.width},${options.height}`,
  ];

  const child = spawn(chromiumPath, args, {
    stdio: ["ignore", "ignore", "pipe"],
  });

  const wsUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Timed out waiting for Chromium DevTools WebSocket URL"));
    }, 15_000);

    let stderr = "";

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      const match = /DevTools listening on (ws:\/\/.+)/.exec(stderr);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Chromium exited with code ${code} before DevTools was ready`));
    });
  });

  return {
    process: child,
    wsUrl,
    close() {
      child.kill("SIGTERM");
    },
  };
}
