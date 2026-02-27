import { useCallback, useEffect, useRef } from "react";

import { WalkrEngine } from "../../../engine/src/engine";
import type { Walkthrough } from "../../../core/src/types";
import type { PlaybackMode } from "../types";

interface PreviewPaneProps {
  walkthrough: Walkthrough | null;
  mode: PlaybackMode;
  onScriptChange?: (callback: (walkthrough: Walkthrough) => void) => void | (() => void);
}

export const PreviewPane = ({ walkthrough, mode, onScriptChange }: PreviewPaneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<WalkrEngine | null>(null);
  const playbackState = useRef<"idle" | "playing" | "paused">("idle");
  const activeWalkthroughRef = useRef<Walkthrough | null>(null);

  const remountEngine = useCallback((): WalkrEngine | null => {
    const container = containerRef.current;
    if (!container) {
      return null;
    }

    engineRef.current?.unmount();

    const engine = new WalkrEngine();
    engine.mount(container);
    engineRef.current = engine;
    playbackState.current = "idle";
    activeWalkthroughRef.current = null;
    return engine;
  }, []);

  useEffect(() => {
    remountEngine();

    return () => {
      engineRef.current?.unmount();
      engineRef.current = null;
      playbackState.current = "idle";
      activeWalkthroughRef.current = null;
    };
  }, [remountEngine]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !walkthrough) {
      return;
    }

    if (mode === "playing") {
      if (playbackState.current === "paused" && activeWalkthroughRef.current === walkthrough) {
        engine.resume();
        playbackState.current = "playing";
        return;
      }

      if (playbackState.current === "paused" && activeWalkthroughRef.current !== walkthrough) {
        const nextEngine = remountEngine();
        if (!nextEngine) {
          return;
        }

        playbackState.current = "playing";
        activeWalkthroughRef.current = walkthrough;
        void nextEngine.play(walkthrough).finally(() => {
          playbackState.current = "idle";
          activeWalkthroughRef.current = null;
        });
        return;
      }

      if (playbackState.current === "playing" && activeWalkthroughRef.current !== walkthrough) {
        const nextEngine = remountEngine();
        if (!nextEngine) {
          return;
        }

        playbackState.current = "playing";
        activeWalkthroughRef.current = walkthrough;
        void nextEngine.play(walkthrough).finally(() => {
          playbackState.current = "idle";
          activeWalkthroughRef.current = null;
        });
        return;
      }

      if (playbackState.current === "idle") {
        playbackState.current = "playing";
        activeWalkthroughRef.current = walkthrough;
        void engine.play(walkthrough).finally(() => {
          playbackState.current = "idle";
          activeWalkthroughRef.current = null;
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
      remountEngine();
    }
  }, [mode, remountEngine, walkthrough]);

  useEffect(() => {
    if (!onScriptChange) {
      return;
    }

    return onScriptChange((nextWalkthrough) => {
      const engine = remountEngine();
      if (!engine) {
        return;
      }

      playbackState.current = "playing";
      activeWalkthroughRef.current = nextWalkthrough;
      void engine.play(nextWalkthrough).finally(() => {
        playbackState.current = "idle";
        activeWalkthroughRef.current = null;
      });
    });
  }, [onScriptChange, remountEngine]);

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
