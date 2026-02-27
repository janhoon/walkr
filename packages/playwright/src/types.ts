export interface CaptureOptions {
  width?: number;
  height?: number;
  fps?: number;
  format?: "mp4" | "gif" | "webm" | "embed";
  output?: string;
  onProgress?: (percent: number) => void;
}

export interface CaptureResult {
  outputPath: string;
  duration: number;
  frameCount: number;
}
