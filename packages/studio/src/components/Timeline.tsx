import { useMemo, useRef } from "react";

import type { Step } from "../../../core/src/types";
import { StepBlock } from "./StepBlock";

interface TimelineProps {
  steps: Step[];
  totalDuration: number;
  playheadTime: number;
  selectedIndex: number | null;
  onSelectStep: (index: number) => void;
  onScrub: (time: number) => void;
}

const MIN_BLOCK_WIDTH = 48;
const MAX_BLOCK_WIDTH = 260;
const PIXELS_PER_MS = 1;

const getBlockWidth = (duration: number): number => {
  const rawWidth = duration * PIXELS_PER_MS;
  return Math.min(Math.max(rawWidth, MIN_BLOCK_WIDTH), MAX_BLOCK_WIDTH);
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

export const Timeline = ({
  steps,
  totalDuration,
  playheadTime,
  selectedIndex,
  onSelectStep,
  onScrub,
}: TimelineProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const widths = useMemo(() => steps.map((step) => getBlockWidth(step.duration)), [steps]);
  const trackWidth = useMemo(() => widths.reduce((sum, width) => sum + width, 0), [widths]);

  const playheadX = useMemo(() => {
    if (totalDuration <= 0 || trackWidth <= 0) {
      return 0;
    }

    return clamp((playheadTime / totalDuration) * trackWidth, 0, trackWidth);
  }, [playheadTime, totalDuration, trackWidth]);

  const scrubFromClientX = (clientX: number): void => {
    if (!trackRef.current || totalDuration <= 0 || trackWidth <= 0) {
      return;
    }

    const bounds = trackRef.current.getBoundingClientRect();
    const localX = clamp(clientX - bounds.left, 0, bounds.width);
    const ratio = bounds.width === 0 ? 0 : localX / bounds.width;
    onScrub(ratio * totalDuration);
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();

    scrubFromClientX(event.clientX);

    const onMove = (moveEvent: PointerEvent): void => {
      scrubFromClientX(moveEvent.clientX);
    };

    const onEnd = (): void => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        border: "1px solid #243244",
        background: "#0e1725",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#8fa5c2" }}>Timeline</div>
      <div
        ref={trackRef}
        onPointerDown={startDrag}
        style={{
          position: "relative",
          display: "flex",
          gap: 8,
          alignItems: "stretch",
          overflowX: "auto",
          padding: "8px 4px 20px",
          cursor: "ew-resize",
          userSelect: "none",
        }}
      >
        {steps.map((step, index) => (
          <StepBlock
            key={step.id}
            step={step}
            index={index}
            width={widths[index]}
            selected={selectedIndex === index}
            onClick={() => onSelectStep(index)}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: playheadX,
            top: 4,
            bottom: 8,
            width: 2,
            background: "#38bdf8",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: playheadX - 6,
            top: 0,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#38bdf8",
            boxShadow: "0 0 0 2px #0f172a",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};
