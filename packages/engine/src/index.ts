export const VERSION = "0.1.0";

export { WalkrEngine } from "./engine.js";
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
export {
  executeStep,
  getViewportState,
  initializeViewport,
  resetViewport,
} from "./executor.js";

export type * from "./types.js";
export type { ViewportState } from "./executor.js";
