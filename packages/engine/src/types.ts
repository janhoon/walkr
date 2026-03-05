// Re-export all shared types from @walkrstudio/core (single source of truth)
export type {
  ClearCacheStep,
  ClearCacheStepOptions,
  ClickCoordsStep,
  ClickCoordsStepOptions,
  ClickOptions,
  ClickStep,
  ClickStepOptions,
  CursorConfig,
  CursorShape,
  DragEndpoint,
  DragStep,
  DragStepOptions,
  HighlightOptions,
  HighlightStep,
  HighlightStepOptions,
  HoverOptions,
  HoverStep,
  HoverStepOptions,
  MouseButton,
  TooltipOptions,
  TooltipPosition,
  TooltipStep,
  TooltipStepOptions,
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
  ParallelStep,
  ParallelStepOptions,
  ScrollOptions,
  ScrollStep,
  ScrollStepOptions,
  SequenceStep,
  SequenceStepOptions,
  Step,
  StepCursorOverride,
  StepType,
  TypeOptions,
  TypeStep,
  TypeStepOptions,
  Viewport,
  WaitForNavigationOptions,
  WaitForNavigationStep,
  WaitForSelectorOptions,
  WaitForSelectorStep,
  WaitStep,
  WaitStepOptions,
  WaitUntil,
  Walkthrough,
  WalkthroughOptions,
  ZoomDefaults,
  ZoomOptions,
  ZoomStep,
  ZoomStepOptions,
} from "@walkrstudio/core";

import type { CursorConfig, StepType, Viewport } from "@walkrstudio/core";

// Engine-specific types

export interface EngineOptions {
  cursor?: CursorConfig;
  container?: HTMLElement;
  viewport?: Viewport;
  /** Enable verbose step execution logging to the console. */
  debug?: boolean;
}

export interface EngineState {
  playing: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
}

export type PlaybackEvent = "start" | "step" | "step_start" | "step_end" | "complete" | "pause" | "resume" | "step_error";

export type StepErrorReason = "not-found" | "timeout" | "no-document";

/**
 * Error representing a failed walkthrough step (e.g. selector not found).
 * Thrown internally by step executors and surfaced via the `step_error` event.
 */
export class StepError extends Error {
  readonly stepType: StepType;
  readonly selector: string | undefined;
  readonly reason: StepErrorReason;
  /** The step's human-readable name, if one was provided. */
  readonly stepName: string | undefined;

  constructor(options: {
    stepType: StepType;
    selector?: string;
    reason: StepErrorReason;
    message?: string;
    /** The step's human-readable name. */
    stepName?: string;
  }) {
    super(
      options.message ??
        StepError.buildMessage(options.stepType, options.selector, options.reason, options.stepName),
    );
    this.name = "StepError";
    this.stepType = options.stepType;
    this.selector = options.selector;
    this.reason = options.reason;
    this.stepName = options.stepName;
  }

  private static buildMessage(
    stepType: StepType,
    selector?: string,
    reason?: StepErrorReason,
    stepName?: string,
  ): string {
    const nameLabel = stepName ? ` '${stepName}'` : "";
    const selectorLabel = selector ? ` at selector "${selector}"` : "";
    return `Step${nameLabel} "${stepType}" failed${selectorLabel}: ${reason}`;
  }
}

export interface StepResult {
  status: "ok" | "error";
  stepType: StepType;
  selector?: string;
  /** The step's human-readable name, if one was provided. */
  stepName?: string;
  durationMs: number;
  error?: StepError;
}

export interface StepDetail {
  stepIndex: number;
  stepType: StepType;
  /** The step's human-readable name, if one was provided. */
  stepName?: string;
}

export interface StepErrorDetail {
  error: StepError;
  stepIndex: number;
  stepResult: StepResult;
}

export type EventHandler = (
  event: PlaybackEvent,
  state: EngineState,
  detail?: StepErrorDetail | StepDetail,
) => void;
