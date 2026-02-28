import type { CursorConfig, Step } from "@walkrstudio/core";

export interface WalkthroughDef {
  url: string;
  originalUrl?: string;
  title?: string;
  steps: Step[];
  cursor?: CursorConfig;
}

export type PlaybackStatus = "idle" | "playing" | "paused" | "done";
