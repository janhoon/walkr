import type { Step } from "../../core/src/types";

import { PlaybackControls } from "./components/PlaybackControls";
import { PreviewPane } from "./components/PreviewPane";
import { StepSidebar } from "./components/StepSidebar";
import { Timeline } from "./components/Timeline";
import { useStudio, getWalkthroughDuration } from "./hooks/useStudio";

const appStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at 20% 20%, #1a2639, #0b1220 55%)",
  color: "#e2e8f0",
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
  boxSizing: "border-box",
  padding: 16,
};

const updateStepOption = (step: Step, key: string, value: unknown): Step => ({
  ...step,
  options: {
    ...(step.options as Record<string, unknown>),
    [key]: value,
  },
});

function App() {
  const {
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
    updateSelectedStep,
  } = useStudio();

  const steps = state.walkthrough?.steps ?? [];
  const totalDuration = getWalkthroughDuration(steps);
  const selectedIndex = state.selectedStep?.index ?? null;

  return (
    <main style={appStyle}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr) 240px",
          gap: 14,
          alignItems: "start",
        }}
      >
        <StepSidebar
          selectedStep={state.selectedStep}
          onChangeOption={(key, value) => {
            updateSelectedStep((step) => updateStepOption(step, key, value));
          }}
        />

        <section style={{ display: "grid", gap: 12 }}>
          <Timeline
            steps={steps}
            totalDuration={totalDuration}
            playheadTime={state.playheadTime}
            selectedIndex={selectedIndex}
            onSelectStep={selectStep}
            onScrub={(time) => {
              if (state.mode === "playing") {
                pause();
              }
              setPlayhead(time);
            }}
            onResizeStep={resizeStep}
            onReorderSteps={reorderSteps}
          />
          <PreviewPane walkthrough={state.walkthrough} mode={state.mode} />
        </section>

        <PlaybackControls
          mode={state.mode}
          currentStep={(selectedIndex ?? 0) + 1}
          totalSteps={steps.length}
          playheadTime={state.playheadTime}
          loop={state.loop}
          onPlay={play}
          onPause={pause}
          onStepForward={stepForward}
          onStepBackward={stepBackward}
          onToggleLoop={toggleLoop}
        />
      </div>

      <div style={{ marginTop: 10, color: "#8fa5c2", fontSize: 12 }}>
        <button
          type="button"
          onClick={stop}
          style={{
            all: "unset",
            cursor: "pointer",
            border: "1px solid #2c3e55",
            borderRadius: 8,
            padding: "6px 10px",
            background: "#0f1f32",
            color: "#e2e8f0",
          }}
        >
          Stop
        </button>
      </div>
    </main>
  );
}

export default App;
