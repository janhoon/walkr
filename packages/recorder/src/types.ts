export interface RecordOptions {
  width?: number;
  height?: number;
  fps?: number;
  format?: "mp4" | "gif" | "webm" | "embed";
  output?: string;
  onProgress?: (percent: number) => void;
}

export interface RecordResult {
  outputPath: string;
  duration: number;
  frameCount: number;
}
