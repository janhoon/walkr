import type { Walkthrough, WalkthroughOptions } from "./types.js";

export const VERSION = "0.1.0";

export function walkr(options: WalkthroughOptions): Walkthrough {
  const { url, steps, title, description } = options;
  return {
    url,
    steps: [...steps],
    title,
    description,
  };
}

export * from "./types.js";
export * from "./steps.js";
export * from "./composers.js";
