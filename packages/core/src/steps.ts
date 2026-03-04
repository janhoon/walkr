import type {
  ClearCacheStep,
  ClearCacheStepOptions,
  ClickCoordsStep,
  ClickCoordsStepOptions,
  ClickOptions,
  ClickStep,
  ClickStepOptions,
  DragEndpoint,
  DragStep,
  DragStepOptions,
  HighlightOptions,
  HighlightStep,
  HighlightStepOptions,
  HoverOptions,
  HoverStep,
  HoverStepOptions,
  MoveToCoordsStep,
  MoveToCoordsStepOptions,
  MoveToOptions,
  MoveToStep,
  MoveToStepOptions,
  NarrateOptions,
  NarrateStep,
  NarrateStepOptions,
  PanOptions,
  PanStep,
  PanStepOptions,
  ScrollOptions,
  ScrollStep,
  ScrollStepOptions,
  Step,
  StepCursorOverride,
  StepType,
  TooltipOptions,
  TooltipStep,
  TooltipStepOptions,
  TypeOptions,
  TypeStep,
  TypeStepOptions,
  WaitForNavigationOptions,
  WaitForNavigationStep,
  WaitForSelectorOptions,
  WaitForSelectorStep,
  WaitStep,
  WaitStepOptions,
  ZoomOptions,
  ZoomStep,
  ZoomStepOptions,
} from "./types.js";

const typeCounters = new Map<string, number>();

/**
 * Reset per-type step counters. Called automatically by `walkr()` so that
 * the same walkthrough definition always produces identical step IDs.
 */
export function resetStepCounters(): void {
  typeCounters.clear();
}

const DEFAULT_CLICK_DURATION = 50;
const DEFAULT_ZOOM_DURATION = 360;
const DEFAULT_PAN_DURATION = 360;
const DEFAULT_CLEAR_CACHE_DURATION = 50;
const DEFAULT_DRAG_DURATION = 1000;
const DEFAULT_HOVER_DURATION = 0;
const DEFAULT_TOOLTIP_DURATION = 3000;
const DEFAULT_WAIT_FOR_SELECTOR_TIMEOUT = 5000;
const DEFAULT_WAIT_FOR_NAVIGATION_TIMEOUT = 5000;
const DEFAULT_EASING = "cubic-bezier(0.42, 0, 0.58, 1)";

export function createStep<
  TType extends StepType,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TOptions extends {},
>(type: TType, options: TOptions, duration = 0): Step<TType, TOptions> {
  const count = typeCounters.get(type) ?? 0;
  typeCounters.set(type, count + 1);
  return {
    id: `${type}_${count}`,
    type,
    options,
    duration,
  };
}

export function moveTo(selector: string, options: MoveToOptions = {}): MoveToStep {
  const stepOptions: MoveToStepOptions = { selector, ...options };
  return createStep("moveTo", stepOptions, options.duration ?? 0);
}

export function moveToCoords(x: number, y: number, options: MoveToOptions = {}): MoveToCoordsStep {
  const stepOptions: MoveToCoordsStepOptions = { x, y, ...options };
  return createStep("moveToCoords", stepOptions, options.duration ?? 0);
}

export function click(selector: string, options: ClickOptions = {}): ClickStep {
  const stepOptions: ClickStepOptions = {
    selector,
    button: options.button ?? "left",
    double: options.double ?? false,
  };
  return createStep("click", stepOptions, DEFAULT_CLICK_DURATION);
}

export function clickCoords(x: number, y: number, options: ClickOptions = {}): ClickCoordsStep {
  const stepOptions: ClickCoordsStepOptions = {
    x,
    y,
    button: options.button ?? "left",
    double: options.double ?? false,
  };
  return createStep("clickCoords", stepOptions, DEFAULT_CLICK_DURATION);
}

export function type(text: string, options: TypeOptions = {}): TypeStep {
  const stepOptions: TypeStepOptions = { text, ...options };
  const duration = text.length * (options.delay ?? 0);
  return createStep("type", stepOptions, duration);
}

