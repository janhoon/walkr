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
  HighlightStep,
  MouseButton,
  MoveToCoordsStep,
  MoveToStep,
  PanStep,
  ParallelStep,
  ScrollStep,
  SequenceStep,
  Step,
  TypeStep,
  WaitStep,
  ZoomDefaults,
  ZoomStep,
} from "./types.js";

const DEFAULT_MOVE_DURATION = 520;
const DEFAULT_TYPE_DELAY = 40;
const DEFAULT_ZOOM_DURATION = 360;
const DEFAULT_PAN_DURATION = 360;
const DEFAULT_HIGHLIGHT_DURATION = 700;
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
  const center = doc ? resolveElementCenter(doc, step.options.selector) : null;
  if (!center) {
    return;
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
    return;
  }

  const center = resolveElementCenter(doc, step.options.selector);
  if (!center) {
    return;
  }

  await moveCursorTo(cursor, center.x, center.y, 120, "easeOut");
  const clickColor = context?.getCursorConfig?.().clickColor ?? "#ef4444";
  showClickRipple(cursor, center.x, center.y, clickColor);

  const target = doc.querySelector(step.options.selector);
  if (!target) {
    return;
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
    return;
  }

  let target: HTMLElement | null = null;

  if (step.options.selector) {
    const selected = doc.querySelector(step.options.selector);
    if (isHtmlElement(doc, selected)) {
      target = selected;
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

async function executeHighlight(step: HighlightStep, iframe: HTMLIFrameElement): Promise<void> {
  const doc = getFrameDocument(iframe);
  const duration = Math.max(
    0,
    step.options.duration ?? step.duration ?? DEFAULT_HIGHLIGHT_DURATION,
  );

  if (!doc) {
    await sleep(duration);
    return;
  }

  const target = doc.querySelector(step.options.selector);
  if (!isHtmlElement(doc, target)) {
    await sleep(duration);
    return;
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

export async function executeStep(
  step: Step,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
  context?: StepExecutionContext,
): Promise<void> {
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
        return;
      case "moveToCoords":
        await executeMoveToCoords(step as MoveToCoordsStep, cursor);
        return;
      case "click":
        await executeClick(step as ClickStep, cursor, iframe, context);
        return;
      case "clickCoords":
        await executeClickCoords(step as ClickCoordsStep, cursor, iframe, context);
        return;
      case "type":
        await executeType(step as TypeStep, iframe);
        return;
      case "scroll":
        await executeScroll(step as ScrollStep, cursor, iframe, context);
        return;
      case "wait":
        await executeWait(step as WaitStep);
        return;
      case "highlight":
        await executeHighlight(step as HighlightStep, iframe);
        return;
      case "zoom":
        await executeZoom(step as ZoomStep, cursor, iframe, context);
        return;
      case "pan":
        await executePan(step as PanStep, iframe);
        return;
      case "sequence":
        await executeSequence(step as SequenceStep, cursor, iframe, context);
        return;
      case "parallel":
        await executeParallel(step as ParallelStep, cursor, iframe, context);
        return;
      case "clearCache":
        await executeClearCache(iframe);
        return;
      default:
        return;
    }
  } finally {
    if (previousCursorConfig && context?.setCursorConfig) {
      context.setCursorConfig(previousCursorConfig);
    }
  }
}
