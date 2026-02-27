import type { Step, Walkthrough } from "../../core/src/types";

export interface SelectedStep {
  index: number;
  step: Step;
}

export type PlaybackMode = "playing" | "paused" | "stopped";

export interface StudioState {
  walkthrough: Walkthrough | null;
  selectedStep: SelectedStep | null;
  playheadTime: number;
  mode: PlaybackMode;
  loop: boolean;
}
