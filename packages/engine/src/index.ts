/**
 * @walkrstudio/engine — Browser playback engine for Walkr walkthroughs.
 *
 * ## Quick start
 *
 * ```ts
 * import { WalkrEngine } from "@walkrstudio/engine";
 *
 * const engine = new WalkrEngine();
 * engine.mount(document.getElementById("walkr")!);
 * await engine.play(myWalkthrough);
 * ```
 *
 * {@link WalkrEngine} is the **canonical and only supported** entry point for
 * running walkthroughs programmatically. The previously experimental
 * `WalkrPlayer` class has been removed.
 *
 * @packageDocumentation
 */

export const VERSION = "0.1.0";

export { cubicBezier, easeInOut, easeOut, linear } from "./bezier.js";
export {
  createCursor,
  hideCursor,
  hideScrollIndicator,
  moveCursorTo,
  showClickRipple,
  showCursor,
  showScrollIndicator,
  updateCursorConfig,
} from "./cursor.js";

// ---------------------------------------------------------------------------
// Primary API — use WalkrEngine for all walkthrough playback
// ---------------------------------------------------------------------------

export { WalkrEngine } from "./engine.js";

export type { ViewportState } from "./executor.js";
export {
  executeStep,
  getViewportState,
  initializeViewport,
  resetViewport,
} from "./executor.js";
export { StepError } from "./types.js";
export type * from "./types.js";

// ---------------------------------------------------------------------------
// Deprecated alias — WalkrPlayer has been merged into WalkrEngine
// ---------------------------------------------------------------------------

/**
 * @deprecated `WalkrPlayer` has been removed. Use {@link WalkrEngine} instead.
 *
 * This alias exists only to ease migration. It will be removed in a future
 * major version.
 */
export { WalkrEngine as WalkrPlayer } from "./engine.js";
