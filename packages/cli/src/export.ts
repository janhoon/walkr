import { pathToFileURL } from "node:url";
import type { Walkthrough } from "@walkrstudio/core";

export interface ExportOptions {
  format?: "mp4" | "gif" | "webm" | "embed";
  output?: string;
  width?: number;
  height?: number;
  realtime?: boolean;
}

function isWalkthrough(value: unknown): value is Walkthrough {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.url === "string" && Array.isArray(v.steps);
}

async function loadWalkthrough(scriptPath: string): Promise<Walkthrough> {
  const url = pathToFileURL(scriptPath);
  url.searchParams.set("t", String(Date.now()));

  const mod = (await import(url.toString())) as { default?: unknown };
  const wt = mod.default;

  if (!isWalkthrough(wt)) {
    throw new Error(
      `Script "${scriptPath}" must export a Walkthrough as default. Got: ${typeof wt}`,
    );
  }

  return wt;
}

export async function exportCommand(scriptPath: string, options: ExportOptions): Promise<void> {
  const format = options.format ?? "mp4";
  const ext = format === "embed" ? "html" : format;
  const output = options.output ?? `output.${ext}`;

  const mode = options.realtime ? "realtime" : "virtual-time";

  console.log(`\nWalkr Export`);
  console.log(`  Script:  ${scriptPath}`);
  console.log(`  Format:  ${format}`);
  console.log(`  Output:  ${output}`);
  console.log(`  Size:    ${options.width ?? 1920} × ${options.height ?? 1080}`);
  console.log(`  Mode:    ${mode}`);
  console.log();

  console.log("Loading script…");
  const walkthrough = await loadWalkthrough(scriptPath);
  console.log(`  Steps: ${walkthrough.steps.length}`);

  let recordWalkthrough: (
    wt: Walkthrough,
    opts: Record<string, unknown>,
  ) => Promise<{ outputPath: string; duration: number; frameCount: number }>;

  try {
    const mod = (await import("@walkrstudio/recorder")) as {
      recordWalkthrough: typeof recordWalkthrough;
    };
    recordWalkthrough = mod.recordWalkthrough;
  } catch {
    throw new Error("@walkrstudio/recorder is not installed. Run: pnpm add @walkrstudio/recorder");
  }

  console.log("Recording walkthrough…");
  let lastPercent = -1;

  let result: { outputPath: string; duration: number; frameCount: number };
  try {
    result = await recordWalkthrough(walkthrough, {
      format,
      output,
      width: options.width ?? 1920,
      height: options.height ?? 1080,
      fps: 30,
      realtime: options.realtime,
      onProgress: (percent: number) => {
        const rounded = Math.round(percent);
        if (rounded !== lastPercent && rounded % 5 === 0) {
          lastPercent = rounded;
          process.stdout.write(`\r  Recording… ${rounded}%`);
        }
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Could not find Chromium")) {
      throw new Error(
        "Could not find Chromium. Install chromium or set the CHROMIUM_PATH environment variable.\n" +
          "  Arch Linux: sudo pacman -S chromium\n" +
          "  Ubuntu/Debian: sudo apt install chromium-browser\n" +
          "  macOS: brew install --cask chromium",
      );
    }
    throw err;
  }

  process.stdout.write("\n");
  console.log("Encoding…");
  console.log();
  console.log(`Done: ${result.outputPath}`);
  console.log(`  Frames:   ${result.frameCount}`);
  console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);
}
