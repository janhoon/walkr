import { useRef, useState } from "react";

import type { Step } from "../../../core/src/types";

import { COLOR_MAP } from "../constants";

interface StepBlockProps {
  step: Step;
  index: number;
  width: number;
  selected: boolean;
  dragging?: boolean;
  onClick: () => void;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onResizeDuration: (newDuration: number) => void;
}

const durationLabel = (duration: number): string => `${Math.round(duration)}ms`;
const MIN_DURATION_MS = 50;

export const StepBlock = ({
  step,
  index,
  width,
  selected,
  dragging = false,
  onClick,
  onPointerDown,
  onResizeDuration,
}: StepBlockProps) => {
  const background = COLOR_MAP[step.type] ?? "#334155";
  const [isResizing, setIsResizing] = useState(false);
  const nextDurationRef = useRef(step.duration);

  const startResize = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startDuration = step.duration;
    nextDurationRef.current = startDuration;
    setIsResizing(true);

    const onMove = (moveEvent: PointerEvent): void => {
      const deltaX = moveEvent.clientX - startX;
      nextDurationRef.current = Math.max(MIN_DURATION_MS, Math.round(startDuration + deltaX));
    };

    const onEnd = (): void => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      setIsResizing(false);
      onResizeDuration(nextDurationRef.current);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(event) => {
        event.stopPropagation();
        onPointerDown?.(event);
      }}
      style={{
        all: "unset",
        width,
        minWidth: width,
        boxSizing: "border-box",
        position: "relative",
        borderRadius: 8,
        padding: "8px 10px",
        background,
        color: "#ffffff",
        cursor: dragging || isResizing ? "grabbing" : "grab",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        opacity: dragging ? 0.6 : 1,
        boxShadow: selected
          ? "0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px rgba(14,165,233,0.8)"
          : "inset 0 0 0 1px rgba(255,255,255,0.2)",
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
      <div
        onPointerDown={startResize}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 10,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          background: isResizing ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
          cursor: "ew-resize",
        }}
      />
    </button>
  );
};
