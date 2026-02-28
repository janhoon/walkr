# @walkr/studio

Visual timeline editor and live preview for Walkr walkthroughs.

Studio is the React-based frontend launched by `walkr dev`. It provides an interactive environment where you can preview your walkthrough, scrub through the timeline, adjust step durations, and reorder steps — all with live reload when you edit the source script.

## Features

- **Live preview** — Renders the walkthrough inside an iframe using `@walkrstudio/engine`.
- **Timeline visualization** — Horizontal step blocks colored by step type with a draggable playhead.
- **Playback controls** — Play, pause, step forward/back, reset, and loop.
- **Step editing** — Click a step to edit its options (coordinates, selectors, durations, easing, colors).
- **Resize handles** — Drag step edges to adjust duration visually.
- **Drag-to-reorder** — Rearrange steps by dragging them on the timeline.
- **Hot reload** — Script changes are picked up automatically via Vite HMR.

## Usage

Studio is not installed directly. It is started through the CLI:

```bash
npx walkr dev demo.ts
```

This serves the Studio UI on `http://localhost:5174` and opens it in your browser. Your walkthrough script is loaded as JSON and fed into the engine for live playback.

## Tech stack

- React 18
- Vite 6
- `@walkrstudio/core` + `@walkrstudio/engine`

This package is private and not published to npm.
