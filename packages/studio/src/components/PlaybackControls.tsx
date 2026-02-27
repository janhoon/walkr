import type { PlaybackMode } from "../types";

interface PlaybackControlsProps {
  mode: PlaybackMode;
  currentStep: number;
  totalSteps: number;
  playheadTime: number;
  loop: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onToggleLoop: () => void;
}

const formatMs = (value: number): string => {
  const rounded = Math.max(0, Math.round(value));
  const minutes = Math.floor(rounded / 60000);
  const seconds = Math.floor((rounded % 60000) / 1000);
  const ms = rounded % 1000;
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
};

const buttonStyle: React.CSSProperties = {
  all: "unset",
  cursor: "pointer",
  borderRadius: 8,
  border: "1px solid #2c3e55",
  color: "#e2e8f0",
  background: "#0f1f32",
  padding: "8px 10px",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 42,
};

export const PlaybackControls = ({
  mode,
  currentStep,
  totalSteps,
  playheadTime,
  loop,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onToggleLoop,
}: PlaybackControlsProps) => (
  <aside
    style={{
      background: "#0f172a",
      border: "1px solid #223146",
      borderRadius: 14,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      minWidth: 220,
    }}
  >
    <div style={{ fontSize: 12, color: "#8fa5c2" }}>Playback</div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" onClick={onStepBackward} style={buttonStyle} title="Step backward">
        ⏮
      </button>
      <button
        type="button"
        onClick={mode === "playing" ? onPause : onPlay}
        style={{ ...buttonStyle, minWidth: 64, fontWeight: 700 }}
      >
        {mode === "playing" ? "⏸" : "▶"}
      </button>
      <button type="button" onClick={onStepForward} style={buttonStyle} title="Step forward">
        ⏭
      </button>
      <button
        type="button"
        onClick={onToggleLoop}
        style={{
          ...buttonStyle,
          borderColor: loop ? "#38bdf8" : buttonStyle.border,
          boxShadow: loop ? "0 0 0 2px rgba(56, 189, 248, 0.2)" : undefined,
        }}
        title="Toggle loop"
      >
        🔁
      </button>
    </div>
    <div style={{ color: "#cbd5e1", fontSize: 13 }}>{`Step ${currentStep}/${Math.max(totalSteps, 1)}`}</div>
    <div style={{ color: "#8fa5c2", fontSize: 12 }}>{`Elapsed ${formatMs(playheadTime)}`}</div>
  </aside>
);
