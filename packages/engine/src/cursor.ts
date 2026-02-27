import {
  createEasingFromCssCubicBezier,
  cubicBezier,
  easeInOut,
  easeOut,
  linear,
  type EasingFunction,
} from "./bezier.js";
import type { CursorConfig } from "./types.js";

const DEFAULT_CURSOR_CONFIG = {
  shape: "circle",
  color: "#3b82f6",
  size: 24,
  shadow: false,
  clickColor: "#ef4444",
} as const;

const VISUAL_SELECTOR = "[data-walkr-cursor-visual]";
const SCROLL_INDICATOR_SELECTOR = "[data-walkr-scroll-indicator]";

const cursorAnimations = new WeakMap<HTMLElement, number>();

export interface ResolvedCursorConfig {
  shape: "circle" | "arrow" | "dot" | "svg";
  color: string;
  size: number;
  shadow: boolean;
  clickColor: string;
  svgContent?: string;
}

function clampSize(size: number | undefined): number {
  if (!Number.isFinite(size)) {
    return DEFAULT_CURSOR_CONFIG.size;
  }
  return Math.max(6, Math.round(size ?? DEFAULT_CURSOR_CONFIG.size));
}

export function resolveCursorConfig(config: Partial<CursorConfig> = {}): ResolvedCursorConfig {
  const shape = config.shape ?? DEFAULT_CURSOR_CONFIG.shape;

  return {
    shape,
    color: config.color ?? DEFAULT_CURSOR_CONFIG.color,
    size: clampSize(config.size),
    shadow: config.shadow ?? DEFAULT_CURSOR_CONFIG.shadow,
    clickColor: config.clickColor ?? DEFAULT_CURSOR_CONFIG.clickColor,
    svgContent: shape === "svg" ? config.svgContent : undefined,
  };
}

function readCursorConfig(cursor: HTMLElement): ResolvedCursorConfig {
  const raw = cursor.dataset.walkrCursorConfig;
  if (!raw) {
    return resolveCursorConfig();
  }

  try {
    return resolveCursorConfig(JSON.parse(raw) as Partial<CursorConfig>);
  } catch {
    return resolveCursorConfig();
  }
}

function writeCursorConfig(cursor: HTMLElement, config: ResolvedCursorConfig): void {
  cursor.dataset.walkrCursorConfig = JSON.stringify(config);
}

function getCursorVisual(cursor: HTMLElement): HTMLElement {
  const existing = cursor.querySelector(VISUAL_SELECTOR);
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const visual = document.createElement("div");
  visual.dataset.walkrCursorVisual = "true";
  cursor.appendChild(visual);
  return visual;
}

function resetVisualStyle(visual: HTMLElement): void {
  visual.innerHTML = "";
  visual.style.position = "relative";
  visual.style.display = "block";
  visual.style.width = "0";
  visual.style.height = "0";
  visual.style.background = "transparent";
  visual.style.border = "0";
  visual.style.borderRadius = "0";
  visual.style.clipPath = "";
  visual.style.opacity = "1";
  visual.style.boxShadow = "none";
  visual.style.filter = "none";
}

function applyCommonVisualStyle(visual: HTMLElement, config: ResolvedCursorConfig): void {
  const size = config.size;
  visual.style.width = `${size}px`;
  visual.style.height = `${size}px`;

  if (config.shadow) {
    visual.style.filter = "drop-shadow(0 4px 8px rgba(15, 23, 42, 0.35))";
  }
}

function applyCursorVisual(cursor: HTMLElement, config: ResolvedCursorConfig): void {
  const visual = getCursorVisual(cursor);
  resetVisualStyle(visual);

  if (config.shape === "dot") {
    const dotSize = Math.max(6, Math.round(config.size * 0.45));
    visual.style.width = `${dotSize}px`;
    visual.style.height = `${dotSize}px`;
    visual.style.borderRadius = "9999px";
    visual.style.background = config.color;
    visual.style.opacity = "1";
  } else if (config.shape === "arrow") {
    applyCommonVisualStyle(visual, config);
    visual.style.background = config.color;
    visual.style.clipPath =
      "polygon(0% 0%, 0% 100%, 36% 68%, 62% 100%, 80% 88%, 54% 56%, 100% 56%)";
    visual.style.borderRadius = "2px";
  } else if (config.shape === "svg" && config.svgContent) {
    applyCommonVisualStyle(visual, config);
    visual.innerHTML = config.svgContent;
    const first = visual.firstElementChild;
    if (first instanceof HTMLElement) {
      first.style.width = "100%";
      first.style.height = "100%";
      first.style.display = "block";
    }
  } else {
    applyCommonVisualStyle(visual, config);
    visual.style.borderRadius = "9999px";
    visual.style.background = config.color;
    visual.style.opacity = "0.85";
  }

  if (config.shadow) {
    visual.style.boxShadow = "0 6px 12px rgba(15, 23, 42, 0.25)";
  }

  writeCursorConfig(cursor, config);
}

function setCursorPosition(cursor: HTMLElement, x: number, y: number): void {
  const parentRect = cursor.parentElement?.getBoundingClientRect();
  const viewportX = (parentRect?.left ?? 0) + x;
  const viewportY = (parentRect?.top ?? 0) + y;

  cursor.style.left = `${viewportX}px`;
  cursor.style.top = `${viewportY}px`;
  cursor.dataset.walkrCursorX = String(x);
  cursor.dataset.walkrCursorY = String(y);
}

