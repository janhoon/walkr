import { type ChildProcess, spawn } from "node:child_process";

import type { RecordResult } from "./types.js";

interface StreamingEncoderOptions {
  format: "mp4" | "gif" | "webm";
  fps: number;
  width: number;
  height: number;
  outputPath: string;
  onProgress?: (percent: number) => void;
  expectedFrames?: number;
}

export class StreamingEncoder {
  private child: ChildProcess;
  private exitPromise: Promise<void>;
  private frameCount = 0;
  private readonly fps: number;
  private readonly totalSeconds: number;
  private readonly onProgress?: (percent: number) => void;
  private readonly outputPath: string;

  constructor(options: StreamingEncoderOptions) {
    this.outputPath = options.outputPath;
    this.onProgress = options.onProgress;
    this.fps = options.fps;
    this.totalSeconds = (options.expectedFrames ?? 0) / Math.max(1, options.fps);

    const args = buildFfmpegArgs(options);
    this.child = spawn("ffmpeg", args, {
      stdio: ["pipe", "ignore", "pipe"],
    });

    this.exitPromise = new Promise<void>((resolve, reject) => {
      this.child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
      this.child.on("error", reject);
    });

    // Absorb stdin errors — they surface via exitPromise when ffmpeg exits
    this.child.stdin?.on("error", () => {});

    if (this.child.stderr && this.onProgress) {
      this.child.stderr.on("data", (chunk: Buffer) => {
        this.parseProgress(chunk.toString());
      });
    }
  }

  private parseProgress(output: string): void {
    if (!this.onProgress || this.totalSeconds <= 0) return;

    const match = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(output);
    if (!match) return;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const elapsedSeconds = hours * 3600 + minutes * 60 + seconds;

    const percent = Math.max(0, Math.min(100, (elapsedSeconds / this.totalSeconds) * 100));
    this.onProgress(percent);
  }

  async write(frame: Buffer): Promise<void> {
    const stdin = this.child.stdin;
    if (!stdin || stdin.destroyed) {
      throw new Error("ffmpeg stdin is not writable");
    }

    const ok = stdin.write(frame);
    if (!ok) {
      await new Promise<void>((resolve) => stdin.once("drain", resolve));
    }

    this.frameCount++;
  }

  async finish(): Promise<RecordResult> {
    this.child.stdin?.end();
    await this.exitPromise;

    this.onProgress?.(100);

    return {
      outputPath: this.outputPath,
      duration: Math.round((this.frameCount / this.fps) * 1000),
      frameCount: this.frameCount,
    };
  }

  abort(): void {
    this.child.kill("SIGTERM");
  }
}

function buildFfmpegArgs(options: StreamingEncoderOptions): string[] {
  const { format, fps, outputPath } = options;

  // Input: read concatenated JPEG frames from stdin (JPEG is self-delimiting)
  const inputArgs = ["-y", "-f", "image2pipe", "-c:v", "mjpeg", "-r", String(fps), "-i", "pipe:0"];

  if (format === "gif") {
    return [...inputArgs, "-vf", "fps=15,scale=1280:-1:flags=lanczos", outputPath];
  }

  if (format === "webm") {
    return [...inputArgs, "-c:v", "libvpx-vp9", outputPath];
  }

  // mp4
  return [...inputArgs, "-c:v", "libx264", "-pix_fmt", "yuv420p", outputPath];
}
