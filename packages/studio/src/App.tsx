import type { Step } from "@walkrstudio/core";
import { WalkrEngine } from "@walkrstudio/engine";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlaybackControls } from "./components/PlaybackControls";
import { StepPanel } from "./components/StepPanel";
import { Timeline } from "./components/Timeline";
import type { PlaybackStatus, WalkthroughDef } from "./types";

const DEMO_WALKTHROUGH: WalkthroughDef = {
  url: "https://example.com",
  title: "Demo Walkthrough",
  steps: [
    { id: "step_1", type: "moveTo", duration: 600, options: { x: 200, y: 150, easing: "ease" } },
    {
      id: "step_2",
      type: "click",
      duration: 200,
      options: { x: 200, y: 150, button: "left", double: false },
    },
    {
      id: "step_3",
      type: "type",
      duration: 1200,
      options: { text: "hello@example.com", delay: 80 },
    },
    { id: "step_4", type: "wait", duration: 500, options: { ms: 500 } },
    {
      id: "step_5",
      type: "moveTo",
      duration: 400,
      options: { x: 400, y: 300, easing: "ease-out" },
    },
    {
      id: "step_6",
      type: "zoom",
      duration: 600,
      options: { level: 1.5, follow: true, easing: "ease" },
    },
    {
      id: "step_7",
      type: "click",
      duration: 200,
      options: { x: 400, y: 300, button: "left", double: false },
    },
    {
      id: "step_8",
      type: "zoom",
      duration: 400,
      options: { level: 1, follow: false, easing: "ease" },
    },
  ],
};

const isRecordMode = new URLSearchParams(window.location.search).get("mode") === "record";

declare global {
  interface Window {
    __walkrPlay?: () => void;
    __walkrIsComplete?: () => boolean;
  }
}

function RecordMode() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WalkrEngine | null>(null);
  const walkthroughRef = useRef<WalkthroughDef | null>(null);
  const [walkthrough, setWalkthrough] = useState<WalkthroughDef | null>(null);
  const completeRef = useRef(false);

  // Load walkthrough
  useEffect(() => {
    fetch("/walkthrough.json")
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json() as Promise<WalkthroughDef>;
      })
      .then((data) => {
        if (data?.url && Array.isArray(data.steps)) {
          setWalkthrough(data);
        }
      })
      .catch(() => {});
  }, []);

  // Expose record API on window (stable across React re-renders)
  useEffect(() => {
    window.__walkrPlay = () => {
      const engine = engineRef.current;
      const wt = walkthroughRef.current;
      if (!engine || !wt) return;
      completeRef.current = false;
      engine.play(wt).catch(() => {});
    };

    window.__walkrIsComplete = () => completeRef.current;

    return () => {
      delete window.__walkrPlay;
      delete window.__walkrIsComplete;
    };
  }, []);

  // Init engine
  useEffect(() => {
    if (!containerRef.current || !walkthrough) return;

    walkthroughRef.current = walkthrough;

    const engine = new WalkrEngine({
      container: containerRef.current,
      cursor: walkthrough.cursor,
    });

    engine.on("step", () => {
      console.log("__WALKR_RECORD_STEPPING__");
    });

    engine.on("complete", () => {
      completeRef.current = true;
      console.log("__WALKR_RECORD_COMPLETE__");
    });

    engineRef.current = engine;
    console.log("__WALKR_RECORD_READY__");

    return () => {
      engine.unmount();
      engineRef.current = null;
    };
  }, [walkthrough]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#000",
      }}
    />
  );
}

export function App() {
  if (isRecordMode) {
    return <RecordMode />;
  }
  return <StudioApp />;
}

