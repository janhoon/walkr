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
  HighlightOptions,
  HighlightStep,
  HighlightStepOptions,
  MouseButton,
  MoveToCoordsStep,
  MoveToCoordsStepOptions,
  MoveToOptions,
  MoveToStep,
  MoveToStepOptions,
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

import type { CursorConfig, Viewport } from "@walkrstudio/core";

// Engine-specific types

export interface EngineOptions {
  cursor?: CursorConfig;
  container?: HTMLElement;
  viewport?: Viewport;
}

export interface EngineState {
  playing: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
}

export type PlaybackEvent = "start" | "step" | "complete" | "pause" | "resume";

export type EventHandler = (event: PlaybackEvent, state: EngineState) => void;
