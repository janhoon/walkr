import { useEffect, useMemo, useRef, useState } from "react";

import type { Step } from "../../../core/src/types";
import { StepBlock } from "./StepBlock";

interface TimelineProps {
  steps: Step[];
  totalDuration: number;
  playheadTime: number;
  selectedIndex: number | null;
  onSelectStep: (index: number) => void;
  onScrub: (time: number) => void;
  onResizeStep: (index: number, newDuration: number) => void;
  onReorderSteps: (fromIndex: number, toIndex: number) => void;
}

const MIN_BLOCK_WIDTH = 48;
const PIXELS_PER_MS = 1;
const BLOCK_GAP = 8;
const TRACK_SIDE_PADDING = 4;
const DRAG_THRESHOLD_PX = 6;

const getBlockWidth = (duration: number): number => {
  const rawWidth = duration * PIXELS_PER_MS;
  return Math.max(rawWidth, MIN_BLOCK_WIDTH);
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

interface ReorderState {
  fromIndex: number;
  startX: number;
  pointerId: number;
  isDragging: boolean;
  insertionIndex: number | null;
}

export const Timeline = ({
  steps,
  totalDuration,
  playheadTime,
  selectedIndex,
  onSelectStep,
  onScrub,
  onResizeStep,
  onReorderSteps,
}: TimelineProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reorderStateRef = useRef<ReorderState | null>(null);
  const cleanupReorderRef = useRef<(() => void) | null>(null);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndicatorX, setDropIndicatorX] = useState<number | null>(null);

  const widths = useMemo(() => steps.map((step) => getBlockWidth(step.duration)), [steps]);

  const starts = useMemo(() => {
    let cursor = TRACK_SIDE_PADDING;
    return widths.map((width) => {
      const start = cursor;
      cursor += width + BLOCK_GAP;
      return start;
    });
  }, [widths]);

  const contentWidth = useMemo(() => {
    if (widths.length === 0) {
      return TRACK_SIDE_PADDING * 2;
    }

    const totalStepWidth = widths.reduce((sum, width) => sum + width, 0);
    return TRACK_SIDE_PADDING * 2 + totalStepWidth + BLOCK_GAP * (widths.length - 1);
  }, [widths]);

  const timelinePixelWidth = Math.max(contentWidth - TRACK_SIDE_PADDING * 2, 0);

  const playheadX = useMemo(() => {
    if (totalDuration <= 0 || timelinePixelWidth <= 0) {
      return TRACK_SIDE_PADDING;
    }

    return clamp(
      TRACK_SIDE_PADDING + (playheadTime / totalDuration) * timelinePixelWidth,
      TRACK_SIDE_PADDING,
      TRACK_SIDE_PADDING + timelinePixelWidth,
    );
  }, [playheadTime, totalDuration, timelinePixelWidth]);

  const getInsertionIndex = (contentX: number): number => {
    for (let index = 0; index < widths.length; index += 1) {
      const midpoint = starts[index] + widths[index] / 2;
      if (contentX < midpoint) {
        return index;
      }
    }

    return widths.length;
  };

  const getDropIndicatorPosition = (insertionIndex: number): number => {
    if (widths.length === 0) {
      return TRACK_SIDE_PADDING;
    }

    if (insertionIndex <= 0) {
      return starts[0];
    }

    if (insertionIndex >= widths.length) {
      const last = widths.length - 1;
      return starts[last] + widths[last] + BLOCK_GAP / 2;
    }

    return starts[insertionIndex] - BLOCK_GAP / 2;
  };

  const clearReorderInteraction = (): void => {
    cleanupReorderRef.current?.();
    cleanupReorderRef.current = null;
    reorderStateRef.current = null;
    setDraggingIndex(null);
    setDropIndicatorX(null);
  };

  const scrubFromClientX = (clientX: number): void => {
    if (!trackRef.current || totalDuration <= 0 || timelinePixelWidth <= 0) {
      return;
    }

    const bounds = trackRef.current.getBoundingClientRect();
    const localX = clamp(clientX - bounds.left + trackRef.current.scrollLeft - TRACK_SIDE_PADDING, 0, timelinePixelWidth);
    const ratio = timelinePixelWidth === 0 ? 0 : localX / timelinePixelWidth;
    onScrub(ratio * totalDuration);
  };

  const startScrub = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    scrubFromClientX(event.clientX);

    const onMove = (moveEvent: PointerEvent): void => {
      scrubFromClientX(moveEvent.clientX);
    };

    const onEnd = (): void => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  const startReorder = (index: number, event: React.PointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    reorderStateRef.current = {
      fromIndex: index,
      startX: event.clientX,
      pointerId: event.pointerId,
      isDragging: false,
      insertionIndex: null,
    };

    setDraggingIndex(index);

    const onMove = (moveEvent: PointerEvent): void => {
      const reorderState = reorderStateRef.current;
      if (!reorderState || moveEvent.pointerId !== reorderState.pointerId || !trackRef.current) {
        return;
      }

      if (!reorderState.isDragging && Math.abs(moveEvent.clientX - reorderState.startX) < DRAG_THRESHOLD_PX) {
        return;
      }

      reorderState.isDragging = true;

      const bounds = trackRef.current.getBoundingClientRect();
      const contentX = clamp(moveEvent.clientX - bounds.left + trackRef.current.scrollLeft, 0, contentWidth);
      const insertionIndex = getInsertionIndex(contentX);

      reorderState.insertionIndex = insertionIndex;
      setDropIndicatorX(getDropIndicatorPosition(insertionIndex));
    };

    const onEnd = (): void => {
      const reorderState = reorderStateRef.current;

      clearReorderInteraction();

      if (!reorderState) {
        return;
      }

      if (!reorderState.isDragging || reorderState.insertionIndex === null) {
        onSelectStep(index);
        return;
      }

      const rawToIndex = reorderState.insertionIndex > reorderState.fromIndex ? reorderState.insertionIndex - 1 : reorderState.insertionIndex;
      const toIndex = clamp(rawToIndex, 0, steps.length - 1);

      if (toIndex !== reorderState.fromIndex) {
        onReorderSteps(reorderState.fromIndex, toIndex);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);

    cleanupReorderRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  };

  useEffect(() => () => {
    clearReorderInteraction();
  }, []);

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
        onPointerDown={startScrub}
        style={{
          position: "relative",
          display: "flex",
          gap: BLOCK_GAP,
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
            dragging={draggingIndex === index}
            onClick={() => onSelectStep(index)}
            onPointerDown={(event) => startReorder(index, event)}
            onResizeDuration={(newDuration) => onResizeStep(index, newDuration)}
          />
        ))}

        {dropIndicatorX !== null ? (
          <div
            style={{
              position: "absolute",
              left: dropIndicatorX,
              top: 6,
              bottom: 10,
              width: 2,
              background: "#f97316",
              pointerEvents: "none",
            }}
          />
        ) : null}

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
