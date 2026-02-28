import { type ChildProcess, spawn } from "node:child_process";
import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as net from "node:net";
import { dirname, resolve } from "node:path";

import type { Walkthrough } from "@walkrstudio/core";

const PROXY_PREFIX = "/__target__";

interface StudioServer {
  port: number;
  url: string;
  close: () => void;
}

function rewriteWalkthroughUrl(
  walkthrough: Walkthrough,
  targetOrigin: string,
): Walkthrough & { originalUrl: string } {
  return {
    ...walkthrough,
    originalUrl: walkthrough.url,
    url: walkthrough.url.replace(targetOrigin, PROXY_PREFIX),
  };
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close();
        reject(new Error("Failed to get free port"));
        return;
      }
      const port = addr.port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

export async function startStudioServer(walkthrough: Walkthrough): Promise<StudioServer> {
  const require = createRequire(import.meta.url);
  const studioRoot = dirname(require.resolve("@walkrstudio/studio/package.json"));

  // Write walkthrough.json to studio's public dir
  const walkthroughJsonPath = resolve(studioRoot, "public", "walkthrough.json");
  fs.mkdirSync(dirname(walkthroughJsonPath), { recursive: true });

  let targetOrigin = "";
  try {
    targetOrigin = new URL(walkthrough.url).origin;
  } catch {}

  const proxied = targetOrigin ? rewriteWalkthroughUrl(walkthrough, targetOrigin) : walkthrough;
  fs.writeFileSync(walkthroughJsonPath, JSON.stringify(proxied, null, 2));

  // Write proxy target file so Vite config can read it
  const proxyTargetPath = resolve(studioRoot, ".walkr-proxy-target");
  fs.writeFileSync(proxyTargetPath, targetOrigin);

  const port = await getFreePort();

  const vite: ChildProcess = spawn("npx", ["vite", "--port", String(port)], {
    cwd: studioRoot,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env: {
      ...process.env,
      WALKR_PROXY_TARGET: targetOrigin,
    },
  });

  // Wait for Vite to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      vite.kill();
      reject(new Error("Timed out waiting for Vite dev server"));
    }, 30_000);

    const onData = (data: Buffer): void => {
      const text = data.toString();
      if (text.includes("Local:") || text.includes("localhost")) {
        clearTimeout(timeout);
        resolve();
      }
    };

    vite.stdout?.on("data", onData);
    vite.stderr?.on("data", onData);

    vite.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    vite.on("close", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Vite exited with code ${code} before becoming ready`));
    });
  });

  return {
    port,
    url: `http://localhost:${port}`,
    close() {
      vite.kill("SIGTERM");
      try {
        fs.rmSync(proxyTargetPath, { force: true });
      } catch {}
    },
  };
}
