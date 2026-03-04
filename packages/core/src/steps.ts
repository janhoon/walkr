import type {
  BaseStepOptions,
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
>(type: TType, options: TOptions, duration = 0, name?: string): Step<TType, TOptions> {
  const count = typeCounters.get(type) ?? 0;
  typeCounters.set(type, count + 1);
  const step: Step<TType, TOptions> = {
    id: `${type}_${count}`,
    type,
    options,
    duration,
  };
  if (name != null) {
    step.name = name;
  }
  return step;
}

export function moveTo(selector: string, options: MoveToOptions = {}): MoveToStep {
  const { name, ...rest } = options;
  const stepOptions: MoveToStepOptions = { selector, ...rest };
  return createStep("moveTo", stepOptions, options.duration ?? 0, name);
}

export function moveToCoords(x: number, y: number, options: MoveToOptions = {}): MoveToCoordsStep {
  const { name, ...rest } = options;
  const stepOptions: MoveToCoordsStepOptions = { x, y, ...rest };
  return createStep("moveToCoords", stepOptions, options.duration ?? 0, name);
}

export function click(selector: string, options: ClickOptions = {}): ClickStep {
  const { name, ...rest } = options;
  const stepOptions: ClickStepOptions = {
    selector,
    button: rest.button ?? "left",
    double: rest.double ?? false,
  };
  return createStep("click", stepOptions, DEFAULT_CLICK_DURATION, name);
}

export function clickCoords(x: number, y: number, options: ClickOptions = {}): ClickCoordsStep {
  const { name, ...rest } = options;
  const stepOptions: ClickCoordsStepOptions = {
    x,
    y,
    button: rest.button ?? "left",
    double: rest.double ?? false,
  };
  return createStep("clickCoords", stepOptions, DEFAULT_CLICK_DURATION, name);
}

export function type(text: string, options: TypeOptions = {}): TypeStep {
  const { name, ...rest } = options;
  const stepOptions: TypeStepOptions = { text, ...rest };
  const duration = text.length * (options.delay ?? 0);
  return createStep("type", stepOptions, duration, name);
}

export function scroll(x: number, y: number, options: ScrollOptions = {}): ScrollStep {
  const { name, ...rest } = options;
  const stepOptions: ScrollStepOptions = { x, y, ...rest };
  return createStep("scroll", stepOptions, 0, name);
}

export function wait(ms: number, options: BaseStepOptions = {}): WaitStep {
  const stepOptions: WaitStepOptions = { ms };
  return createStep("wait", stepOptions, ms, options.name);
}

export function waitForSelector(
  selector: string,
  options: Omit<WaitForSelectorOptions, "selector"> = {},
): WaitForSelectorStep {
  const { name, ...rest } = options;
  const timeout = rest.timeout ?? DEFAULT_WAIT_FOR_SELECTOR_TIMEOUT;
  const stepOptions: WaitForSelectorOptions = {
    selector,
    timeout,
    visible: rest.visible,
    cursor: rest.cursor,
  };
  return createStep("waitForSelector", stepOptions, timeout, name);
}

export function waitForNavigation(options: WaitForNavigationOptions = {}): WaitForNavigationStep {
  const { name, ...rest } = options;
  const timeout = rest.timeout ?? DEFAULT_WAIT_FOR_NAVIGATION_TIMEOUT;
  const stepOptions: WaitForNavigationOptions = {
    timeout,
    waitUntil: rest.waitUntil ?? "load",
    cursor: rest.cursor,
  };
  return createStep("waitForNavigation", stepOptions, timeout, name);
}

export function highlight(selector: string, options: HighlightOptions = {}): HighlightStep {
  const { name, ...rest } = options;
  const stepOptions: HighlightStepOptions = {
    selector,
    color: rest.color,
    duration: rest.duration,
    spotlight: rest.spotlight,
    backdropOpacity: rest.backdropOpacity,
    borderRadius: rest.borderRadius,
    padding: rest.padding,
    cursor: rest.cursor,
  };
  return createStep("highlight", stepOptions, options.duration ?? 0, name);
}

export function tooltip(selector: string, text: string, options: TooltipOptions = {}): TooltipStep {
  const { name, ...rest } = options;
  const duration = rest.duration ?? DEFAULT_TOOLTIP_DURATION;
  const stepOptions: TooltipStepOptions = {
    selector,
    text,
    duration,
    position: rest.position ?? "top",
    title: rest.title,
    cursor: rest.cursor,
  };
  return createStep("tooltip", stepOptions, duration, name);
}

export function narrate(src: string, options: NarrateOptions = {}): NarrateStep {
  const { name, ...rest } = options;
  const stepOptions: NarrateStepOptions = {
    src,
    duration: rest.duration,
    volume: rest.volume ?? 1,
    loop: rest.loop ?? false,
  };
  return createStep("narrate", stepOptions, options.duration ?? 0, name);
}

export function zoom(level: number, options: ZoomOptions = {}): ZoomStep {
  const { name, ...rest } = options;
  const stepOptions: ZoomStepOptions = {
    level,
    easing: rest.easing ?? DEFAULT_EASING,
    ...rest,
  };
  return createStep("zoom", stepOptions, DEFAULT_ZOOM_DURATION, name);
}

export function pan(x: number, y: number, options: PanOptions = {}): PanStep {
  const { name, ...rest } = options;
  const stepOptions: PanStepOptions = {
    x,
    y,
    duration: rest.duration ?? DEFAULT_PAN_DURATION,
    easing: rest.easing ?? DEFAULT_EASING,
    ...rest,
  };
  return createStep("pan", stepOptions, stepOptions.duration ?? DEFAULT_PAN_DURATION, name);
}

export function clearCache(options: ClearCacheStepOptions = {}): ClearCacheStep {
  const { name, ...rest } = options;
  const stepOptions: ClearCacheStepOptions = { ...rest };
  return createStep("clearCache", stepOptions, DEFAULT_CLEAR_CACHE_DURATION, name);
}

export function drag(
  from: DragEndpoint,
  to: DragEndpoint,
  options: StepCursorOverride = {},
): DragStep {
  const { name, ...rest } = options;
  const stepOptions: DragStepOptions = { from, to, cursor: rest.cursor };
  return createStep("drag", stepOptions, DEFAULT_DRAG_DURATION, name);
}

export function hover(selector: string, options: HoverOptions = {}): HoverStep {
  const { name, ...rest } = options;
  const duration = rest.duration ?? DEFAULT_HOVER_DURATION;
  const stepOptions: HoverStepOptions = {
    selector,
    duration,
    cursor: rest.cursor,
  };
  return createStep("hover", stepOptions, duration, name);
}

export type { DragEndpoint, PanStepOptions, ZoomStepOptions };
