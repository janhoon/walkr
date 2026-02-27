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

export interface MoveToOptions {
  duration?: number;
  easing?: string;
}

export interface MoveToStepOptions extends MoveToOptions {
  x: number;
  y: number;
}

export interface ClickOptions {
  button?: MouseButton;
  double?: boolean;
}

export interface ClickStepOptions extends ClickOptions {
  x: number;
  y: number;
}

export interface TypeOptions {
  delay?: number;
  selector?: string;
}

export interface TypeStepOptions extends TypeOptions {
  text: string;
}

export interface ScrollOptions {
  smooth?: boolean;
}

export interface ScrollStepOptions extends ScrollOptions {
  x: number;
  y: number;
}

export interface WaitStepOptions {
  ms: number;
}

export interface HighlightOptions {
  color?: string;
  duration?: number;
}

export interface HighlightStepOptions extends HighlightOptions {
  selector: string;
}

export interface ZoomOptions {
  x?: number;
  y?: number;
  easing?: string;
}

export interface ZoomStepOptions extends ZoomOptions {
  level: number;
}

export interface PanOptions {
  duration?: number;
  easing?: string;
}

export interface PanStepOptions extends PanOptions {
  x: number;
  y: number;
}

export interface SequenceStepOptions {
  steps: Step[];
}

export interface ParallelStepOptions {
  steps: Step[];
}

export interface Step<
  TType extends StepType = StepType,
  TOptions = Record<string, unknown>,
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
}

export interface WalkthroughOptions {
  url: string;
  steps: Step[];
  title?: string;
  description?: string;
}
