import { useEffect, useRef } from "react";

import { WalkrEngine } from "../../../engine/src/engine";
import type { Walkthrough } from "../../../core/src/types";
import type { PlaybackMode } from "../types";

interface PreviewPaneProps {
  walkthrough: Walkthrough | null;
  mode: PlaybackMode;
}

export const PreviewPane = ({ walkthrough, mode }: PreviewPaneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<WalkrEngine | null>(null);
  const playbackState = useRef<"idle" | "playing" | "paused">("idle");

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const engine = new WalkrEngine();
    engine.mount(containerRef.current);
    engineRef.current = engine;

    return () => {
      engine.unmount();
      engineRef.current = null;
      playbackState.current = "idle";
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !walkthrough) {
      return;
    }

    if (mode === "playing") {
      if (playbackState.current === "paused") {
        engine.resume();
        playbackState.current = "playing";
        return;
      }

      if (playbackState.current === "idle") {
        playbackState.current = "playing";
        void engine.play(walkthrough).finally(() => {
          playbackState.current = "idle";
        });
      }
      return;
    }

    if (mode === "paused") {
      if (playbackState.current === "playing") {
        engine.pause();
        playbackState.current = "paused";
      }
      return;
    }

    if (mode === "stopped" && playbackState.current !== "idle") {
      playbackState.current = "idle";
      engine.unmount();
      if (containerRef.current) {
        engine.mount(containerRef.current);
      }
    }
  }, [mode, walkthrough]);

  return (
    <section
      style={{
        position: "relative",
        border: "1px solid #223146",
        borderRadius: 14,
        overflow: "hidden",
        background: "#0f172a",
        minHeight: 360,
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />
      {!walkthrough ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
            fontSize: 14,
            pointerEvents: "none",
          }}
        >
          No walkthrough loaded
        </div>
      ) : null}
    </section>
  );
};
