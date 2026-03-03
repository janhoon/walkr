import type { Step } from "@walkrstudio/core";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TimelineProps {
  steps: Step[];
  selectedStepIndex: number | null;
  currentStepIndex: number;
  playheadTime: number;
  totalDuration: number;
  onSelectStep: (index: number) => void;
  onSeek: (timeMs: number) => void;
  onUpdateDuration: (stepIndex: number, newDuration: number) => void;
  onReorderStep: (fromIndex: number, toIndex: number) => void;
}

const STEP_COLORS: Record<string, string> = {
  moveTo: "#1d3a5c",
  click: "#3b1d5c",
  type: "#1d5c2a",
  scroll: "#5c3b1d",
  wait: "#333",
  zoom: "#5c1d3b",
  pan: "#1d5c5c",
  highlight: "#5c5c1d",
  clearCache: "#5c2a1d",
  drag: "#4a1d5c",
};

const STEP_BORDER_COLORS: Record<string, string> = {
  moveTo: "#2a4f75",
  click: "#4f2a75",
  type: "#2a753f",
  scroll: "#754f2a",
  wait: "#444",
  zoom: "#752a4f",
  pan: "#2a7575",
  highlight: "#75752a",
  clearCache: "#753f2a",
  drag: "#6a3d7c",
};

const SCALE = 0.3; // 1ms = 0.3px
const MIN_BLOCK_WIDTH = 40;

function stepWidth(duration: number): number {
  return Math.max(duration * SCALE, MIN_BLOCK_WIDTH);
}

export function Timeline({
  steps,
  selectedStepIndex,
  currentStepIndex,
  playheadTime,
  totalDuration,
  onSelectStep,
  onSeek,
  onUpdateDuration,
  onReorderStep,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{
    index: number;
    startX: number;
    startDuration: number;
  } | null>(null);
  const [resizePreview, setResizePreview] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [_draggingPlayhead, setDraggingPlayhead] = useState(false);

  const totalWidth = steps.reduce((sum, s) => sum + stepWidth(s.duration), 0);

  const handlePlayheadMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDraggingPlayhead(true);

      const onMove = (ev: MouseEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
        const ratio = x / totalWidth;
        onSeek(Math.round(ratio * totalDuration));
      };

      const onUp = () => {
        setDraggingPlayhead(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [totalDuration, totalWidth, onSeek],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, index: number, duration: number) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      setResizing({ index, startX, startDuration: duration });

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const newDuration = Math.max(50, Math.round(duration + dx / SCALE));
        setResizePreview(newDuration);
      };

      const onUp = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const newDuration = Math.max(50, Math.round(duration + dx / SCALE));
        onUpdateDuration(index, newDuration);
        setResizing(null);
        setResizePreview(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onUpdateDuration],
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (!Number.isNaN(fromIndex) && fromIndex !== toIndex) {
        onReorderStep(fromIndex, toIndex);
      }
      setDragIndex(null);
      setDropTarget(null);
    },
    [onReorderStep],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropTarget(null);
  }, []);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / totalWidth;
      onSeek(Math.round(ratio * totalDuration));
    },
    [totalDuration, totalWidth, onSeek],
  );

  // Compute playhead X by walking through steps, accounting for
  // non-linear time-to-pixel mapping (MIN_BLOCK_WIDTH inflates 0ms steps)
  let playheadX = 0;
  if (totalDuration > 0) {
    let timeRemaining = playheadTime;
    for (let i = 0; i < steps.length; i++) {
      const dur = steps[i].duration;
      const w = stepWidth(dur);
      if (timeRemaining <= dur) {
        // Playhead is within this step
        playheadX += dur > 0 ? (timeRemaining / dur) * w : 0;
        break;
      }
      playheadX += w + 4; // 4 = gap between blocks
      timeRemaining -= dur;
    }
  }

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const playheadLeft = 8 + playheadX;
    const { scrollLeft, clientWidth } = container;
    const margin = 60;
    if (playheadLeft > scrollLeft + clientWidth - margin) {
      container.scrollLeft = playheadLeft - clientWidth + margin;
    } else if (playheadLeft < scrollLeft + margin) {
      container.scrollLeft = playheadLeft - margin;
    }
  }, [playheadX]);

  // Time markers
  let cumulativeMs = 0;
  const _stepOffsets = steps.map((s) => {
    const offset = cumulativeMs;
    cumulativeMs += s.duration;
    return offset;
  });

  return (
    <div
      style={{
        height: 120,
        background: "#141414",
        borderTop: "1px solid #2a2a2a",
        display: "flex",
        flexShrink: 0,
      }}
    >
      {/* Left column: time markers */}
      <div
        style={{
          width: 60,
          borderRight: "1px solid #2a2a2a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 10,
          color: "#555",
          flexShrink: 0,
        }}
      >
        <div>{formatTime(playheadTime)}</div>
        <div style={{ marginTop: 4, color: "#444" }}>{formatTime(totalDuration)}</div>
      </div>

      {/* Main track area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            padding: "24px 8px",
            gap: 4,
            minWidth: totalWidth + 16,
            position: "relative",
            cursor: "pointer",
          }}
          onClick={handleTrackClick}
        >
          {/* Step blocks */}
          {steps.map((step, i) => {
            const w =
              resizing?.index === i && resizePreview !== null
                ? stepWidth(resizePreview)
                : stepWidth(step.duration);
            const isSelected = selectedStepIndex === i;
            const isCurrent = currentStepIndex === i;
            const isDragTarget = dropTarget === i;

            return (
              <div
                key={step.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStep(i);
                }}
                style={{
                  width: w,
                  height: 72,
                  background: STEP_COLORS[step.type] ?? "#333",
                  border: `1px solid ${STEP_BORDER_COLORS[step.type] ?? "#444"}`,
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "grab",
                  position: "relative",
                  flexShrink: 0,
                  userSelect: "none",
                  boxShadow: isSelected
                    ? "0 0 0 2px #3b82f6"
                    : isCurrent
                      ? "0 0 0 2px #10b981"
                      : "none",
                  opacity: dragIndex === i ? 0.5 : 1,
                  borderLeft: isDragTarget ? "3px solid #3b82f6" : undefined,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "#e8e8e8",
                  }}
                >
                  {step.type}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {resizing?.index === i && resizePreview !== null
                    ? `${resizePreview}ms`
                    : `${step.duration}ms`}
                </span>

                {/* Resize handle */}
                <div
                  onMouseDown={(e) => handleResizeStart(e, i, step.duration)}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    cursor: "col-resize",
                    borderRadius: "0 6px 6px 0",
                  }}
                />
              </div>
            );
          })}

          {/* Playhead */}
          <div
            onMouseDown={handlePlayheadMouseDown}
            style={{
              position: "absolute",
              left: 8 + playheadX,
              top: 0,
              bottom: 0,
              width: 2,
              background: "#ef4444",
              cursor: "ew-resize",
              zIndex: 10,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: -4,
                width: 10,
                height: 10,
                background: "#ef4444",
                borderRadius: "50%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const s = ms / 1000;
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(1);
  return mins > 0 ? `${mins}:${secs.padStart(4, "0")}` : `${secs}s`;
}