function StudioApp() {
  const [walkthrough, setWalkthrough] = useState<WalkthroughDef | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [loop, setLoop] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportBtnRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WalkrEngine | null>(null);

  // Load walkthrough.json on mount, then listen for live updates via Vite HMR
  useEffect(() => {
    fetch("/walkthrough.json")
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json() as Promise<WalkthroughDef>;
      })
      .then((data) => {
        if (data?.url && Array.isArray(data.steps)) {
          setWalkthrough(data);
        } else {
          setWalkthrough(DEMO_WALKTHROUGH);
        }
      })
      .catch(() => setWalkthrough(DEMO_WALKTHROUGH));

    if (import.meta.hot) {
      import.meta.hot.on("walkthrough:update", (data: WalkthroughDef) => {
        if (data?.url && Array.isArray(data.steps)) {
          setWalkthrough(data);
        }
      });
    }
  }, []);

  // Initialize engine when container is ready
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new WalkrEngine({
      container: containerRef.current,
      cursor: walkthrough?.cursor,
    });

    engine.on("complete", () => {
      setPlaybackStatus("idle");
      setPlayheadTime(0);
      setCurrentStepIndex(0);
    });

    engineRef.current = engine;

    return () => {
      engine.unmount();
      engineRef.current = null;
    };
  }, [walkthrough?.cursor]);

  const steps = walkthrough?.steps ?? [];
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  // Animate playhead forward while playing
  const playheadRef = useRef(playheadTime);
  playheadRef.current = playheadTime;
  const stepIndexRef = useRef(currentStepIndex);
  stepIndexRef.current = currentStepIndex;

  useEffect(() => {
    if (playbackStatus !== "playing") return;

    let frameId = 0;
    let previousTime = performance.now();

    const tick = (now: number) => {
      const delta = now - previousTime;
      previousTime = now;

      let next = playheadRef.current + delta;
      if (next >= totalDuration) {
        if (loop) {
          next = next % totalDuration;
        } else {
          next = totalDuration;
        }
      }

      setPlayheadTime(next);

      // Derive step index from playhead position
      let newIndex = steps.length - 1;
      let accumulated = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulated += steps[i].duration;
        if (next < accumulated || (next === 0 && accumulated === 0)) {
          newIndex = i;
          break;
        }
      }

      if (newIndex !== stepIndexRef.current) {
        setCurrentStepIndex(newIndex);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [playbackStatus, totalDuration, loop, steps]);

  // Close export menu when clicking outside
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportBtnRef.current && !exportBtnRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuOpen]);

  const handleExportJSON = useCallback(() => {
    if (!walkthrough) return;
    const json = JSON.stringify(walkthrough, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(walkthrough.title ?? "walkthrough").replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  }, [walkthrough]);

  const handleCopyJSON = useCallback(() => {
    if (!walkthrough) return;
    const json = JSON.stringify(walkthrough, null, 2);
    navigator.clipboard.writeText(json);
    setExportMenuOpen(false);
  }, [walkthrough]);

  const handleLoadScript = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.ts";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text) as WalkthroughDef;
        setWalkthrough(parsed);
        setSelectedStepIndex(null);
        setCurrentStepIndex(0);
        setPlayheadTime(0);
        setPlaybackStatus("idle");
      } catch {
        // ignore invalid JSON
      }
    };
    input.click();
  }, []);

  const handleStepUpdate = useCallback((stepIndex: number, updates: Partial<Step>) => {
    setWalkthrough((prev) => {
      if (!prev) return prev;
      const newSteps = prev.steps.map((step, i) => {
        if (i !== stepIndex) return step;
        return {
          ...step,
          ...updates,
          options: updates.options ? { ...step.options, ...updates.options } : step.options,
        };
      });
      return { ...prev, steps: newSteps };
    });
  }, []);

  const handleReorderStep = useCallback((fromIndex: number, toIndex: number) => {
    setWalkthrough((prev) => {
      if (!prev) return prev;
      const newSteps = [...prev.steps];
      const [moved] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, moved);
      return { ...prev, steps: newSteps };
    });
  }, []);

  const handleSeek = useCallback(
    (timeMs: number) => {
      const clamped = Math.max(0, Math.min(timeMs, totalDuration));
      setPlayheadTime(clamped);

      let accumulated = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulated += steps[i].duration;
        if (clamped <= accumulated) {
          setCurrentStepIndex(i);
          return;
        }
      }
      setCurrentStepIndex(Math.max(0, steps.length - 1));
    },
    [steps, totalDuration],
  );

  const handlePlay = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !walkthrough) return;

    if (playbackStatus === "paused") {
      engine.resume();
      setPlaybackStatus("playing");
    } else {
      setPlaybackStatus("playing");
      setCurrentStepIndex(0);
      setPlayheadTime(0);
      engine.play(walkthrough).catch(() => {
        setPlaybackStatus("idle");
      });
    }
  }, [walkthrough, playbackStatus]);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
    setPlaybackStatus("paused");
  }, []);

  const handleReset = useCallback(() => {
    // Unmount and remount to reset
    const engine = engineRef.current;
    if (engine && containerRef.current) {
      engine.unmount();
      engine.mount(containerRef.current);
    }
    setPlaybackStatus("idle");
    setCurrentStepIndex(0);
    setPlayheadTime(0);
  }, []);

  const handleStepBack = useCallback(() => {
    const newIndex = Math.max(0, currentStepIndex - 1);
    setCurrentStepIndex(newIndex);
    let time = 0;
    for (let i = 0; i < newIndex; i++) {
      time += steps[i].duration;
    }
    setPlayheadTime(time);
  }, [currentStepIndex, steps]);

  const handleStepForward = useCallback(() => {
    const newIndex = Math.min(steps.length - 1, currentStepIndex + 1);
    setCurrentStepIndex(newIndex);
    let time = 0;
    for (let i = 0; i < newIndex; i++) {
      time += steps[i].duration;
    }
    setPlayheadTime(time);
  }, [currentStepIndex, steps]);

  const handleUpdateDuration = useCallback(
    (stepIndex: number, newDuration: number) => {
      handleStepUpdate(stepIndex, { duration: newDuration });
    },
    [handleStepUpdate],
  );

  const selectedStep = selectedStepIndex !== null ? (steps[selectedStepIndex] ?? null) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <header
        style={{
          height: 48,
          background: "#0f0f0f",
          borderBottom: "1px solid #2a2a2a",
          padding: "0 16px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "0.05em" }}>
          Walkr Studio
        </span>

        {walkthrough && (
          <span style={{ fontSize: 12, color: "#888", marginLeft: 12 }}>
            {walkthrough.title ?? "Untitled"} — {walkthrough.steps.length} steps
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button type="button" onClick={handleLoadScript} style={headerBtnStyle}>
          Load Script
        </button>
        <div ref={exportBtnRef} style={{ position: "relative", marginLeft: 8 }}>
          <button type="button" onClick={() => setExportMenuOpen((o) => !o)} style={headerBtnStyle}>
            Export ▾
          </button>
          {exportMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: "#222",
                border: "1px solid #333",
                borderRadius: 6,
                padding: "4px 0",
                minWidth: 160,
                zIndex: 100,
              }}
            >
              <button type="button" onClick={handleExportJSON} style={dropdownItemStyle}>
                Download JSON
              </button>
              <button type="button" onClick={handleCopyJSON} style={dropdownItemStyle}>
                Copy JSON
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Engine preview container */}
        <div
          style={{
            flex: 1,
            background: "#1a1a1a",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              height: 32,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 8,
              fontSize: 12,
              color: "#888",
              borderBottom: "1px solid #333",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {walkthrough?.originalUrl ?? walkthrough?.url ?? "No URL"}
            </span>
            {walkthrough?.url && (
              <a
                href={walkthrough.originalUrl ?? walkthrough.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#888", textDecoration: "none", fontSize: 14 }}
                title="Open in browser"
              >
                &#8599;
              </a>
            )}
          </div>
          <div
            ref={containerRef}
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              background: "#000",
            }}
          />
        </div>

        {/* Step panel */}
        <StepPanel step={selectedStep} stepIndex={selectedStepIndex} onUpdate={handleStepUpdate} />
      </div>

      {/* Playback controls */}
      <PlaybackControls
        status={playbackStatus}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        onReset={handleReset}
        onLoop={setLoop}
        loop={loop}
      />

      {/* Timeline */}
      <Timeline
        steps={steps}
        selectedStepIndex={selectedStepIndex}
        currentStepIndex={currentStepIndex}
        playheadTime={playheadTime}
        totalDuration={totalDuration}
        onSelectStep={setSelectedStepIndex}
        onSeek={handleSeek}
        onUpdateDuration={handleUpdateDuration}
        onReorderStep={handleReorderStep}
      />
    </div>
  );
}

const headerBtnStyle: React.CSSProperties = {
  background: "#222",
  border: "1px solid #333",
  color: "#ccc",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
};

const dropdownItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "none",
  border: "none",
  color: "#ccc",
  padding: "8px 14px",
  fontSize: 13,
  textAlign: "left",
  cursor: "pointer",
};