export function scroll(x: number, y: number, options: ScrollOptions = {}): ScrollStep {
  const stepOptions: ScrollStepOptions = { x, y, ...options };
  return createStep("scroll", stepOptions, 0);
}

export function wait(ms: number): WaitStep {
  const stepOptions: WaitStepOptions = { ms };
  return createStep("wait", stepOptions, ms);
}

export function waitForSelector(
  selector: string,
  options: Omit<WaitForSelectorOptions, "selector"> = {},
): WaitForSelectorStep {
  const timeout = options.timeout ?? DEFAULT_WAIT_FOR_SELECTOR_TIMEOUT;
  const stepOptions: WaitForSelectorOptions = {
    selector,
    timeout,
    visible: options.visible,
    cursor: options.cursor,
  };
  return createStep("waitForSelector", stepOptions, timeout);
}

export function waitForNavigation(options: WaitForNavigationOptions = {}): WaitForNavigationStep {
  const timeout = options.timeout ?? DEFAULT_WAIT_FOR_NAVIGATION_TIMEOUT;
  const stepOptions: WaitForNavigationOptions = {
    timeout,
    waitUntil: options.waitUntil ?? "load",
    cursor: options.cursor,
  };
  return createStep("waitForNavigation", stepOptions, timeout);
}

export function highlight(selector: string, options: HighlightOptions = {}): HighlightStep {
  const stepOptions: HighlightStepOptions = {
    selector,
    color: options.color,
    duration: options.duration,
    spotlight: options.spotlight,
    backdropOpacity: options.backdropOpacity,
    borderRadius: options.borderRadius,
    padding: options.padding,
    cursor: options.cursor,
  };
  return createStep("highlight", stepOptions, options.duration ?? 0);
}

export function tooltip(selector: string, text: string, options: TooltipOptions = {}): TooltipStep {
  const duration = options.duration ?? DEFAULT_TOOLTIP_DURATION;
  const stepOptions: TooltipStepOptions = {
    selector,
    text,
    duration,
    position: options.position ?? "top",
    title: options.title,
    cursor: options.cursor,
  };
  return createStep("tooltip", stepOptions, duration);
}

export function narrate(src: string, options: NarrateOptions = {}): NarrateStep {
  const stepOptions: NarrateStepOptions = {
    src,
    duration: options.duration,
    volume: options.volume ?? 1,
    loop: options.loop ?? false,
  };
  return createStep("narrate", stepOptions, options.duration ?? 0);
}

export function zoom(level: number, options: ZoomOptions = {}): ZoomStep {
  const stepOptions: ZoomStepOptions = {
    level,
    easing: options.easing ?? DEFAULT_EASING,
    ...options,
  };
  return createStep("zoom", stepOptions, DEFAULT_ZOOM_DURATION);
}

export function pan(x: number, y: number, options: PanOptions = {}): PanStep {
  const stepOptions: PanStepOptions = {
    x,
    y,
    duration: options.duration ?? DEFAULT_PAN_DURATION,
    easing: options.easing ?? DEFAULT_EASING,
    ...options,
  };
  return createStep("pan", stepOptions, stepOptions.duration ?? DEFAULT_PAN_DURATION);
}

export function clearCache(): ClearCacheStep {
  const stepOptions: ClearCacheStepOptions = {};
  return createStep("clearCache", stepOptions, DEFAULT_CLEAR_CACHE_DURATION);
}

export function drag(
  from: DragEndpoint,
  to: DragEndpoint,
  options: StepCursorOverride = {},
): DragStep {
  const stepOptions: DragStepOptions = { from, to, cursor: options.cursor };
  return createStep("drag", stepOptions, DEFAULT_DRAG_DURATION);
}

export function hover(selector: string, options: HoverOptions = {}): HoverStep {
  const duration = options.duration ?? DEFAULT_HOVER_DURATION;
  const stepOptions: HoverStepOptions = {
    selector,
    duration,
    cursor: options.cursor,
  };
  return createStep("hover", stepOptions, duration);
}

export type { DragEndpoint, PanStepOptions, ZoomStepOptions };
