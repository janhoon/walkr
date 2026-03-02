import { resetStepCounters } from "./steps.js";
import type { Walkthrough, WalkthroughOptions } from "./types.js";

export const VERSION = "0.1.0";

export function walkr(options: WalkthroughOptions): Walkthrough {
  resetStepCounters();
  const { url, steps, title, description, zoom, cursor, viewport } = options;
  return {
    url,
    steps: [...steps],
    title,
    description,
    zoom,
    cursor,
    viewport,
  };
}

export * from "./composers.js";
export * from "./steps.js";
export type { CursorConfig } from "./types.js";
export * from "./types.js";