function parseEasing(easing: string): EasingFunction {
  const normalized = easing.trim();

  if (normalized === "linear") {
    return linear;
  }
  if (normalized === "ease-out" || normalized === "easeOut") {
    return easeOut;
  }
  if (normalized === "ease-in-out" || normalized === "easeInOut" || normalized === "ease") {
    return easeInOut;
  }

  const cubicBezierEasing = createEasingFromCssCubicBezier(normalized);
  if (cubicBezierEasing) {
    return cubicBezierEasing;
  }

  return easeInOut;
}

export function createCursor(config: CursorConfig = {}): HTMLElement {
  const cursor = document.createElement("div");
  cursor.dataset.walkrCursorX = "0";
  cursor.dataset.walkrCursorY = "0";
  cursor.style.position = "fixed";
  cursor.style.left = "-9999px";
  cursor.style.top = "-9999px";
  cursor.style.opacity = "1";
  cursor.style.pointerEvents = "none";
  cursor.style.zIndex = "99999";
  cursor.style.boxSizing = "border-box";
  cursor.style.transform = "translate(-50%, -50%)";
  cursor.style.willChange = "left, top, opacity";
  cursor.style.transition = "opacity 140ms ease-out";

  const visual = document.createElement("div");
  visual.dataset.walkrCursorVisual = "true";
  cursor.appendChild(visual);

  applyCursorVisual(cursor, resolveCursorConfig(config));
  return cursor;
}

export function updateCursorConfig(cursor: HTMLElement, config: Partial<CursorConfig>): void {
  const current = readCursorConfig(cursor);
  const merged = resolveCursorConfig({ ...current, ...config });
  applyCursorVisual(cursor, merged);
}

export async function moveCursorTo(
  cursor: HTMLElement,
  x: number,
  y: number,
  duration: number,
  easing: string,
): Promise<void> {
  const activeAnimation = cursorAnimations.get(cursor);
  if (activeAnimation !== undefined) {
    cancelAnimationFrame(activeAnimation);
  }

  const startX = Number(cursor.dataset.walkrCursorX ?? 0);
  const startY = Number(cursor.dataset.walkrCursorY ?? 0);
  const totalDuration = Math.max(0, duration);

  if (totalDuration === 0) {
    setCursorPosition(cursor, x, y);
    return;
  }

  const easingFn = parseEasing(easing);
  const dx = x - startX;
  const dy = y - startY;
  const distance = Math.hypot(dx, dy);
  const arcHeight = Math.min(120, Math.max(20, distance * 0.2));

  const p0: [number, number] = [startX, startY];
  const p1: [number, number] = [startX + dx * 0.2, startY - arcHeight];
  const p2: [number, number] = [startX + dx * 0.8, y - arcHeight];
  const p3: [number, number] = [x, y];

  await new Promise<void>((resolve) => {
    const startTime = performance.now();

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / totalDuration);
      const eased = easingFn(t);
      const [nextX, nextY] = cubicBezier(eased, p0, p1, p2, p3);
      setCursorPosition(cursor, nextX, nextY);

      if (t >= 1) {
        cursorAnimations.delete(cursor);
        resolve();
        return;
      }

      const animationId = requestAnimationFrame(tick);
      cursorAnimations.set(cursor, animationId);
    };

    const animationId = requestAnimationFrame(tick);
    cursorAnimations.set(cursor, animationId);
  });
}

export function showScrollIndicator(cursor: HTMLElement): void {
  const existing = cursor.querySelector(SCROLL_INDICATOR_SELECTOR);
  if (existing) {
    return;
  }

  const config = readCursorConfig(cursor);
  const indicator = document.createElement("div");
  indicator.dataset.walkrScrollIndicator = "true";
  indicator.style.position = "absolute";
  indicator.style.left = "50%";
  indicator.style.top = "calc(100% + 6px)";
  indicator.style.transform = "translateX(-50%)";
  indicator.style.width = "18px";
  indicator.style.height = "18px";
  indicator.style.color = config.color;
  indicator.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  cursor.appendChild(indicator);
}

export function hideScrollIndicator(cursor: HTMLElement): void {
  const indicator = cursor.querySelector(SCROLL_INDICATOR_SELECTOR);
  if (indicator instanceof HTMLElement) {
    indicator.remove();
  }
}

export function showClickRipple(cursor: HTMLElement, x: number, y: number, color: string): void {
  const root = cursor.ownerDocument.body;
  if (!root) {
    return;
  }

  const parentRect = cursor.parentElement?.getBoundingClientRect();
  const viewportX = (parentRect?.left ?? 0) + x;
  const viewportY = (parentRect?.top ?? 0) + y;

  const ripple = document.createElement("div");
  ripple.style.position = "fixed";
  ripple.style.left = `${viewportX}px`;
  ripple.style.top = `${viewportY}px`;
  ripple.style.width = "14px";
  ripple.style.height = "14px";
  ripple.style.marginLeft = "-7px";
  ripple.style.marginTop = "-7px";
  ripple.style.border = `2px solid ${color}`;
  ripple.style.borderRadius = "999px";
  ripple.style.pointerEvents = "none";
  ripple.style.zIndex = "99998";

  root.appendChild(ripple);

  const animation = ripple.animate(
    [
      { transform: "scale(0.2)", opacity: 0.9 },
      { transform: "scale(2.8)", opacity: 0 },
    ],
    {
      duration: 360,
      easing: "cubic-bezier(0, 0, 0.2, 1)",
      fill: "forwards",
    },
  );

  const remove = (): void => {
    ripple.remove();
  };

  animation.addEventListener("finish", remove, { once: true });
  window.setTimeout(remove, 450);
}

export function hideCursor(cursor: HTMLElement): void {
  cursor.style.opacity = "0";
}

export function showCursor(cursor: HTMLElement): void {
  cursor.style.opacity = "1";
}
