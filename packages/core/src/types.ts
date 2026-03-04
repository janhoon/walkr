export interface Viewport {
  width: number;
  height: number;
}

export type MouseButton = "left" | "right" | "middle";

export type StepType =
  | "moveTo"
  | "moveToCoords"
  | "click"
  | "clickCoords"
  | "type"
  | "scroll"
  | "wait"
  | "waitForSelector"
  | "waitForNavigation"
  | "highlight"
  | "tooltip"
  | "narrate"
  | "zoom"
  | "pan"
  | "sequence"
  | "parallel"
  | "clearCache"
  | "drag"
  | "hover";

export type CursorShape =
  | "circle"
  | "arrow"
  | "dot"
  | "svg"
  | "cursor-01"
  | "cursor-02"
  | "cursor-03";

export interface CursorConfig {
  shape?: CursorShape;
  color?: string;
  size?: number;
  shadow?: boolean;
  clickColor?: string;
  svgContent?: string;
  /** Hotspot offset as a fraction of cursor size (0–1). Default: center {x:0.5,y:0.5}. */
  offset?: { x: number; y: number };
}

export interface ZoomDefaults {
  defaultLevel?: number;
  easing?: string;
}

export interface StepCursorOverride {
  cursor?: Partial<CursorConfig>;
}

export interface MoveToOptions extends StepCursorOverride {
  duration?: number;
  easing?: string;
  follow?: boolean;
}

export interface MoveToStepOptions extends MoveToOptions {
  selector: string;
}

export interface MoveToCoordsStepOptions extends MoveToOptions {
  x: number;
  y: number;
}

export interface ClickOptions extends StepCursorOverride {
  button?: MouseButton;
  double?: boolean;
}

export interface ClickStepOptions extends ClickOptions {
  selector: string;
}

export interface ClickCoordsStepOptions extends ClickOptions {
  x: number;
  y: number;
}

export interface TypeOptions extends StepCursorOverride {
  delay?: number;
  selector?: string;
}

export interface TypeStepOptions extends TypeOptions {
  text: string;
}

export interface ScrollOptions extends StepCursorOverride {
  smooth?: boolean;
}

export interface ScrollStepOptions extends ScrollOptions {
  x: number;
  y: number;
}

export interface WaitStepOptions extends StepCursorOverride {
  ms: number;
}

export interface WaitForSelectorOptions extends StepCursorOverride {
  selector: string;
  timeout?: number;
  visible?: boolean;
}

export type WaitUntil = "load" | "domcontentloaded" | "networkidle";

export interface WaitForNavigationOptions extends StepCursorOverride {
  timeout?: number;
  waitUntil?: WaitUntil;
}

export interface HighlightOptions extends StepCursorOverride {
  color?: string;
  duration?: number;
  spotlight?: boolean;
  backdropOpacity?: number;
  borderRadius?: number;
  padding?: number;
}

export interface HighlightStepOptions extends HighlightOptions {
  selector: string;
}

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipOptions extends StepCursorOverride {
  duration?: number;
  position?: TooltipPosition;
  title?: string;
}

export interface TooltipStepOptions extends TooltipOptions {
  selector: string;
  text: string;
}

export interface NarrateOptions {
  /** Duration in ms. If not set, derived from audio length at runtime. */
  duration?: number;
  /** Volume level from 0 to 1. Default: 1. */
  volume?: number;
  /** Whether to loop the audio. Default: false. */
  loop?: boolean;
}

export interface NarrateStepOptions extends NarrateOptions {
  /** URL or path to the audio file. */
  src: string;
}

export interface ZoomOptions extends StepCursorOverride {
  x?: number;
  y?: number;
  easing?: string;
  follow?: boolean;
}

export interface ZoomStepOptions extends ZoomOptions {
  level: number;
}

export interface PanOptions extends StepCursorOverride {
  duration?: number;
  easing?: string;
}

export interface PanStepOptions extends PanOptions {
  x: number;
  y: number;
}

export interface SequenceStepOptions extends StepCursorOverride {
  steps: Step[];
}

export interface ParallelStepOptions extends StepCursorOverride {
  steps: Step[];
}

// biome-ignore lint/complexity/noBannedTypes: {} is intentional — no options needed
export type ClearCacheStepOptions = {};

export type DragEndpoint = { selector: string } | { x: number; y: number };

export interface DragStepOptions extends StepCursorOverride {
  from: DragEndpoint;
  to: DragEndpoint;
}

export interface HoverOptions extends StepCursorOverride {
  /** How long to hold the hover state in ms before dispatching leave events. Default: 0. */
  duration?: number;
}

export interface HoverStepOptions extends HoverOptions {
  selector: string;
}

// biome-ignore lint/complexity/noBannedTypes: {} is intentional — constrains TOptions to any object shape
export interface Step<TType extends StepType = StepType, TOptions extends {} = {}> {
  id: string;
  type: TType;
  options: TOptions;
  duration: number;
}

export type MoveToStep = Step<"moveTo", MoveToStepOptions>;
export type MoveToCoordsStep = Step<"moveToCoords", MoveToCoordsStepOptions>;
export type ClickStep = Step<"click", ClickStepOptions>;
export type ClickCoordsStep = Step<"clickCoords", ClickCoordsStepOptions>;
export type TypeStep = Step<"type", TypeStepOptions>;
export type ScrollStep = Step<"scroll", ScrollStepOptions>;
export type WaitStep = Step<"wait", WaitStepOptions>;
export type WaitForSelectorStep = Step<"waitForSelector", WaitForSelectorOptions>;
export type WaitForNavigationStep = Step<"waitForNavigation", WaitForNavigationOptions>;
export type HighlightStep = Step<"highlight", HighlightStepOptions>;
export type TooltipStep = Step<"tooltip", TooltipStepOptions>;
export type NarrateStep = Step<"narrate", NarrateStepOptions>;
export type ZoomStep = Step<"zoom", ZoomStepOptions>;
export type PanStep = Step<"pan", PanStepOptions>;
export type SequenceStep = Step<"sequence", SequenceStepOptions>;
export type ParallelStep = Step<"parallel", ParallelStepOptions>;
export type ClearCacheStep = Step<"clearCache", ClearCacheStepOptions>;
export type DragStep = Step<"drag", DragStepOptions>;
export type HoverStep = Step<"hover", HoverStepOptions>;

export interface Walkthrough {
  url: string;
  steps: Step[];
  title?: string;
  description?: string;
  zoom?: ZoomDefaults;
  cursor?: CursorConfig;
  viewport?: Viewport;
}

export interface WalkthroughOptions {
  url: string;
  steps: Step[];
  title?: string;
  description?: string;
  zoom?: ZoomDefaults;
  cursor?: CursorConfig;
  viewport?: Viewport;
}
