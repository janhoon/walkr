export type MouseButton = "left" | "right" | "middle";

export type StepType =
  | "moveTo"
  | "click"
  | "type"
  | "scroll"
  | "wait"
  | "highlight"
  | "zoom"
  | "pan"
  | "sequence"
  | "parallel";

export interface CursorConfig {
  shape?: "circle" | "arrow" | "dot" | "svg";
  color?: string;
  size?: number;
  shadow?: boolean;
  clickColor?: string;
  svgContent?: string;
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
  x: number;
  y: number;
}

export interface ClickOptions extends StepCursorOverride {
  button?: MouseButton;
  double?: boolean;
}

export interface ClickStepOptions extends ClickOptions {
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

export interface HighlightOptions extends StepCursorOverride {
  color?: string;
  duration?: number;
}

export interface HighlightStepOptions extends HighlightOptions {
  selector: string;
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

export interface Step<
  TType extends StepType = StepType,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: TType;
  options: TOptions;
  duration: number;
}

export type MoveToStep = Step<"moveTo", MoveToStepOptions>;
export type ClickStep = Step<"click", ClickStepOptions>;
export type TypeStep = Step<"type", TypeStepOptions>;
export type ScrollStep = Step<"scroll", ScrollStepOptions>;
export type WaitStep = Step<"wait", WaitStepOptions>;
export type HighlightStep = Step<"highlight", HighlightStepOptions>;
export type ZoomStep = Step<"zoom", ZoomStepOptions>;
export type PanStep = Step<"pan", PanStepOptions>;
export type SequenceStep = Step<"sequence", SequenceStepOptions>;
export type ParallelStep = Step<"parallel", ParallelStepOptions>;

export interface Walkthrough {
  url: string;
  steps: Step[];
  title?: string;
  description?: string;
  zoom?: ZoomDefaults;
  cursor?: CursorConfig;
}

export interface EngineOptions {
  cursor?: CursorConfig;
  container?: HTMLElement;
}

export interface EngineState {
  playing: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
}

export type PlaybackEvent = "start" | "step" | "complete" | "pause" | "resume";

export type EventHandler = (event: PlaybackEvent, state: EngineState) => void;
