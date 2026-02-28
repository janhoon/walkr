import { setTimeout as sleep } from "node:timers/promises";

import { chromium } from "@playwright/test";

import type { Step, Walkthrough } from "@walkrstudio/core";
import { encodeFrames } from "./encoder.js";
import type { CaptureOptions, CaptureResult } from "./types.js";

interface InternalCaptureOptions extends CaptureOptions {
  walkthrough?: Walkthrough;
  onPhaseChange?: (phase: "capture" | "encode") => void;
}

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_FPS = 30;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getStepDuration = (step: Step): number => {
  if (step.type === "sequence") {
    const nested = (step.options as { steps?: Step[] }).steps ?? [];
    return nested.reduce((total, nestedStep) => total + getStepDuration(nestedStep), 0);
  }

  if (step.type === "parallel") {
    const nested = (step.options as { steps?: Step[] }).steps ?? [];
    return nested.reduce((max, nestedStep) => Math.max(max, getStepDuration(nestedStep)), 0);
  }

  return Math.max(0, step.duration);
};

const getRenderableStepCount = (steps: Step[]): number => {
  if (steps.length === 0) {
    return 1;
  }

  return steps.reduce((count, step) => {
    if (step.type === "sequence" || step.type === "parallel") {
      const nested = (step.options as { steps?: Step[] }).steps ?? [];
      return count + getRenderableStepCount(nested);
    }
    return count + 1;
  }, 0);
};

const applyCursorPosition = async (
  page: {
    evaluate: (
      cb: (point: { x: number; y: number }) => void,
      arg: { x: number; y: number },
    ) => Promise<void>;
  },
  x: number,
  y: number,
): Promise<void> => {
  await page.evaluate(
    (point) => {
      const cursor = document.getElementById("walkr-playwright-cursor");
      if (!cursor) {
        return;
      }

      cursor.setAttribute("data-x", String(point.x));
      cursor.setAttribute("data-y", String(point.y));
      cursor.setAttribute(
        "style",
        [
          "position: fixed",
          "width: 16px",
          "height: 16px",
          "border-radius: 9999px",
          "border: 2px solid #ffffff",
          "background: rgba(59, 130, 246, 0.55)",
          "box-shadow: 0 0 8px rgba(15, 23, 42, 0.55)",
          "pointer-events: none",
          "z-index: 2147483647",
          `left: ${point.x}px`,
          `top: ${point.y}px`,
          "transform: translate(-50%, -50%)",
        ].join(";"),
      );
    },
    { x, y },
  );
};

const highlightSelector = async (
  page: {
    evaluate: (
      cb: (payload: { selector: string; color: string }) => void,
      arg: { selector: string; color: string },
    ) => Promise<void>;
  },
  selector: string,
  color: string,
): Promise<void> => {
  await page.evaluate(
    (payload) => {
      const previous = document.getElementById("walkr-playwright-highlight");
      if (previous) {
        previous.remove();
      }

      const target = document.querySelector(payload.selector);
      if (!target) {
        return;
      }

      const box = target.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.id = "walkr-playwright-highlight";
      overlay.setAttribute(
        "style",
        [
          "position: fixed",
          "pointer-events: none",
          "z-index: 2147483646",
          `left: ${box.left}px`,
          `top: ${box.top}px`,
          `width: ${box.width}px`,
          `height: ${box.height}px`,
          `border: 3px solid ${payload.color}`,
          "border-radius: 8px",
          `box-shadow: 0 0 0 9999px ${payload.color}1a`,
        ].join(";"),
      );

      document.body.appendChild(overlay);
    },
    { selector, color },
  );
};

const clearHighlight = async (page: {
  evaluate: (cb: () => void) => Promise<void>;
}): Promise<void> => {
  await page.evaluate(() => {
    const overlay = document.getElementById("walkr-playwright-highlight");
    overlay?.remove();
  });
};

