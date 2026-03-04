# @walkrstudio/engine

Browser playback engine for Walkr walkthroughs.

`@walkrstudio/engine` takes a `Walkthrough` object from `@walkrstudio/core` and runs it inside a browser. It renders an iframe with a cursor overlay, executes each timeline step with `requestAnimationFrame` animations, and emits playback events.

> **Single entry point:** `WalkrEngine` is the only supported class for
> programmatic walkthrough playback. The previously experimental `WalkrPlayer`
> has been removed. If you were importing `WalkrPlayer`, switch to
> `WalkrEngine` — a temporary re-export alias is available but will be removed
> in the next major version.

## Install

```bash
npm install @walkrstudio/engine
```

`@walkrstudio/core` is a peer dependency and must be installed alongside the engine.

## Usage

```ts
import { WalkrEngine } from "@walkrstudio/engine";
import demoWalkthrough from "./demo.js";

const container = document.getElementById("walkr-container");
const engine = new WalkrEngine({
  cursor: { shape: "circle", color: "#22d3ee", size: 18, shadow: true },
});

engine.mount(container);

engine.on("step", (_event, state) => {
  console.log(`Step ${state.currentStep}/${state.totalSteps}`);
});

engine.on("complete", () => {
  console.log("Done");
});

await engine.play(demoWalkthrough);
```

## API

### `new WalkrEngine(options?)`

| Option | Type | Description |
| --- | --- | --- |
| `cursor` | `CursorConfig` | Default cursor style (shape, color, size, shadow, etc.). |
| `container` | `HTMLElement` | Mount target. Can also be set later via `mount()`. |
| `viewport` | `Viewport` | Fixed viewport dimensions (`{ width, height }`). |

### Methods

| Method | Description |
| --- | --- |
| `mount(container)` | Attach the engine to a DOM element. Creates the iframe, stage, and cursor overlay. |
| `unmount()` | Remove all DOM elements and reset state. |
| `play(walkthrough)` | Load the walkthrough URL and execute all steps. Returns a promise that resolves on completion. |
| `pause()` | Pause playback between steps. |
| `resume()` | Resume paused playback. |
| `getState()` | Returns the current `EngineState`. |
| `setCursorConfig(config)` | Update cursor appearance at any time. |
| `getViewportState()` | Returns the current zoom level and pan offset. |
| `resetViewport(options?)` | Animate back to zoom 1 and pan origin. |

### Events

Subscribe with `engine.on(event, handler)` and unsubscribe with `engine.off(event, handler)`.

| Event | Fired when |
| --- | --- |
| `start` | Playback begins. |
| `step` | A step finishes executing. |
| `complete` | All steps have finished. |
| `pause` | Playback is paused. |
| `resume` | Playback resumes from pause. |

The handler receives `(event: PlaybackEvent, state: EngineState)`:

```ts
interface EngineState {
  playing: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number; // 0–1
}
```

## Step execution

The engine handles every step type from `@walkrstudio/core`:

- **moveTo / moveToCoords** — Animates cursor position with configurable easing.
- **click / clickCoords** — Dispatches `MouseEvent` into the iframe and shows a click ripple.
- **type** — Dispatches `KeyboardEvent` per character with optional delay.
- **scroll** — Scrolls the iframe viewport.
- **wait** — Pauses the timeline.
- **highlight** — Renders a backdrop overlay with spotlight around the target element.
- **zoom** — Applies CSS `scale()` transform to the stage.
- **pan** — Applies CSS `translate()` transform to the stage.
- **hover** — Moves cursor to the element, dispatches hover-start events, holds, then dispatches hover-end events for cleanup.
- **drag** — Animates a click-drag between two endpoints with pointer/mouse events.
- **clearCache** — Clears browser state for a clean starting point.
- **sequence / parallel** — Nested step composition.

## Viewport scaling

When a `viewport` is set (either via engine options or on the walkthrough), the engine creates a scaler element that letter-boxes the content to fit the container while preserving the design resolution. This keeps cursor coordinates pixel-accurate regardless of the actual container size.
