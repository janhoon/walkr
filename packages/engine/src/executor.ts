import { moveCursorTo, showClickRipple } from "./cursor.js";
import type {
  ClickStep,
  EngineState,
  HighlightStep,
  MouseButton,
  MoveToStep,
  PanStep,
  ParallelStep,
  ScrollStep,
  SequenceStep,
  Step,
  TypeStep,
  WaitStep,
  ZoomStep,
} from "./types.js";

const DEFAULT_MOVE_DURATION = 520;
const DEFAULT_TYPE_DELAY = 40;
const DEFAULT_ZOOM_DURATION = 360;
const DEFAULT_PAN_DURATION = 360;
const DEFAULT_HIGHLIGHT_DURATION = 700;

type ViewportTransformState = {
  panX: number;
  panY: number;
  scale: number;
};

function normalizeEasing(easing?: string): string {
  const value = easing?.trim();

  if (!value || value === "ease" || value === "easeInOut" || value === "ease-in-out") {
    return "cubic-bezier(0.42, 0, 0.58, 1)";
  }
  if (value === "easeOut" || value === "ease-out") {
    return "cubic-bezier(0, 0, 0.58, 1)";
  }
  if (value === "linear") {
    return "linear";
  }

  return value;
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

function readTransformState(wrapper: HTMLElement): ViewportTransformState {
  const panX = Number(wrapper.dataset.walkrPanX ?? 0);
  const panY = Number(wrapper.dataset.walkrPanY ?? 0);
  const scale = Number(wrapper.dataset.walkrScale ?? 1);
  return {
    panX: Number.isFinite(panX) ? panX : 0,
    panY: Number.isFinite(panY) ? panY : 0,
    scale: Number.isFinite(scale) ? scale : 1,
  };
}

function writeTransformState(
  wrapper: HTMLElement,
  state: ViewportTransformState,
  duration: number,
  easing?: string,
): void {
  wrapper.dataset.walkrPanX = String(state.panX);
  wrapper.dataset.walkrPanY = String(state.panY);
  wrapper.dataset.walkrScale = String(state.scale);
  wrapper.style.transition =
    duration > 0 ? `transform ${duration}ms ${normalizeEasing(easing)}` : "none";
  wrapper.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.scale})`;
}

function isHtmlElement(doc: Document, value: Element | null): value is HTMLElement {
  const view = doc.defaultView;
  if (!view || !value) {
    return false;
  }
  return value instanceof view.HTMLElement;
}

function isInputLike(doc: Document, value: HTMLElement): value is HTMLInputElement | HTMLTextAreaElement {
  const view = doc.defaultView;
  if (!view) {
    return false;
  }
  return value instanceof view.HTMLInputElement || value instanceof view.HTMLTextAreaElement;
}

function dispatchMouse(doc: Document, target: Element, type: string, x: number, y: number, button: number): void {
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

function withAlpha(color: string): string {
  if (/^#([A-Fa-f0-9]{6})$/.test(color)) {
    return `${color}40`;
  }
  if (/^#([A-Fa-f0-9]{3})$/.test(color)) {
    const [, raw] = /^#([A-Fa-f0-9]{3})$/.exec(color) ?? [];
    if (raw) {
      return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}40`;
    }
  }
  return color;
}

export function sleep(ms: number): Promise<void> {
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

async function executeMoveTo(step: MoveToStep, cursor: HTMLElement): Promise<void> {
  const duration = Math.max(0, step.options.duration ?? step.duration ?? DEFAULT_MOVE_DURATION);
  const easing = step.options.easing ?? "easeInOut";
  await moveCursorTo(cursor, step.options.x, step.options.y, duration, easing);
}

async function executeClick(
  step: ClickStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
): Promise<void> {
  await moveCursorTo(cursor, step.options.x, step.options.y, 120, "easeOut");
  showClickRipple(cursor, step.options.x, step.options.y);

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

async function executeScroll(step: ScrollStep, iframe: HTMLIFrameElement): Promise<void> {
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
}

async function executeWait(step: WaitStep): Promise<void> {
  await sleep(step.options.ms);
}

async function executeHighlight(step: HighlightStep, iframe: HTMLIFrameElement): Promise<void> {
  const doc = getFrameDocument(iframe);
  const duration = Math.max(0, step.options.duration ?? step.duration ?? DEFAULT_HIGHLIGHT_DURATION);

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

async function executeZoom(step: ZoomStep, iframe: HTMLIFrameElement): Promise<void> {
  const wrapper = iframe.parentElement;
  if (!(wrapper instanceof HTMLElement)) {
    return;
  }

  const state = readTransformState(wrapper);

  if (typeof step.options.x === "number" || typeof step.options.y === "number") {
    const originX = typeof step.options.x === "number" ? `${step.options.x}px` : "50%";
    const originY = typeof step.options.y === "number" ? `${step.options.y}px` : "50%";
    wrapper.style.transformOrigin = `${originX} ${originY}`;
  }

  const duration = Math.max(0, step.duration || DEFAULT_ZOOM_DURATION);
  writeTransformState(
    wrapper,
    {
      ...state,
      scale: Math.max(0.05, step.options.level),
    },
    duration,
    step.options.easing,
  );

  if (duration > 0) {
    await sleep(duration);
  }
}

async function executePan(step: PanStep, iframe: HTMLIFrameElement): Promise<void> {
  const wrapper = iframe.parentElement;
  if (!(wrapper instanceof HTMLElement)) {
    return;
  }

  const state = readTransformState(wrapper);
  const duration = Math.max(0, step.options.duration ?? step.duration ?? DEFAULT_PAN_DURATION);

  writeTransformState(
    wrapper,
    {
      ...state,
      panX: step.options.x,
      panY: step.options.y,
    },
    duration,
    step.options.easing,
  );

  if (duration > 0) {
    await sleep(duration);
  }
}

async function executeSequence(
  step: SequenceStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
): Promise<void> {
  for (const childStep of step.options.steps) {
    await executeStep(childStep, cursor, iframe);
  }
}

async function executeParallel(
  step: ParallelStep,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
): Promise<void> {
  await Promise.all(step.options.steps.map((childStep) => executeStep(childStep, cursor, iframe)));
}

export async function executeStep(
  step: Step,
  cursor: HTMLElement,
  iframe: HTMLIFrameElement,
): Promise<void> {
  switch (step.type) {
    case "moveTo":
      await executeMoveTo(step as MoveToStep, cursor);
      return;
    case "click":
      await executeClick(step as ClickStep, cursor, iframe);
      return;
    case "type":
      await executeType(step as TypeStep, iframe);
      return;
    case "scroll":
      await executeScroll(step as ScrollStep, iframe);
      return;
    case "wait":
      await executeWait(step as WaitStep);
      return;
    case "highlight":
      await executeHighlight(step as HighlightStep, iframe);
      return;
    case "zoom":
      await executeZoom(step as ZoomStep, iframe);
      return;
    case "pan":
      await executePan(step as PanStep, iframe);
      return;
    case "sequence":
      await executeSequence(step as SequenceStep, cursor, iframe);
      return;
    case "parallel":
      await executeParallel(step as ParallelStep, cursor, iframe);
      return;
    default:
      return;
  }
}

export type { EngineState };