export async function captureWalkthrough(
  walkthrough: Walkthrough,
  options: CaptureOptions = {},
): Promise<CaptureResult> {
  const internalOptions = options as InternalCaptureOptions;
  const width = isFiniteNumber(options.width)
    ? Math.max(1, Math.round(options.width))
    : DEFAULT_WIDTH;
  const height = isFiniteNumber(options.height)
    ? Math.max(1, Math.round(options.height))
    : DEFAULT_HEIGHT;
  const fps = isFiniteNumber(options.fps) ? Math.max(1, Math.round(options.fps)) : DEFAULT_FPS;
  const frameIntervalMs = 1000 / fps;

  const totalDurationMs = walkthrough.steps.reduce(
    (total, step) => total + getStepDuration(step),
    0,
  );
  const estimatedFrameCount = Math.max(
    1,
    Math.ceil(totalDurationMs / frameIntervalMs),
    getRenderableStepCount(walkthrough.steps),
  );

  const frames: Buffer[] = [];
  let capturedFrameCount = 0;

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(walkthrough.url, { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      let cursor = document.getElementById("walkr-playwright-cursor");
      if (!cursor) {
        cursor = document.createElement("div");
        cursor.id = "walkr-playwright-cursor";
        document.body.appendChild(cursor);
      }
    });

    let cursorX = width / 2;
    let cursorY = height / 2;
    await page.mouse.move(cursorX, cursorY);
    await applyCursorPosition(page, cursorX, cursorY);

    internalOptions.onPhaseChange?.("capture");

    const captureFrame = async (): Promise<void> => {
      const frame = (await page.screenshot({ type: "png" })) as Buffer;
      frames.push(frame);
      capturedFrameCount += 1;
      internalOptions.onProgress?.(Math.min(100, (capturedFrameCount / estimatedFrameCount) * 100));
    };

    const captureForDuration = async (
      durationMs: number,
      onFrame?: (ratio: number) => Promise<void>,
    ): Promise<void> => {
      const effectiveDuration = Math.max(0, durationMs);
      const frameCount = Math.max(1, Math.ceil(effectiveDuration / frameIntervalMs));

      for (let index = 0; index < frameCount; index += 1) {
        const ratio = frameCount === 1 ? 1 : index / (frameCount - 1);
        if (onFrame) {
          await onFrame(ratio);
        }

        await captureFrame();

        if (index < frameCount - 1) {
          await sleep(frameIntervalMs);
        }
      }
    };

    const executeStep = async (step: Step): Promise<void> => {
      const durationMs = Math.max(0, step.duration);

      if (step.type === "sequence") {
        const nested = (step.options as { steps?: Step[] }).steps ?? [];
        for (const nestedStep of nested) {
          await executeStep(nestedStep);
        }
        return;
      }

      if (step.type === "parallel") {
        const nested = (step.options as { steps?: Step[] }).steps ?? [];
        for (const nestedStep of nested) {
          await executeStep(nestedStep);
        }
        return;
      }

      if (step.type === "moveTo") {
        const selector = String((step.options as { selector?: unknown }).selector ?? "");
        const center = selector
          ? await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return null;
              const rect = el.getBoundingClientRect();
              return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            }, selector)
          : null;
        if (!center) {
          await captureForDuration(durationMs || frameIntervalMs);
          return;
        }
        const startX = cursorX;
        const startY = cursorY;

        await captureForDuration(durationMs, async (ratio) => {
          const nextX = startX + (center.x - startX) * ratio;
          const nextY = startY + (center.y - startY) * ratio;
          await page.mouse.move(nextX, nextY);
          await applyCursorPosition(page, nextX, nextY);
          cursorX = nextX;
          cursorY = nextY;
        });

        return;
      }

      if (step.type === "moveToCoords") {
        const targetX = Number((step.options as { x?: unknown }).x ?? cursorX);
        const targetY = Number((step.options as { y?: unknown }).y ?? cursorY);
        const startX = cursorX;
        const startY = cursorY;

        await captureForDuration(durationMs, async (ratio) => {
          const nextX = startX + (targetX - startX) * ratio;
          const nextY = startY + (targetY - startY) * ratio;
          await page.mouse.move(nextX, nextY);
          await applyCursorPosition(page, nextX, nextY);
          cursorX = nextX;
          cursorY = nextY;
        });

        return;
      }

      if (step.type === "click") {
        const selector = String((step.options as { selector?: unknown }).selector ?? "");
        const center = selector
          ? await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return null;
              const rect = el.getBoundingClientRect();
              return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            }, selector)
          : null;
        if (!center) {
          await captureForDuration(durationMs || frameIntervalMs);
          return;
        }
        const double = Boolean((step.options as { double?: unknown }).double ?? false);
        const button = (step.options as { button?: "left" | "middle" | "right" }).button ?? "left";

        await page.mouse.move(center.x, center.y);
        await applyCursorPosition(page, center.x, center.y);
        cursorX = center.x;
        cursorY = center.y;

        await page.mouse.click(center.x, center.y, {
          button,
          clickCount: double ? 2 : 1,
        });

        await captureForDuration(durationMs || frameIntervalMs);
        return;
      }

      if (step.type === "clickCoords") {
        const x = Number((step.options as { x?: unknown }).x ?? cursorX);
        const y = Number((step.options as { y?: unknown }).y ?? cursorY);
        const double = Boolean((step.options as { double?: unknown }).double ?? false);
        const button = (step.options as { button?: "left" | "middle" | "right" }).button ?? "left";

        await page.mouse.move(x, y);
        await applyCursorPosition(page, x, y);
        cursorX = x;
        cursorY = y;

        await page.mouse.click(x, y, {
          button,
          clickCount: double ? 2 : 1,
        });

        await captureForDuration(durationMs || frameIntervalMs);
        return;
      }

      if (step.type === "type") {
        const text = String((step.options as { text?: unknown }).text ?? "");
        const selector = (step.options as { selector?: unknown }).selector;
        const delay = Number((step.options as { delay?: unknown }).delay ?? 40);

        if (typeof selector === "string" && selector.length > 0) {
          const element = page.locator(selector).first();
          if (await element.count()) {
            await element.click();
          }
        }

        if (text.length > 0) {
          for (let index = 0; index < text.length; index += 1) {
            const char = text[index];
            await page.keyboard.type(char, { delay: 0 });
            await captureForDuration(0);
            if (delay > 0 && index < text.length - 1) {
              await sleep(delay);
            }
          }
        } else {
          await captureForDuration(0);
        }

        const consumedDuration = Math.max(0, text.length * Math.max(0, delay));
        if (durationMs > consumedDuration) {
          await captureForDuration(durationMs - consumedDuration);
        }

        return;
      }

      if (step.type === "scroll") {
        const x = Number((step.options as { x?: unknown }).x ?? 0);
        const y = Number((step.options as { y?: unknown }).y ?? 0);

        await page.evaluate(
          ({ scrollX, scrollY }) => {
            window.scrollTo(scrollX, scrollY);
          },
          { scrollX: x, scrollY: y },
        );

        await captureForDuration(durationMs || frameIntervalMs);
        return;
      }

      if (step.type === "highlight") {
        const selector = String((step.options as { selector?: unknown }).selector ?? "");
        const color = String((step.options as { color?: unknown }).color ?? "#facc15");

        if (selector) {
          await highlightSelector(page, selector, color);
        }

        await captureForDuration(durationMs || frameIntervalMs);
        await clearHighlight(page);
        return;
      }

      if (step.type === "wait" || step.type === "zoom" || step.type === "pan") {
        await captureForDuration(durationMs || frameIntervalMs);
        return;
      }

      await captureForDuration(durationMs || frameIntervalMs);
    };

    for (const step of walkthrough.steps) {
      await executeStep(step);
    }

    internalOptions.onProgress?.(100);
    internalOptions.onPhaseChange?.("encode");

    return await encodeFrames(frames, {
      ...internalOptions,
      width,
      height,
      fps,
      walkthrough,
    });
  } finally {
    await browser.close();
  }
}
