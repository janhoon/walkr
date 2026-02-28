import type React from "react";
import type { PlaybackStatus } from "../types";

interface PlaybackControlsProps {
  status: PlaybackStatus;
  currentStepIndex: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onLoop: (loop: boolean) => void;
  loop: boolean;
}

const btnStyle: React.CSSProperties = {
  background: "transparent",
  color: "#a0a0a0",
  border: "none",
  cursor: "pointer",
  fontSize: 16,
  padding: "4px 8px",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const playBtnStyle: React.CSSProperties = {
  background: "#3b82f6",
  color: "white",
  border: "none",
  cursor: "pointer",
  borderRadius: 6,
  width: 36,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
};

export function PlaybackControls({
  status,
  currentStepIndex,
  totalSteps,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onReset,
  onLoop,
  loop,
}: PlaybackControlsProps) {
  return (
    <div
      style={{
        height: 44,
        background: "#1c1c1c",
        borderTop: "1px solid #2a2a2a",
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      <button type="button" style={btnStyle} onClick={onReset} title="Reset">
        ⏮
      </button>
      <button type="button" style={btnStyle} onClick={onStepBack} title="Step back">
        ⏪
      </button>
      <button
        type="button"
        style={playBtnStyle}
        onClick={status === "playing" ? onPause : onPlay}
        title={status === "playing" ? "Pause" : "Play"}
      >
        {status === "playing" ? "⏸" : "▶"}
      </button>
      <button type="button" style={btnStyle} onClick={onStepForward} title="Step forward">
        ⏩
      </button>
      <button
        type="button"
        style={{
          ...btnStyle,
          color: loop ? "#3b82f6" : "#a0a0a0",
        }}
        onClick={() => onLoop(!loop)}
        title="Loop"
      >
        🔁
      </button>
      <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>
        Step {currentStepIndex + 1} / {totalSteps}
      </span>
    </div>
  );
}
