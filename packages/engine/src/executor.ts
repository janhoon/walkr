import {
  hideScrollIndicator,
  moveCursorTo,
  showClickRipple,
  showScrollIndicator,
} from "./cursor.js";
import type {
  ClickCoordsStep,
  ClickStep,
  CursorConfig,
  DragStep,
  HighlightStep,
  MouseButton,
  MoveToCoordsStep,
  MoveToStep,
  NarrateStep,
  PanStep,
  ParallelStep,
  ScrollStep,
  SequenceStep,
  Step,
  TooltipPosition,
  TooltipStep,
  TypeStep,
  WaitForNavigationStep,
  WaitForSelectorStep,
  WaitStep,
  ZoomDefaults,
  ZoomStep,
} from "./types.js";
import { StepError } from "./types.js";
import type { StepResult } from "./types.js";

const DEFAULT_MOVE_DURATION = 520;
const DEFAULT_TYPE_DELAY = 40;
const DEFAULT_ZOOM_DURATION = 360;
const DEFAULT_PAN_DURATION = 360;
const DEFAULT_HIGHLIGHT_DURATION = 700;
const DEFAULT_TOOLTIP_DURATION = 3000;
const DEFAULT_DRAG_DURATION = 1000;
const DEFAULT_VIEWPORT_EASING = "cubic-bezier(0.42, 0, 0.58, 1)";

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

type ViewportTransformState = ViewportState & {
  originX: number;
  originY: number;
};

interface StepExecutionContext {
  getCursorConfig?: () => CursorConfig;
  setCursorConfig?: (config: Partial<CursorConfig>) => void;
  showScrollIndicator?: (cursor: HTMLElement) => void;
  hideScrollIndicator?: (cursor: HTMLElement) => void;
  zoomDefaults?: ZoomDefaults;
  /** Enable verbose step execution logging to the console. */
  debug?: boolean;
  /** Called when a step encounters an error (e.g. selector not found). */
  onStepError?: (error: StepError, step: Step) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeEasing(easing?: string): string {
  const value = easing?.trim();

  if (!value || value === "ease" || value === "easeInOut" || value === "ease-in-out") {
    return DEFAULT_VIEWPORT_EASING;
  }
  if (value === "easeOut" || value === "ease-out") {
    return "cubic-bezier(0, 0, 0.58, 1)";
  }
  if (value === "linear") {
    return "linear";
  }

  return value;
}

function toTransform(state: ViewportTransformState): string {
  return `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
}

function toTransformOrigin(state: ViewportTransformState): string {
  return `${state.originX}% ${state.originY}%`;
}

function readTransformState(wrapper: HTMLElement): ViewportTransformState {
  const panX = Number(wrapper.dataset.walkrPanX ?? 0);
  const panY = Number(wrapper.dataset.walkrPanY ?? 0);
  const zoom = Number(wrapper.dataset.walkrScale ?? 1);
  const originX = Number(wrapper.dataset.walkrOriginX ?? 50);
  const originY = Number(wrapper.dataset.walkrOriginY ?? 50);

  return {
    panX: Number.isFinite(panX) ? panX : 0,
    panY: Number.isFinite(panY) ? panY : 0,
    zoom: Number.isFinite(zoom) ? zoom : 1,
    originX: Number.isFinite(originX) ? originX : 50,
    originY: Number.isFinite(originY) ? originY : 50,
  };
}

function writeTransformState(wrapper: HTMLElement, state: ViewportTransformState): void {
  wrapper.dataset.walkrPanX = String(state.panX);
  wrapper.dataset.walkrPanY = String(state.panY);
  wrapper.dataset.walkrScale = String(state.zoom);
  wrapper.dataset.walkrOriginX = String(state.originX);
  wrapper.dataset.walkrOriginY = String(state.originY);
  wrapper.style.transformOrigin = toTransformOrigin(state);
  wrapper.style.transform = toTransform(state);
}

async function animateTransformState(
  wrapper: HTMLElement,
  nextState: ViewportTransformState,
  duration: number,
  easing?: string,
): Promise<void> {
  const previousState = readTransformState(wrapper);
  const fromTransform = toTransform(previousState);
  const toTransformValue = toTransform(nextState);
  const animationDuration = Math.max(0, duration);

  wrapper.style.transformOrigin = toTransformOrigin(nextState);

  if (animationDuration === 0) {
    writeTransformState(wrapper, nextState);
    return;
  }

  const animation = wrapper.animate(
    [{ transform: fromTransform }, { transform: toTransformValue }],
    {
      duration: animationDuration,
      easing: normalizeEasing(easing),
      fill: "forwards",
    },
  );

  try {
    await animation.finished;
  } catch {
    // Ignored: animation may be canceled by another viewport update.
  }

  writeTransformState(wrapper, nextState);
}

function getFrameDocument(iframe: HTMLIFrameElement): Document | null {
  try {
    return iframe.contentDocument ?? iframe.contentWindow?.document ?? null;
  } catch {
    return null;
  }
}

function getFrameWindow(iframe: HTMLIFrameElement): Window | null {
  try {
    return iframe.contentWindow;
  } catch {
    return null;
  }
}

function getButtonCode(button: MouseButton | undefined): number {
  if (button === "middle") {
    return 1;
  }
  if (button === "right") {
    return 2;
  }
  return 0;
}

function isHtmlElement(doc: Document, value: Element | null): value is HTMLElement {
  const view = doc.defaultView;
  if (!view || !value) {
    return false;
  }
  return value instanceof view.HTMLElement;
}

function isInputLike(
  doc: Document,
  value: HTMLElement,
): value is HTMLInputElement | HTMLTextAreaElement {
  const view = doc.defaultView;
  if (!view) {
    return false;
  }
  return value instanceof view.HTMLInputElement || value instanceof view.HTMLTextAreaElement;
}

function dispatchMouse(
  doc: Document,
  target: Element,
  type: string,
  x: number,
  y: number,
  button: number,
): void {
  const MouseEventCtor = doc.defaultView?.MouseEvent ?? MouseEvent;
  target.dispatchEvent(
    new MouseEventCtor(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button,
    }),
  );
}

function dispatchKeyboard(doc: Document, target: Element, type: string, key: string): void {
  const KeyboardEventCtor = doc.defaultView?.KeyboardEvent ?? KeyboardEvent;
  target.dispatchEvent(
    new KeyboardEventCtor(type, {
      bubbles: true,
      cancelable: true,
      key,
    }),
  );
}

function applyCharacter(doc: Document, target: HTMLElement, char: string): void {
  if (isInputLike(doc, target)) {
    target.value += char;
    const InputEventCtor = doc.defaultView?.InputEvent ?? InputEvent;
    target.dispatchEvent(
      new InputEventCtor("input", {
        bubbles: true,
        cancelable: false,
        data: char,
        inputType: "insertText",
      }),
    );
    return;
  }

  if (target.isContentEditable) {
    target.textContent = `${target.textContent ?? ""}${char}`;
    const EventCtor = doc.defaultView?.Event ?? Event;
    target.dispatchEvent(new EventCtor("input", { bubbles: true, cancelable: false }));
    return;
  }

  target.textContent = `${target.textContent ?? ""}${char}`;
}

function withHexAlpha(color: string, alpha: string): string {
  if (/^#([A-Fa-f0-9]{6})$/.test(color)) {
    return `${color}${alpha}`;
  }
  if (/^#([A-Fa-f0-9]{3})$/.test(color)) {
    const [, raw] = /^#([A-Fa-f0-9]{3})$/.exec(color) ?? [];
    if (raw) {
      return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}${alpha}`;
    }
  }
  return color;
}

