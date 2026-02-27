import { useCallback, useEffect, useMemo, useState } from "react";

import type { Step, Walkthrough } from "../../../core/src/types";
import { DEFAULT_DEMO_WALKTHROUGH } from "../constants";
import type { PlaybackMode, SelectedStep, StudioState } from "../types";

interface UseStudioResult {
  state: StudioState;
  selectStep: (index: number) => void;
  setPlayhead: (time: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleLoop: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  resizeStep: (index: number, newDuration: number) => void;
  reorderSteps: (from: number, to: number) => void;
  loadWalkthrough: (walkthrough: Walkthrough) => void;
  updateSelectedStep: (updater: (step: Step) => Step) => void;
}

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

const getTotalDuration = (steps: Step[]): number =>
  steps.reduce((total, step) => total + Math.max(0, step.duration), 0);
const MIN_STEP_DURATION_MS = 50;

const findStepIndexAtTime = (steps: Step[], time: number): number | null => {
  if (steps.length === 0) {
    return null;
  }

  let elapsed = 0;
  for (let index = 0; index < steps.length; index += 1) {
    elapsed += Math.max(0, steps[index].duration);
    if (time <= elapsed) {
      return index;
    }
  }

  return steps.length - 1;
};

const findStepStartTime = (steps: Step[], index: number): number => {
  let elapsed = 0;
  for (let current = 0; current < index; current += 1) {
    elapsed += Math.max(0, steps[current].duration);
  }

  return elapsed;
};

const buildSelectedStep = (steps: Step[], index: number | null): SelectedStep | null => {
  if (index === null || index < 0 || index >= steps.length) {
    return null;
  }

  return { index, step: steps[index] };
};

const findSelectedIndex = (
  steps: Step[],
  selectedStep: SelectedStep | null,
  playheadTime: number,
): number | null => {
  if (selectedStep) {
    const selectedById = steps.findIndex((step) => step.id === selectedStep.step.id);
    if (selectedById >= 0) {
      return selectedById;
    }
  }

  return findStepIndexAtTime(steps, playheadTime);
};

export const useStudio = (): UseStudioResult => {
  const [state, setState] = useState<StudioState>({
    walkthrough: DEFAULT_DEMO_WALKTHROUGH,
    selectedStep: null,
    playheadTime: 0,
    mode: "stopped",
    loop: false,
  });

  const steps = useMemo(() => state.walkthrough?.steps ?? [], [state.walkthrough]);

  const selectStep = useCallback((index: number) => {
    setState((previous) => {
      if (!previous.walkthrough) {
        return previous;
      }

      const nextSelected = buildSelectedStep(previous.walkthrough.steps, index);
      if (!nextSelected) {
        return previous;
      }

      const nextPlayhead = findStepStartTime(previous.walkthrough.steps, index);

      return {
        ...previous,
        selectedStep: nextSelected,
        playheadTime: nextPlayhead,
      };
    });
  }, []);

  const setPlayhead = useCallback((time: number) => {
    setState((previous) => {
      if (!previous.walkthrough) {
        return previous;
      }

      const totalDuration = getTotalDuration(previous.walkthrough.steps);
      const nextTime = clamp(time, 0, totalDuration);
      const selectedIndex = findStepIndexAtTime(previous.walkthrough.steps, nextTime);

      return {
        ...previous,
        playheadTime: nextTime,
        selectedStep: buildSelectedStep(previous.walkthrough.steps, selectedIndex),
      };
    });
  }, []);

  const play = useCallback(() => {
    setState((previous) => {
      if (!previous.walkthrough) {
        return previous;
      }

      return {
        ...previous,
        mode: "playing",
      };
    });
  }, []);

  const pause = useCallback(() => {
    setState((previous) => {
      if (previous.mode !== "playing") {
        return previous;
      }

      return {
        ...previous,
        mode: "paused",
      };
    });
  }, []);

  const stop = useCallback(() => {
    setState((previous) => {
      if (!previous.walkthrough) {
        return {
          ...previous,
          mode: "stopped",
          playheadTime: 0,
        };
      }

      const firstStep = buildSelectedStep(previous.walkthrough.steps, 0);

      return {
        ...previous,
        mode: "stopped",
        playheadTime: 0,
        selectedStep: firstStep,
      };
    });
  }, []);

  const toggleLoop = useCallback(() => {
    setState((previous) => ({
      ...previous,
      loop: !previous.loop,
    }));
  }, []);

  const stepForward = useCallback(() => {
    setState((previous) => {
      if (!previous.walkthrough || previous.walkthrough.steps.length === 0) {
        return previous;
      }

      const currentIndex = previous.selectedStep?.index ?? findStepIndexAtTime(previous.walkthrough.steps, previous.playheadTime) ?? -1;
      const nextIndex = clamp(currentIndex + 1, 0, previous.walkthrough.steps.length - 1);

      return {
        ...previous,
        mode: "paused",
        playheadTime: findStepStartTime(previous.walkthrough.steps, nextIndex),
        selectedStep: buildSelectedStep(previous.walkthrough.steps, nextIndex),
      };
    });
  }, []);

  const stepBackward = useCallback(() => {
    setState((previous) => {
      if (!previous.walkthrough || previous.walkthrough.steps.length === 0) {
        return previous;
      }

      const currentIndex = previous.selectedStep?.index ?? findStepIndexAtTime(previous.walkthrough.steps, previous.playheadTime) ?? 0;
      const nextIndex = clamp(currentIndex - 1, 0, previous.walkthrough.steps.length - 1);

      return {
        ...previous,
        mode: "paused",
        playheadTime: findStepStartTime(previous.walkthrough.steps, nextIndex),
        selectedStep: buildSelectedStep(previous.walkthrough.steps, nextIndex),
      };
    });
  }, []);

  const resizeStep = useCallback((index: number, newDuration: number) => {
    setState((previous) => {
      if (!previous.walkthrough || index < 0 || index >= previous.walkthrough.steps.length) {
        return previous;
      }

      const clampedDuration = Math.max(MIN_STEP_DURATION_MS, Math.round(newDuration));
      const currentStep = previous.walkthrough.steps[index];
      if (!currentStep || currentStep.duration === clampedDuration) {
        return previous;
      }

      const nextSteps = [...previous.walkthrough.steps];
      nextSteps[index] = {
        ...currentStep,
        duration: clampedDuration,
      };

      const nextTotalDuration = getTotalDuration(nextSteps);
      const nextPlayhead = clamp(previous.playheadTime, 0, nextTotalDuration);
      const nextSelectedIndex = findSelectedIndex(nextSteps, previous.selectedStep, nextPlayhead);

      return {
        ...previous,
        walkthrough: {
          ...previous.walkthrough,
          steps: nextSteps,
        },
        playheadTime: nextPlayhead,
        selectedStep: buildSelectedStep(nextSteps, nextSelectedIndex),
      };
    });
  }, []);

  const reorderSteps = useCallback((from: number, to: number) => {
    setState((previous) => {
      if (!previous.walkthrough) {
        return previous;
      }

      const stepsToReorder = previous.walkthrough.steps;
      if (
        from < 0 ||
        from >= stepsToReorder.length ||
        to < 0 ||
        to >= stepsToReorder.length ||
        from === to
      ) {
        return previous;
      }

      const nextSteps = [...stepsToReorder];
      const [movedStep] = nextSteps.splice(from, 1);
      nextSteps.splice(to, 0, movedStep);

      const nextTotalDuration = getTotalDuration(nextSteps);
      const nextPlayhead = clamp(previous.playheadTime, 0, nextTotalDuration);
      const nextSelectedIndex = findSelectedIndex(nextSteps, previous.selectedStep, nextPlayhead);

      return {
        ...previous,
        walkthrough: {
          ...previous.walkthrough,
          steps: nextSteps,
        },
        playheadTime: nextPlayhead,
        selectedStep: buildSelectedStep(nextSteps, nextSelectedIndex),
      };
    });
  }, []);

  const loadWalkthrough = useCallback((walkthrough: Walkthrough) => {
    setState((previous) => ({
      ...previous,
      walkthrough,
      selectedStep: buildSelectedStep(walkthrough.steps, walkthrough.steps.length > 0 ? 0 : null),
      playheadTime: 0,
      mode: "stopped",
    }));
  }, []);

  const updateSelectedStep = useCallback((updater: (step: Step) => Step) => {
    setState((previous) => {
      if (!previous.walkthrough || !previous.selectedStep) {
        return previous;
      }

      const nextSteps = [...previous.walkthrough.steps];
      const selectedIndex = previous.selectedStep.index;
      const currentStep = nextSteps[selectedIndex];

      if (!currentStep) {
        return previous;
      }

      const nextStep = updater(currentStep);
      nextSteps[selectedIndex] = nextStep;

      return {
        ...previous,
        walkthrough: {
          ...previous.walkthrough,
          steps: nextSteps,
        },
        selectedStep: {
          index: selectedIndex,
          step: nextStep,
        },
      };
    });
  }, []);

  useEffect(() => {
    if (state.mode !== "playing") {
      return;
    }

    let frameId = 0;
    let previousTime = performance.now();

    const tick = (now: number): void => {
      const delta = now - previousTime;
      previousTime = now;

      setState((previous) => {
        if (previous.mode !== "playing" || !previous.walkthrough) {
          return previous;
        }

        const totalDuration = getTotalDuration(previous.walkthrough.steps);
        if (totalDuration === 0) {
          return {
            ...previous,
            mode: "stopped",
            playheadTime: 0,
            selectedStep: null,
          };
        }

        let nextPlayheadTime = previous.playheadTime + delta;
        let nextMode: PlaybackMode = previous.mode;

        if (nextPlayheadTime >= totalDuration) {
          if (previous.loop) {
            nextPlayheadTime %= totalDuration;
          } else {
            nextPlayheadTime = totalDuration;
            nextMode = "stopped";
          }
        }

        const selectedIndex = findStepIndexAtTime(previous.walkthrough.steps, nextPlayheadTime);

        return {
          ...previous,
          mode: nextMode,
          playheadTime: nextPlayheadTime,
          selectedStep: buildSelectedStep(previous.walkthrough.steps, selectedIndex),
        };
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [state.mode]);

  return {
    state,
    selectStep,
    setPlayhead,
    play,
    pause,
    stop,
    toggleLoop,
    stepForward,
    stepBackward,
    resizeStep,
    reorderSteps,
    loadWalkthrough,
    updateSelectedStep,
  };
};

export type { UseStudioResult };

export const getWalkthroughDuration = (stepsToMeasure: Step[]): number =>
  getTotalDuration(stepsToMeasure);
