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

export type PlaybackEvent = "start" | "step" | "complete" | "pause" | "resume" | "step_error";

export type StepErrorReason = "not-found" | "timeout" | "no-document";

/**
 * Error representing a failed walkthrough step (e.g. selector not found).
 * Thrown internally by step executors and surfaced via the `step_error` event.
 */
export class StepError extends Error {
  readonly stepType: StepType;
  readonly selector: string | undefined;
  readonly reason: StepErrorReason;

  constructor(options: {
    stepType: StepType;
    selector?: string;
    reason: StepErrorReason;
    message?: string;
  }) {
    super(
      options.message ??
        `Step "${options.stepType}" failed: selector ${options.selector ? `"${options.selector}" ` : ""}${options.reason}`,
    );
    this.name = "StepError";
    this.stepType = options.stepType;
    this.selector = options.selector;
    this.reason = options.reason;
  }
}

export interface StepResult {
  status: "ok" | "error";
  stepType: StepType;
  selector?: string;
  durationMs: number;
  error?: StepError;
}

export interface StepErrorDetail {
  error: StepError;
  stepIndex: number;
  stepResult: StepResult;
}

export type EventHandler = (
  event: PlaybackEvent,
  state: EngineState,
  detail?: StepErrorDetail,
) => void;
