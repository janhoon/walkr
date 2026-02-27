import type { Step } from "../../../core/src/types";

import { COLOR_MAP } from "../constants";

interface StepBlockProps {
  step: Step;
  index: number;
  width: number;
  selected: boolean;
  onClick: () => void;
}

const durationLabel = (duration: number): string => `${Math.round(duration)}ms`;

export const StepBlock = ({ step, index, width, selected, onClick }: StepBlockProps) => {
  const background = COLOR_MAP[step.type] ?? "#334155";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: "unset",
        width,
        minWidth: width,
        boxSizing: "border-box",
        borderRadius: 8,
        padding: "8px 10px",
        background,
        color: "#ffffff",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: selected ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px rgba(14,165,233,0.8)" : "inset 0 0 0 1px rgba(255,255,255,0.2)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700 }}>{`${step.type} #${index + 1}`}</div>
      <div
        style={{
          alignSelf: "flex-start",
          fontSize: 11,
          borderRadius: 999,
          background: "rgba(0, 0, 0, 0.22)",
          padding: "2px 8px",
        }}
      >
        {durationLabel(step.duration)}
      </div>
    </button>
  );
};
