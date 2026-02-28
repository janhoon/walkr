import { createStep } from "./steps.js";
import type {
  ParallelStep,
  ParallelStepOptions,
  SequenceStep,
  SequenceStepOptions,
  Step,
} from "./types.js";

export function sequence(...steps: Step[]): SequenceStep {
  const stepOptions: SequenceStepOptions = { steps: [...steps] };
  const duration = steps.reduce((total, step) => total + step.duration, 0);
  return createStep("sequence", stepOptions, duration);
}

export function parallel(...steps: Step[]): ParallelStep {
  const stepOptions: ParallelStepOptions = { steps: [...steps] };
  const duration = steps.reduce((maxDuration, step) => Math.max(maxDuration, step.duration), 0);
  return createStep("parallel", stepOptions, duration);
}
