import type { StepType, Walkthrough } from "../../core/src/types";

export const COLOR_MAP: Record<StepType, string> = {
  moveTo: "#3b82f6",
  click: "#ef4444",
  type: "#22c55e",
  scroll: "#a855f7",
  wait: "#6b7280",
  highlight: "#eab308",
  zoom: "#14b8a6",
  pan: "#6366f1",
  sequence: "#64748b",
  parallel: "#f97316",
};

export const DEFAULT_DEMO_WALKTHROUGH: Walkthrough = {
  url: "https://example.com",
  title: "Walkr Studio Demo",
  description: "Sample walkthrough for timeline editing",
  steps: [
    {
      id: "move-to-login",
      type: "moveTo",
      duration: 700,
      options: { x: 220, y: 160, easing: "easeInOut" },
    },
    {
      id: "highlight-login",
      type: "highlight",
      duration: 900,
      options: { selector: "#login", color: "#f59e0b" },
    },
    {
      id: "type-email",
      type: "type",
      duration: 1200,
      options: { selector: "#email", text: "hello@walkr.dev", delay: 35 },
    },
    {
      id: "click-submit",
      type: "click",
      duration: 500,
      options: { x: 260, y: 315, button: "left" },
    },
    {
      id: "wait-confirmation",
      type: "wait",
      duration: 800,
      options: { ms: 800 },
    },
  ],
};
