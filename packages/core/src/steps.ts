import type {
  ClickCoordsStep,
  ClickCoordsStepOptions,
  ClickOptions,
  ClickStep,
  ClickStepOptions,
  HighlightOptions,
  HighlightStep,
  HighlightStepOptions,
  MoveToCoordsStep,
  MoveToCoordsStepOptions,
  MoveToOptions,
  MoveToStep,
  MoveToStepOptions,
  PanOptions,
  PanStep,
  PanStepOptions,
  ScrollOptions,
  ScrollStep,
  ScrollStepOptions,
  Step,
  StepType,
  TypeOptions,
  TypeStep,
  TypeStepOptions,
  WaitStep,
  WaitStepOptions,
  ZoomOptions,
  ZoomStep,
  ZoomStepOptions,
} from "./types.js";

let stepCounter = 0;
const DEFAULT_CLICK_DURATION = 50;
const DEFAULT_ZOOM_DURATION = 360;
const DEFAULT_PAN_DURATION = 360;
const DEFAULT_EASING = "cubic-bezier(0.42, 0, 0.58, 1)";

export function createStep<
  TType extends StepType,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TOptions extends {},
>(type: TType, options: TOptions, duration = 0): Step<TType, TOptions> {
  stepCounter += 1;
  return {
    id: `${type}_${stepCounter}`,
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

export type { PanStepOptions, ZoomStepOptions };
