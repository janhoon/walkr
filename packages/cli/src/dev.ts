import { spawn } from "node:child_process";
import { watch } from "./watch.js";

const STUDIO_PORT = 5173;

function openBrowser(url: string): void {
  const start =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  spawn(start, [url], { detached: true, stdio: "ignore" }).unref();
}

export async function devCommand(scriptPath: string): Promise<void> {
  const resolvedScript = new URL(
    scriptPath.startsWith("/") ? scriptPath : `../../${scriptPath}`,
    import.meta.url,
  ).pathname;

  // Resolve the studio package path (sibling in monorepo)
  const studioRoot = new URL("../../studio", import.meta.url).pathname;

  console.log(`\nWalkr Studio starting…`);
  console.log(`Script: ${scriptPath}\n`);

  const vite = spawn("npx", ["vite", "--port", String(STUDIO_PORT)], {
    cwd: studioRoot,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
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

  const stopWatcher = watch(resolvedScript, () => {
    console.log("Script changed, reloading…");
  });

  const cleanup = (): void => {
    console.log("\nShutting down…");
    stopWatcher();
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
