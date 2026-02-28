import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { Walkthrough } from "@walkrstudio/core";
import { loadScriptWalkthrough, watchScript } from "./watch.js";

const STUDIO_PORT = 5174;
const PROXY_PREFIX = "/__target__";

function openBrowser(url: string): void {
  const start =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";

  spawn(start, [url], { detached: true, stdio: "ignore" }).unref();
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

function writeWalkthroughJson(path: string, walkthrough: Walkthrough, targetOrigin: string): void {
  const proxied = targetOrigin ? rewriteWalkthroughUrl(walkthrough, targetOrigin) : walkthrough;
  writeFileSync(path, JSON.stringify(proxied, null, 2));
}

export async function devCommand(scriptPath: string): Promise<void> {
  const resolvedScript = resolve(process.cwd(), scriptPath);

  // Resolve the studio package path from node_modules
  const require = createRequire(import.meta.url);
  const studioRoot = dirname(require.resolve("@walkrstudio/studio/package.json"));

  // Write loaded walkthrough JSON to Studio's public dir so it can fetch on startup
  const walkthroughJsonPath = resolve(studioRoot, "public", "walkthrough.json");
  mkdirSync(dirname(walkthroughJsonPath), { recursive: true });

  console.log(`\nWalkr Studio starting…`);
  console.log(`Script: ${scriptPath}\n`);

  // Load the script first (awaited) to extract the target origin before Vite starts
  const initialWalkthrough = await loadScriptWalkthrough(resolvedScript);
  let targetOrigin = "";
  try {
    targetOrigin = new URL(initialWalkthrough.url).origin;
  } catch {
    console.error(`[walkr] Invalid walkthrough URL: ${initialWalkthrough.url}`);
  }

  console.log(`Target origin: ${targetOrigin}`);
  writeWalkthroughJson(walkthroughJsonPath, initialWalkthrough, targetOrigin);

  // Write proxy target file so the Vite config can read it (survives Vite restarts)
  const proxyTargetPath = resolve(studioRoot, ".walkr-proxy-target");
  writeFileSync(proxyTargetPath, targetOrigin);

  // Watch for subsequent script changes
  const stopWatcher = watchScript(resolvedScript, () => {
    void (async () => {
      try {
        const walkthrough = await loadScriptWalkthrough(resolvedScript);
        console.log("Script reloaded, writing walkthrough.json…");
        writeWalkthroughJson(walkthroughJsonPath, walkthrough, targetOrigin);
      } catch (error) {
        console.error(`[walkr] Failed to reload script`, error);
      }
    })();
  });

  const vite = spawn("npx", ["vite", "--port", String(STUDIO_PORT)], {
    cwd: studioRoot,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env: {
      ...process.env,
      WALKR_PROXY_TARGET: targetOrigin,
    },
  });

  let ready = false;

  const onData = (data: Buffer): void => {
    const text = data.toString();
    process.stdout.write(text);

    if (!ready && (text.includes("Local:") || text.includes("localhost"))) {
      ready = true;
      const url = `http://localhost:${STUDIO_PORT}`;
      console.log(`\nWalkr Studio running at ${url}\n`);
      openBrowser(url);
    }
  };

  vite.stdout.on("data", onData);
  vite.stderr.on("data", onData);

  const cleanup = (): void => {
    console.log("\nShutting down…");
    stopWatcher();
    try {
      rmSync(proxyTargetPath, { force: true });
    } catch {}
    vite.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await new Promise<void>((resolve) => {
    vite.on("close", () => {
      resolve();
    });
  });
}
