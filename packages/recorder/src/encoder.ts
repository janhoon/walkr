import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import type { Walkthrough } from "@walkrstudio/core";
import { buildEmbedHtml } from "./embed.js";
import type { RecordOptions, RecordResult } from "./types.js";

const DEFAULT_FPS = 30;
const DEFAULT_FORMAT = "mp4";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getDefaultOutput = (format: RecordOptions["format"]): string => {
  if (format === "gif") {
    return "output.gif";
  }

  if (format === "webm") {
    return "output.webm";
  }

  if (format === "embed") {
    return "output.html";
  }

  return "output.mp4";
};

const buildFfmpegArgs = (
  inputPattern: string,
  outputPath: string,
  format: string,
  fps: number,
): string[] => {
  const inputArgs = ["-y", "-r", String(fps), "-i", inputPattern];

  if (format === "gif") {
    return [...inputArgs, "-vf", "fps=15,scale=1280:-1:flags=lanczos", outputPath];
  }

  if (format === "webm") {
    return [...inputArgs, "-c:v", "libvpx-vp9", outputPath];
  }

  return [...inputArgs, "-c:v", "libx264", "-pix_fmt", "yuv420p", outputPath];
};

const runFfmpeg = async (
  args: string[],
  onProgress: ((percent: number) => void) | undefined,
  frameCount: number,
  fps: number,
): Promise<void> => {
  const totalSeconds = frameCount / Math.max(1, fps);

  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    child.on("error", reject);

    if (!child.stderr || !onProgress) {
      return;
    }

    child.stderr.on("data", (chunk: Buffer) => {
      const output = chunk.toString();
      const match = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(output);
      if (!match) {
        return;
      }

      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      const seconds = Number(match[3]);
      const elapsedSeconds = hours * 3600 + minutes * 60 + seconds;

      const percent =
        totalSeconds > 0 ? Math.max(0, Math.min(100, (elapsedSeconds / totalSeconds) * 100)) : 100;
      onProgress(percent);
    });
  });
};

export async function encodeFrames(
  frames: Buffer[],
  options: RecordOptions & { walkthrough?: Walkthrough },
): Promise<RecordResult> {
  const format = options.format ?? DEFAULT_FORMAT;
  const fps = isFiniteNumber(options.fps) ? Math.max(1, Math.round(options.fps)) : DEFAULT_FPS;
  const outputPath = path.resolve(options.output ?? getDefaultOutput(format));
  const frameCount = frames.length;

  if (frameCount === 0) {
    throw new Error("No frames captured.");
  }

  if (format === "embed") {
    const html = buildEmbedHtml(
      frames,
      fps,
      options.walkthrough ?? { url: "about:blank", steps: [] },
    );
    await fs.writeFile(outputPath, html, "utf8");

    options.onProgress?.(100);

    return {
      outputPath,
      duration: Math.round((frameCount / fps) * 1000),
      frameCount,
    };
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "walkr-frames-"));

  try {
    await Promise.all(
      frames.map((frame, index) => {
        const frameName = `frame-${String(index + 1).padStart(4, "0")}.jpg`;
        return fs.writeFile(path.join(tempDir, frameName), frame);
      }),
    );

    const inputPattern = path.join(tempDir, "frame-%04d.jpg");
    const args = buildFfmpegArgs(inputPattern, outputPath, format, fps);

    await runFfmpeg(args, options.onProgress, frameCount, fps);
    options.onProgress?.(100);

    return {
      outputPath,
      duration: Math.round((frameCount / fps) * 1000),
      frameCount,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
