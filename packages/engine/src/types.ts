import type { Step } from "@walkr/core";

export interface CursorConfig {
  size?: number;
  color?: string;
  shape?: "arrow" | "circle" | "dot";
  shadow?: boolean;
  clickColor?: string;
  opacity?: number;
}

export interface EngineConfig {
  url: string;
  steps: Step[];
  cursor?: CursorConfig;
  width?: number;
  height?: number;
  zoom?: number;
}

export interface PlaybackState {
  currentStepIndex: number;
  currentTime: number;
  totalTime: number;
  isPlaying: boolean;
  isPaused: boolean;
  isDone: boolean;
}

export type PlaybackEventType =
  | "start"
  | "step"
  | "pause"
  | "resume"
  | "complete"
  | "error";

export interface PlaybackEvent {
  type: PlaybackEventType;
  stepIndex?: number;
  step?: Step;
  state: PlaybackState;
}