function withAlpha(color: string): string {
  return withHexAlpha(color, "40");
}

function getCursorPosition(cursor: HTMLElement): { x: number; y: number } {
  return {
    x: Number(cursor.dataset.walkrCursorX ?? 0),
    y: Number(cursor.dataset.walkrCursorY ?? 0),
  };
}

function getStepCursorOverride(step: Step): Partial<CursorConfig> | undefined {
  if (!step.options || typeof step.options !== "object") {
    return undefined;
  }

  const value = (step.options as { cursor?: Partial<CursorConfig> }).cursor;
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return value;
}

export function getViewportState(wrapper: HTMLElement): ViewportState {
  const state = readTransformState(wrapper);
  return {
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
  };
}

export async function resetViewport(
  wrapper: HTMLElement,
  options: {
    duration?: number;
    easing?: string;
    defaultLevel?: number;
  } = {},
): Promise<void> {
  await animateTransformState(
    wrapper,
    {
      panX: 0,
      panY: 0,
      zoom: Math.max(0.05, options.defaultLevel ?? 1),
      originX: 50,
      originY: 50,
    },
    options.duration ?? DEFAULT_PAN_DURATION,
    options.easing,
  );
}

export function initializeViewport(wrapper: HTMLElement): void {
  writeTransformState(wrapper, {
    panX: 0,
    panY: 0,
    zoom: 1,
    originX: 50,
    originY: 50,
  });
}

