import {
  createEasingFromCssCubicBezier,
  cubicBezier,
  easeInOut,
  easeOut,
  linear,
  type EasingFunction,
} from "./bezier.js";
import type { CursorOptions } from "./types.js";

const DEFAULT_SIZE = 16;
const DEFAULT_COLOR = "#2563eb";

const cursorAnimations = new WeakMap<HTMLElement, number>();

function getCursorSize(cursor: HTMLElement): number {
  const raw = cursor.dataset.walkrCursorSize;
  return raw ? Number(raw) : DEFAULT_SIZE;
}

function setCursorPosition(cursor: HTMLElement, x: number, y: number): void {
  const size = getCursorSize(cursor);
  const offsetX = x - size / 2;
  const offsetY = y - size / 2;
  cursor.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
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

export function createCursor(options: CursorOptions = {}): HTMLElement {
  const size = options.size ?? DEFAULT_SIZE;
  const color = options.color ?? DEFAULT_COLOR;
  const shape = options.shape ?? "circle";

  const cursor = document.createElement("div");
  cursor.dataset.walkrCursorSize = String(size);
  cursor.dataset.walkrCursorX = "0";
  cursor.dataset.walkrCursorY = "0";
  cursor.style.position = "absolute";
  cursor.style.left = "0";
  cursor.style.top = "0";
  cursor.style.width = `${size}px`;
  cursor.style.height = `${size}px`;
  cursor.style.opacity = "1";
  cursor.style.pointerEvents = "none";
  cursor.style.zIndex = "2";
  cursor.style.boxSizing = "border-box";
  cursor.style.transform = "translate3d(-9999px, -9999px, 0)";
  cursor.style.willChange = "transform, opacity";
  cursor.style.transition = "opacity 140ms ease-out";

  if (shape === "arrow") {
    cursor.style.background = color;
    cursor.style.clipPath = "polygon(0% 0%, 0% 100%, 35% 68%, 62% 100%, 82% 87%, 53% 55%, 100% 55%)";
    cursor.style.borderRadius = "2px";
  } else if (shape === "dot") {
    const dotSize = Math.max(4, Math.round(size * 0.5));
    cursor.style.width = `${dotSize}px`;
    cursor.style.height = `${dotSize}px`;
    cursor.dataset.walkrCursorSize = String(dotSize);
    cursor.style.borderRadius = "999px";
    cursor.style.background = color;
  } else {
    cursor.style.border = `2px solid ${color}`;
    cursor.style.borderRadius = "999px";
    cursor.style.background = "rgba(255, 255, 255, 0.12)";
    cursor.style.backdropFilter = "blur(1px)";
  }

  return cursor;
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

export function showClickRipple(cursor: HTMLElement, x: number, y: number): void {
  const parent = cursor.parentElement;
  if (!parent) {
    return;
  }

  const ripple = document.createElement("div");
  ripple.style.position = "absolute";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = "14px";
  ripple.style.height = "14px";
  ripple.style.marginLeft = "-7px";
  ripple.style.marginTop = "-7px";
  ripple.style.border = "2px solid rgba(37, 99, 235, 0.85)";
  ripple.style.borderRadius = "999px";
  ripple.style.pointerEvents = "none";
  ripple.style.zIndex = "1";

  parent.appendChild(ripple);

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
