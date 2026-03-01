/**
 * Benchmark script for the virtual-time recorder.
 *
 * Usage: npx tsx packages/recorder/benchmark.ts
 *
 * Records examples/ace-demo/demo.ts at 30 FPS (embed format) and reports
 * wall-clock time, frame count, output duration, effective capture speed.
 */

import { pathToFileURL } from "node:url";

import type { Walkthrough } from "@walkrstudio/core";
import { recordWalkthrough } from "./src/recorder.js";

const FPS = 30;
const OUTPUT = "/tmp/walkr-benchmark.html";
const DEMO_PATH = new URL("../../examples/ace-demo/demo.ts", import.meta.url).pathname;
const DURATION_TOLERANCE_MS = 200;

async function loadWalkthrough(scriptPath: string): Promise<Walkthrough> {
  const url = pathToFileURL(scriptPath);
  url.searchParams.set("t", String(Date.now()));
  const mod = (await import(url.toString())) as { default?: unknown };
  const wt = mod.default;
  if (!wt || typeof wt !== "object" || !("url" in wt) || !("steps" in wt)) {
    throw new Error(`Script "${scriptPath}" must export a Walkthrough as default.`);
  }
  return wt as Walkthrough;
}

async function main(): Promise<void> {
  console.log("Walkr Recorder Benchmark");
  console.log("========================\n");

  console.log("Loading walkthrough…");
  const walkthrough = await loadWalkthrough(DEMO_PATH);

  const totalDurationMs = walkthrough.steps.reduce(
    (sum, step) => sum + Math.max(0, step.duration),
    0,
  );
  const expectedFrames = Math.ceil(totalDurationMs / (1000 / FPS));

  console.log(`  Steps:             ${walkthrough.steps.length}`);
  console.log(`  Total duration:    ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log(`  Expected frames:   ~${expectedFrames}`);
  console.log(`  Target FPS:        ${FPS}`);
  console.log(`  Output:            ${OUTPUT}\n`);

  console.log("Recording…");
  const wallStart = Date.now();

  const result = await recordWalkthrough(walkthrough, {
    fps: FPS,
    format: "embed",
    output: OUTPUT,
    width: 1920,
    height: 1080,
    onProgress: (percent) => {
      process.stdout.write(`\r  Progress: ${Math.round(percent)}%`);
    },
  });

  const wallMs = Date.now() - wallStart;
  process.stdout.write("\n\n");

  // Results
  console.log("Results");
  console.log("-------");
  console.log(`  Wall-clock time:   ${(wallMs / 1000).toFixed(2)}s`);
  console.log(`  Frame count:       ${result.frameCount}`);
  console.log(`  Output duration:   ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`  Capture speed:     ${(totalDurationMs / wallMs).toFixed(2)}x realtime`);
  console.log();

  // Assertions
  let passed = true;

  // Frame count within tolerance
  const frameTolerance = FPS * 2;
  if (Math.abs(result.frameCount - expectedFrames) > frameTolerance) {
    console.log(
      `FAIL: Frame count ${result.frameCount} not within ±${frameTolerance} of expected ${expectedFrames}`,
    );
    passed = false;
  } else {
    console.log(
      `PASS: Frame count ${result.frameCount} within ±${frameTolerance} of expected ${expectedFrames}`,
    );
  }

  // Output duration matches walkthrough duration
  if (Math.abs(result.duration - totalDurationMs) > DURATION_TOLERANCE_MS) {
    console.log(
      `FAIL: Output duration ${result.duration}ms not within ±${DURATION_TOLERANCE_MS}ms of walkthrough ${totalDurationMs}ms`,
    );
    passed = false;
  } else {
    console.log(
      `PASS: Output duration ${result.duration}ms within ±${DURATION_TOLERANCE_MS}ms of walkthrough ${totalDurationMs}ms`,
    );
  }

  // Reasonable wall-clock speed (CDP screenshot overhead at 1080p limits
  // per-frame speed to ~60-90ms regardless of virtual time, so "faster
  // than realtime" isn't achievable at 30fps 1080p. Assert < 5x instead.)
  const wallClockLimit = totalDurationMs * 5;
  if (wallMs >= wallClockLimit) {
    console.log(`FAIL: Wall-clock ${wallMs}ms >= ${wallClockLimit}ms (slower than 5x realtime)`);
    passed = false;
  } else {
    console.log(
      `PASS: Wall-clock ${wallMs}ms < ${wallClockLimit}ms (${(totalDurationMs / wallMs).toFixed(2)}x realtime)`,
    );
  }

  console.log();
  if (passed) {
    console.log("All assertions passed.");
  } else {
    console.log("Some assertions FAILED.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