function sleep(ms: number): Promise<void> {
  const duration = Math.max(0, ms);
  if (duration === 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const start = performance.now();

    const tick = (now: number): void => {
      if (now - start >= duration) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

function resolveElementCenter(doc: Document, selector: string): { x: number; y: number } | null {
  const el = doc.querySelector(selector);
  if (!el) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

async function executeMoveTo(
  step: MoveToStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
): Promise<void> {
  const doc = getFrameDocument(iframe);
  if (!doc) {
    throw new StepError({
      stepType: "moveTo",
      selector: step.options.selector,
      reason: "no-document",
    });
  }
  const center = resolveElementCenter(doc, step.options.selector);
  if (!center) {
    throw new StepError({
      stepType: "moveTo",
      selector: step.options.selector,
      reason: "not-found",
    });
  }
  const duration = Math.max(0, step.options.duration ?? step.duration ?? DEFAULT_MOVE_DURATION);
  const easing = step.options.easing ?? "easeInOut";
  await moveCursorTo(cursor, center.x, center.y, duration, easing);
}

async function executeMoveToCoords(step: MoveToCoordsStep, cursor: HTMLElement): Promise<void> {
  const duration = Math.max(0, step.options.duration ?? step.duration ?? DEFAULT_MOVE_DURATION);
  const easing = step.options.easing ?? "easeInOut";
  await moveCursorTo(cursor, step.options.x, step.options.y, duration, easing);
}

async function executeClick(
  step: ClickStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
  const doc = getFrameDocument(iframe);
  if (!doc) {
    throw new StepError({
      stepType: "click",
      selector: step.options.selector,
      reason: "no-document",
    });
  }

  const center = resolveElementCenter(doc, step.options.selector);
  if (!center) {
    throw new StepError({
      stepType: "click",
      selector: step.options.selector,
      reason: "not-found",
    });
  }

  await moveCursorTo(cursor, center.x, center.y, 120, "easeOut");
  const clickColor = context?.getCursorConfig?.().clickColor ?? "#ef4444";
  showClickRipple(cursor, center.x, center.y, clickColor);

  const target = doc.querySelector(step.options.selector);
  if (!target) {
    throw new StepError({
      stepType: "click",
      selector: step.options.selector,
      reason: "not-found",
    });
  }

  const button = getButtonCode(step.options.button);

  dispatchMouse(doc, target, "pointerdown", center.x, center.y, button);
  dispatchMouse(doc, target, "mousedown", center.x, center.y, button);
  dispatchMouse(doc, target, "pointerup", center.x, center.y, button);
  dispatchMouse(doc, target, "mouseup", center.x, center.y, button);
  dispatchMouse(doc, target, "click", center.x, center.y, button);

  if (step.options.double) {
    await sleep(80);
    dispatchMouse(doc, target, "click", center.x, center.y, button);
    dispatchMouse(doc, target, "dblclick", center.x, center.y, button);
  }
}

async function executeClickCoords(
  step: ClickCoordsStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
  await moveCursorTo(cursor, step.options.x, step.options.y, 120, "easeOut");
  const clickColor = context?.getCursorConfig?.().clickColor ?? "#ef4444";
  showClickRipple(cursor, step.options.x, step.options.y, clickColor);

  const doc = getFrameDocument(iframe);
  if (!doc) {
    return;
  }

  const target = doc.elementFromPoint(step.options.x, step.options.y);
  if (!target) {
    return;
  }

  const button = getButtonCode(step.options.button);

  dispatchMouse(doc, target, "pointerdown", step.options.x, step.options.y, button);
  dispatchMouse(doc, target, "mousedown", step.options.x, step.options.y, button);
  dispatchMouse(doc, target, "pointerup", step.options.x, step.options.y, button);
  dispatchMouse(doc, target, "mouseup", step.options.x, step.options.y, button);
  dispatchMouse(doc, target, "click", step.options.x, step.options.y, button);

  if (step.options.double) {
    await sleep(80);
    dispatchMouse(doc, target, "click", step.options.x, step.options.y, button);
    dispatchMouse(doc, target, "dblclick", step.options.x, step.options.y, button);
  }
}

async function executeType(step: TypeStep, iframe: HTMLIFrameElement): Promise<void> {
  const doc = getFrameDocument(iframe);
  if (!doc) {
    throw new StepError({
      stepType: "type",
      selector: step.options.selector,
      reason: "no-document",
    });
  }

  let target: HTMLElement | null = null;

  if (step.options.selector) {
    const selected = doc.querySelector(step.options.selector);
    if (isHtmlElement(doc, selected)) {
      target = selected;
    } else {
      throw new StepError({
        stepType: "type",
        selector: step.options.selector,
        reason: "not-found",
      });
    }
  }

  if (!target && isHtmlElement(doc, doc.activeElement)) {
    target = doc.activeElement;
  }

  if (!target && isHtmlElement(doc, doc.body)) {
    target = doc.body;
  }

  if (!target) {
    return;
  }

  target.focus();

  const delay = Math.max(0, step.options.delay ?? DEFAULT_TYPE_DELAY);

  for (const char of step.options.text) {
    dispatchKeyboard(doc, target, "keydown", char);
    dispatchKeyboard(doc, target, "keypress", char);
    applyCharacter(doc, target, char);
    dispatchKeyboard(doc, target, "keyup", char);

    if (delay > 0) {
      await sleep(delay);
    }
  }

  if (isInputLike(doc, target)) {
    const EventCtor = doc.defaultView?.Event ?? Event;
    target.dispatchEvent(new EventCtor("change", { bubbles: true }));
  }
}

async function executeScroll(
  step: ScrollStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
  const showIndicator = context?.showScrollIndicator ?? showScrollIndicator;
  const hideIndicator = context?.hideScrollIndicator ?? hideScrollIndicator;

  showIndicator(cursor);

  try {
    const win = getFrameWindow(iframe);
    if (!win) {
      return;
    }

    win.scrollTo({
      left: step.options.x,
      top: step.options.y,
      behavior: step.options.smooth ? "smooth" : "auto",
    });

    if (step.options.smooth) {
      await sleep(Math.max(180, step.duration));
    }
  } finally {
    hideIndicator(cursor);
  }
}

async function executeWait(step: WaitStep): Promise<void> {
  await sleep(step.options.ms);
}

/**
 * waitForSelector — waits for a DOM element matching the selector to appear
 * in the iframe document.
 *
 * Limitation: The engine runs in-browser inside an iframe, so this polls the
 * iframe's document via querySelector. Cross-origin iframes will not work.
 */
async function executeWaitForSelector(
  step: WaitForSelectorStep,
  iframe: HTMLIFrameElement,
): Promise<void> {
  const doc = getFrameDocument(iframe);
  if (!doc) {
    console.warn("[walkr] waitForSelector: cannot access iframe document");
    return;
  }

  const timeout = step.options.timeout ?? 5000;
  const visible = step.options.visible ?? false;
  const deadline = performance.now() + timeout;
  const POLL_INTERVAL = 100;

  while (performance.now() < deadline) {
    const el = doc.querySelector(step.options.selector);
    if (el) {
      if (!visible) {
        return;
      }
      // Check visibility: element must have non-zero bounding rect and not be hidden
      if (isHtmlElement(doc, el)) {
        const style = doc.defaultView?.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (
          style &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        ) {
          return;
        }
      }
    }
    await sleep(POLL_INTERVAL);
  }

  throw new StepError({
    stepType: "waitForSelector",
    selector: step.options.selector,
    reason: "timeout",
    message: `waitForSelector: timed out after ${timeout}ms waiting for "${step.options.selector}"`,
  });
}

/**
 * waitForNavigation — waits for the iframe to finish navigating.
 *
 * Limitation: The engine runs in-browser and the iframe is same-origin or
 * sandboxed. For cross-origin iframes this will resolve immediately.
 * Only the "load" waitUntil strategy is actively implemented; other strategies
 * ("domcontentloaded", "networkidle") fall back to the load event.
 */
async function executeWaitForNavigation(
  step: WaitForNavigationStep,
  iframe: HTMLIFrameElement,
): Promise<void> {
  const timeout = step.options.timeout ?? 5000;
  const waitUntil = step.options.waitUntil ?? "load";

  if (waitUntil === "networkidle" || waitUntil === "domcontentloaded") {
    console.warn(
      `[walkr] waitForNavigation: "${waitUntil}" is not fully supported in the in-browser engine; falling back to "load" event`,
    );
  }

  await new Promise<void>((resolve) => {
    let settled = false;

    const finish = (): void => {
      if (settled) return;
      settled = true;
      iframe.removeEventListener("load", finish);
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(() => {
      if (!settled) {
        console.warn(
          `[walkr] waitForNavigation: timed out after ${timeout}ms`,
        );
      }
      finish();
    }, timeout);

    iframe.addEventListener("load", finish);
  });
}

async function executeHighlight(step: HighlightStep, iframe: HTMLIFrameElement): Promise<void> {
  const doc = getFrameDocument(iframe);
  const duration = Math.max(
    0,
    step.options.duration ?? step.duration ?? DEFAULT_HIGHLIGHT_DURATION,
  );

  if (!doc) {
    throw new StepError({
      stepType: "highlight",
      selector: step.options.selector,
      reason: "no-document",
    });
  }

  const target = doc.querySelector(step.options.selector);
  if (!isHtmlElement(doc, target)) {
    throw new StepError({
      stepType: "highlight",
      selector: step.options.selector,
      reason: "not-found",
    });
  }

  const color = step.options.color ?? "#f59e0b";

  if (step.options.spotlight) {
    const stage = iframe.parentElement;
    const hostDocument = iframe.ownerDocument;
    if (!stage || !hostDocument) {
      await sleep(duration);
      return;
    }

    const targetBox = target.getBoundingClientRect();

    const padding = Math.max(0, step.options.padding ?? 8);
    const radius = Math.max(0, step.options.borderRadius ?? 8);
    const backdropOpacity = clamp(step.options.backdropOpacity ?? 0.6, 0, 1);

    const spotlight = hostDocument.createElement("div");
    const overlay = hostDocument.createElement("div");

    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.zIndex = "999990";
    overlay.style.pointerEvents = "none";
    overlay.style.background = "transparent";

    spotlight.style.position = "absolute";
    spotlight.style.left = `${targetBox.left - padding}px`;
    spotlight.style.top = `${targetBox.top - padding}px`;
    spotlight.style.width = `${Math.max(0, targetBox.width + padding * 2)}px`;
    spotlight.style.height = `${Math.max(0, targetBox.height + padding * 2)}px`;
    spotlight.style.zIndex = "999991";
    spotlight.style.pointerEvents = "none";
    spotlight.style.borderRadius = `${radius}px`;
    spotlight.style.outline = `3px solid ${color}`;
    spotlight.style.boxShadow = `0 0 0 9999px rgba(0, 0, 0, ${backdropOpacity}), 0 0 24px 4px ${withHexAlpha(color, "44")}`;

    overlay.appendChild(spotlight);
    stage.appendChild(overlay);

    try {
      await sleep(duration);
    } finally {
      overlay.remove();
    }
    return;
  }

  const previous = {
    outline: target.style.outline,
    outlineOffset: target.style.outlineOffset,
    boxShadow: target.style.boxShadow,
    transition: target.style.transition,
  };

  const highlightTransition = "outline-color 120ms ease-out, box-shadow 120ms ease-out";
  target.style.transition = previous.transition
    ? `${previous.transition}, ${highlightTransition}`
    : highlightTransition;
  target.style.outline = `2px solid ${color}`;
  target.style.outlineOffset = "2px";
  target.style.boxShadow = `0 0 0 6px ${withAlpha(color)}`;

  await sleep(duration);

  target.style.outline = previous.outline;
  target.style.outlineOffset = previous.outlineOffset;
  target.style.boxShadow = previous.boxShadow;
  target.style.transition = previous.transition;
}

function getArrowStyles(position: TooltipPosition): string {
  switch (position) {
    case "top":
      return `
        bottom: -6px; left: 50%; transform: translateX(-50%);
        border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-top: 6px solid #1e1e2e;
      `;
    case "bottom":
      return `
        top: -6px; left: 50%; transform: translateX(-50%);
        border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-bottom: 6px solid #1e1e2e;
      `;
    case "left":
      return `
        right: -6px; top: 50%; transform: translateY(-50%);
        border-top: 6px solid transparent; border-bottom: 6px solid transparent;
        border-left: 6px solid #1e1e2e;
      `;
    case "right":
      return `
        left: -6px; top: 50%; transform: translateY(-50%);
        border-top: 6px solid transparent; border-bottom: 6px solid transparent;
        border-right: 6px solid #1e1e2e;
      `;
  }
}

function positionTooltip(
  tooltipEl: HTMLElement,
  targetRect: DOMRect,
  position: TooltipPosition,
): void {
  const gap = 10;
  switch (position) {
    case "top":
      tooltipEl.style.left = `${targetRect.left + targetRect.width / 2}px`;
      tooltipEl.style.top = `${targetRect.top - gap}px`;
      tooltipEl.style.transform = "translate(-50%, -100%)";
      break;
    case "bottom":
      tooltipEl.style.left = `${targetRect.left + targetRect.width / 2}px`;
      tooltipEl.style.top = `${targetRect.bottom + gap}px`;
      tooltipEl.style.transform = "translate(-50%, 0)";
      break;
    case "left":
      tooltipEl.style.left = `${targetRect.left - gap}px`;
      tooltipEl.style.top = `${targetRect.top + targetRect.height / 2}px`;
      tooltipEl.style.transform = "translate(-100%, -50%)";
      break;
    case "right":
      tooltipEl.style.left = `${targetRect.right + gap}px`;
      tooltipEl.style.top = `${targetRect.top + targetRect.height / 2}px`;
      tooltipEl.style.transform = "translate(0, -50%)";
      break;
  }
}

async function executeTooltip(step: TooltipStep, iframe: HTMLIFrameElement): Promise<void> {
  const doc = getFrameDocument(iframe);
  const duration = Math.max(
    0,
    step.options.duration ?? step.duration ?? DEFAULT_TOOLTIP_DURATION,
  );

  if (!doc) {
    throw new StepError({
      stepType: "tooltip",
      selector: step.options.selector,
      reason: "no-document",
    });
  }

  const target = doc.querySelector(step.options.selector);
  if (!isHtmlElement(doc, target)) {
    throw new StepError({
      stepType: "tooltip",
      selector: step.options.selector,
      reason: "not-found",
    });
  }

  const stage = iframe.parentElement;
  const hostDocument = iframe.ownerDocument;
  if (!stage || !hostDocument) {
    await sleep(duration);
    return;
  }

  const targetRect = target.getBoundingClientRect();
  const position: TooltipPosition = step.options.position ?? "top";

  const tooltipEl = hostDocument.createElement("div");
  tooltipEl.style.cssText = `
    position: absolute;
    z-index: 999992;
    pointer-events: none;
    background: #1e1e2e;
    color: #ffffff;
    border-radius: 8px;
    padding: 10px 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.4;
    max-width: 280px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 150ms ease-in;
  `;

  // Build inner content
  let innerHTML = "";
  if (step.options.title) {
    innerHTML += `<div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${step.options.title}</div>`;
  }
  innerHTML += `<div>${step.options.text}</div>`;

  // Arrow
  const arrowEl = hostDocument.createElement("div");
  arrowEl.style.cssText = `
    position: absolute; width: 0; height: 0;
    ${getArrowStyles(position)}
  `;

  tooltipEl.innerHTML = innerHTML;
  tooltipEl.appendChild(arrowEl);

  positionTooltip(tooltipEl, targetRect, position);

  stage.appendChild(tooltipEl);

  // Fade in
  requestAnimationFrame(() => {
    tooltipEl.style.opacity = "1";
  });

  try {
    await sleep(duration);
  } finally {
    // Fade out
    tooltipEl.style.transition = "opacity 150ms ease-out";
    tooltipEl.style.opacity = "0";
    await sleep(150);
    tooltipEl.remove();
  }
}

async function executeNarrate(step: NarrateStep, iframe: HTMLIFrameElement): Promise<void> {
  const hostDocument = iframe.ownerDocument;
  const stage = iframe.parentElement;
  if (!hostDocument || !stage) {
    throw new StepError({
      stepType: "narrate",
      reason: "no-document",
      message: "narrate: cannot access host document",
    });
  }

  const audio = hostDocument.createElement("audio");
  audio.src = step.options.src;
  audio.volume = Math.max(0, Math.min(1, step.options.volume ?? 1));
  audio.loop = step.options.loop ?? false;
  audio.preload = "auto";
  // Keep element hidden but in the DOM so it can play
  audio.style.display = "none";
  stage.appendChild(audio);

  try {
    await new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = (): void => {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        audio.remove();
      };

      const onEnded = (): void => {
        cleanup();
        resolve();
      };

      const onError = (): void => {
        cleanup();
        reject(
          new StepError({
            stepType: "narrate",
            reason: "no-document",
            message: `narrate: failed to load audio from "${step.options.src}"`,
          }),
        );
      };

      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);

      const playPromise = audio.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err: unknown) => {
          cleanup();
          reject(
            new StepError({
              stepType: "narrate",
              reason: "no-document",
              message: `narrate: playback failed for "${step.options.src}" — ${err instanceof Error ? err.message : String(err)}`,
            }),
          );
        });
      }

      // If duration is specified, resolve after that time regardless of audio length
      if (step.options.duration != null && step.options.duration > 0) {
        timer = setTimeout(() => {
          audio.pause();
          cleanup();
          resolve();
        }, step.options.duration);
      }
    });
  } catch (error) {
    if (error instanceof StepError) {
      throw error;
    }
    throw new StepError({
      stepType: "narrate",
      reason: "no-document",
      message: `narrate: unexpected error — ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function executeZoom(
  step: ZoomStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
  const wrapper = iframe.parentElement;
  if (!(wrapper instanceof HTMLElement)) {
    return;
  }

  const state = readTransformState(wrapper);
  const duration = Math.max(0, step.duration || DEFAULT_ZOOM_DURATION);
  const cursorPosition = getCursorPosition(cursor);

  let originX = typeof step.options.x === "number" ? step.options.x : state.originX;
  let originY = typeof step.options.y === "number" ? step.options.y : state.originY;
  let nextPanX = state.panX;
  let nextPanY = state.panY;

  if (step.options.follow) {
    const wrapperRect = wrapper.getBoundingClientRect();
    if (wrapperRect.width > 0 && wrapperRect.height > 0) {
      originX = (cursorPosition.x / wrapperRect.width) * 100;
      originY = (cursorPosition.y / wrapperRect.height) * 100;
    } else {
      originX = 50;
      originY = 50;
    }

    const centerX = wrapperRect.width / 2;
    const centerY = wrapperRect.height / 2;
    nextPanX = state.panX + (centerX - cursorPosition.x);
    nextPanY = state.panY + (centerY - cursorPosition.y);
  }

  const nextState: ViewportTransformState = {
    panX: nextPanX,
    panY: nextPanY,
    zoom: Math.max(0.05, step.options.level),
    originX: clamp(originX, 0, 100),
    originY: clamp(originY, 0, 100),
  };

  await animateTransformState(
    wrapper,
    nextState,
    duration,
    step.options.easing ?? context?.zoomDefaults?.easing,
  );
}

async function executePan(step: PanStep, iframe: HTMLIFrameElement): Promise<void> {
  const wrapper = iframe.parentElement;
  if (!(wrapper instanceof HTMLElement)) {
    return;
  }

  const state = readTransformState(wrapper);
  const duration = Math.max(0, step.options.duration ?? step.duration ?? DEFAULT_PAN_DURATION);

  await animateTransformState(
    wrapper,
    {
      ...state,
      panX: step.options.x,
      panY: step.options.y,
    },
    duration,
    step.options.easing,
  );
}

/**
 * executeDrag — simulates a click-drag interaction using Pointer/Mouse events.
 *
 * This dispatches pointer and mouse events only (pointerdown, mousedown,
 * pointermove, mousemove, pointerup, mouseup). HTML5 Drag and Drop API events
 * (dragstart, drag, dragover, drop) are not dispatched.
 */
async function executeDrag(
  step: DragStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
  const doc = getFrameDocument(iframe);
  if (!doc) {
    throw new StepError({
      stepType: "drag",
      reason: "no-document",
    });
  }

  const duration = Math.max(0, step.duration || DEFAULT_DRAG_DURATION);

  // Phase durations
  const moveToSourceDuration = duration * 0.15;
  const pressDuration = duration * 0.05;
  const dragDuration = duration * 0.7;
  const releaseDuration = duration * 0.1;

  // Resolve source coordinates
  let fromX: number;
  let fromY: number;
  if ("selector" in step.options.from) {
    const center = resolveElementCenter(doc, step.options.from.selector);
    if (!center) {
      throw new StepError({
        stepType: "drag",
        selector: step.options.from.selector,
        reason: "not-found",
        message: `drag: source element "${step.options.from.selector}" not found`,
      });
    }
    fromX = center.x;
    fromY = center.y;
  } else {
    fromX = step.options.from.x;
    fromY = step.options.from.y;
  }

  // Resolve target coordinates
  let toX: number;
  let toY: number;
  if ("selector" in step.options.to) {
    const center = resolveElementCenter(doc, step.options.to.selector);
    if (!center) {
      throw new StepError({
        stepType: "drag",
        selector: step.options.to.selector,
        reason: "not-found",
        message: `drag: target element "${step.options.to.selector}" not found`,
      });
    }
    toX = center.x;
    toY = center.y;
  } else {
    toX = step.options.to.x;
    toY = step.options.to.y;
  }

  // Phase 1: Move cursor to source
  await moveCursorTo(cursor, fromX, fromY, moveToSourceDuration, "easeOut");

  // Phase 2: Press down
  const sourceTarget = doc.elementFromPoint(fromX, fromY);
  if (sourceTarget) {
    dispatchMouse(doc, sourceTarget, "pointerdown", fromX, fromY, 0);
    dispatchMouse(doc, sourceTarget, "mousedown", fromX, fromY, 0);
  }
  await sleep(pressDuration);

  // Phase 3: Drag to target (animate cursor + emit mousemove events)
  const moveCount = Math.max(1, Math.floor(dragDuration / 16));
  const intervalMs = dragDuration / moveCount;

  for (let i = 1; i <= moveCount; i++) {
    const t = i / moveCount;
    const currentX = fromX + (toX - fromX) * t;
    const currentY = fromY + (toY - fromY) * t;

    await moveCursorTo(cursor, currentX, currentY, intervalMs, "linear");

    const moveTarget = doc.elementFromPoint(currentX, currentY);
    if (moveTarget) {
      const MouseEventCtor = doc.defaultView?.MouseEvent ?? MouseEvent;
      for (const eventType of ["pointermove", "mousemove"] as const) {
        moveTarget.dispatchEvent(
          new MouseEventCtor(eventType, {
            bubbles: true,
            cancelable: true,
            clientX: currentX,
            clientY: currentY,
            button: 0,
            buttons: 1,
          }),
        );
      }
    }
  }

  // Phase 4: Release
  const clickColor = context?.getCursorConfig?.().clickColor ?? "#ef4444";
  showClickRipple(cursor, toX, toY, clickColor);

  const releaseTarget = doc.elementFromPoint(toX, toY);
  if (releaseTarget) {
    dispatchMouse(doc, releaseTarget, "pointerup", toX, toY, 0);
    dispatchMouse(doc, releaseTarget, "mouseup", toX, toY, 0);
  }
  await sleep(releaseDuration);
}

async function executeClearCache(iframe: HTMLIFrameElement): Promise<void> {
  try {
    const win = getFrameWindow(iframe);
    if (win) {
      win.localStorage.clear();
      win.sessionStorage.clear();
    }
  } catch {
    // Cross-origin or security restrictions — ignore.
  }

  try {
    const doc = getFrameDocument(iframe);
    if (doc) {
      for (const cookie of doc.cookie.split(";")) {
        const name = cookie.split("=")[0]?.trim();
        if (name) {
          doc.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    }
  } catch {
    // Cross-origin or security restrictions — ignore.
  }

  // Reload the iframe and wait for it to finish loading.
  const currentSrc = iframe.src;
  if (currentSrc) {
    await new Promise<void>((resolve) => {
      let settled = false;

      const finish = (): void => {
        if (settled) return;
        settled = true;
        iframe.removeEventListener("load", finish);
        iframe.removeEventListener("error", finish);
        resolve();
      };

      iframe.addEventListener("load", finish);
      iframe.addEventListener("error", finish);
      iframe.src = currentSrc;
    });
  }
}

async function executeSequence(
  step: SequenceStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
  for (const childStep of step.options.steps) {
    await executeStep(childStep, cursor, iframe, context);
  }
}

async function executeParallel(
  step: ParallelStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
  await Promise.all(
    step.options.steps.map((childStep) => executeStep(childStep, cursor, iframe, context)),
  );
}

function getStepSelector(step: Step): string | undefined {
  if (step.options && typeof step.options === "object" && "selector" in step.options) {
    return (step.options as { selector: string }).selector;
  }
  return undefined;
}

export async function executeStep(
  step: Step,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<StepResult> {
  const startTime = performance.now();
  const stepType = step.type;
  const selector = getStepSelector(step);

  const cursorOverride = getStepCursorOverride(step);
  const previousCursorConfig =
    cursorOverride && context?.getCursorConfig ? { ...context.getCursorConfig() } : undefined;

  if (cursorOverride && context?.setCursorConfig) {
    context.setCursorConfig(cursorOverride);
  }

  try {
    switch (step.type) {
      case "moveTo":
        await executeMoveTo(step as MoveToStep, cursor, iframe);
        break;
      case "moveToCoords":
        await executeMoveToCoords(step as MoveToCoordsStep, cursor);
        break;
      case "click":
        await executeClick(step as ClickStep, cursor, iframe, context);
        break;
      case "clickCoords":
        await executeClickCoords(step as ClickCoordsStep, cursor, iframe, context);
        break;
      case "type":
        await executeType(step as TypeStep, iframe);
        break;
      case "scroll":
        await executeScroll(step as ScrollStep, cursor, iframe, context);
        break;
      case "wait":
        await executeWait(step as WaitStep);
        break;
      case "waitForSelector":
        await executeWaitForSelector(step as WaitForSelectorStep, iframe);
        break;
      case "waitForNavigation":
        await executeWaitForNavigation(step as WaitForNavigationStep, iframe);
        break;
      case "highlight":
        await executeHighlight(step as HighlightStep, iframe);
        break;
      case "tooltip":
        await executeTooltip(step as TooltipStep, iframe);
        break;
      case "narrate":
        await executeNarrate(step as NarrateStep, iframe);
        break;
      case "zoom":
        await executeZoom(step as ZoomStep, cursor, iframe, context);
        break;
      case "pan":
        await executePan(step as PanStep, iframe);
        break;
      case "sequence":
        await executeSequence(step as SequenceStep, cursor, iframe, context);
        break;
      case "parallel":
        await executeParallel(step as ParallelStep, cursor, iframe, context);
        break;
      case "clearCache":
        await executeClearCache(iframe);
        break;
      case "drag":
        await executeDrag(step as DragStep, cursor, iframe, context);
        break;
      default:
        break;
    }

    const durationMs = performance.now() - startTime;

    if (context?.debug) {
      console.log(
        `[walkr:debug] step=${stepType} selector=${selector ?? "none"} duration=${durationMs.toFixed(1)}ms result=ok`,
      );
    }

    return { status: "ok", stepType, selector, durationMs };
  } catch (error) {
    const durationMs = performance.now() - startTime;

    if (error instanceof StepError) {
      if (context?.debug) {
        console.log(
          `[walkr:debug] step=${stepType} selector=${selector ?? "none"} duration=${durationMs.toFixed(1)}ms result=${error.reason}`,
        );
      }

      context?.onStepError?.(error, step);

      return { status: "error", stepType, selector, durationMs, error };
    }

    // Re-throw unexpected errors
    throw error;
  } finally {
    if (previousCursorConfig && context?.setCursorConfig) {
      context.setCursorConfig(previousCursorConfig);
    }
  }
}
