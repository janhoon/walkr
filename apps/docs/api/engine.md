# Engine API

`@walkrstudio/engine` provides `WalkrEngine` — the browser playback engine that loads a walkthrough URL in an iframe, renders a cursor overlay, and executes steps with `requestAnimationFrame`-driven animations.

## Quick Start

```ts
import { WalkrEngine } from "@walkrstudio/engine";

const engine = new WalkrEngine({ cursor: { shape: "circle", color: "#22d3ee" } });
engine.mount(document.getElementById("walkr")!);

engine.on("step", (_event, state) => {
  console.log(`Step ${state.currentStep}/${state.totalSteps}`);
});

await engine.play(myWalkthrough);
```

## `new WalkrEngine(options?)`

Create a new engine instance.

### `EngineOptions`

| Field | Type | Default | Description |
|---|---|---|---|
| `cursor` | `CursorConfig` | — | Default cursor appearance (shape, colour, size, shadow). |
| `container` | `HTMLElement` | — | Mount target. Can also be set later via `mount()`. |
| `viewport` | `Viewport` | — | Fixed design viewport `{ width, height }`. |
| `debug` | `boolean` | `false` | Enable verbose step execution logging. |

If `container` is passed in the constructor the engine mounts immediately.

---

## Methods

### `mount(container)`

Attach the engine to a DOM element. Creates an iframe, stage layer, cursor overlay, and (when a viewport is configured) a scaler element inside the container.

```ts
engine.mount(document.getElementById("walkr")!);
```

Safe to call multiple times with the same container — subsequent calls are no-ops.

### `unmount()`

Remove all engine DOM elements, disconnect observers, and reset playback state. The engine can be re-mounted afterwards.

```ts
engine.unmount();
```

### `play(walkthrough)`

Load the walkthrough URL in the iframe and execute all steps in sequence. Returns a promise that resolves when playback completes.

```ts
await engine.play(myWalkthrough);
```

The walkthrough's `viewport` and `cursor` settings take precedence over engine-level options for that run. Throws if the engine has not been mounted.

### `pause()`

Pause playback between steps. The engine stops advancing until `resume()` is called. Emits the `pause` event.

```ts
engine.pause();
```

### `resume()`

Resume playback after a pause. Emits the `resume` event.

```ts
engine.resume();
```

### `getState()`

Returns a snapshot of the current playback state.

```ts
const state = engine.getState();
// { playing: true, currentStep: 3, totalSteps: 10, progress: 0.3 }
```

#### `EngineState`

| Field | Type | Description |
|---|---|---|
| `playing` | `boolean` | Whether playback is currently active. |
| `currentStep` | `number` | Index of the last completed step. |
| `totalSteps` | `number` | Total number of steps in the walkthrough. |
| `progress` | `number` | Progress from `0` to `1`. |

### `setCursorConfig(config)`

Update cursor appearance at any time during or between playback.

```ts
engine.setCursorConfig({ color: "#ef4444", size: 32 });
```

### `getViewportState()`

Returns the current viewport zoom level and pan offset.

```ts
const vp = engine.getViewportState();
// { zoom: 1.5, panX: 200, panY: 100 }
```

#### `ViewportState`

| Field | Type | Description |
|---|---|---|
| `zoom` | `number` | Current zoom level. |
| `panX` | `number` | Horizontal pan offset. |
| `panY` | `number` | Vertical pan offset. |

### `resetViewport(options?)`

Animate the viewport back to zoom level 1 and the default pan origin.

```ts
await engine.resetViewport({ duration: 500, easing: "ease-out" });
```

| Option | Type | Description |
|---|---|---|
| `duration` | `number` | Animation duration in ms. |
| `easing` | `string` | CSS easing function. |

---

## Events

Subscribe with `on(event, handler)` and unsubscribe with `off(event, handler)`.

```ts
engine.on("step", (event, state, detail?) => {
  console.log(`${event}: step ${state.currentStep}/${state.totalSteps}`);
});
```

### `PlaybackEvent`

| Event | Description |
|---|---|
| `"start"` | Playback has begun. |
| `"step"` | A step has completed. |
| `"complete"` | All steps have finished. |
| `"pause"` | Playback was paused. |
| `"resume"` | Playback was resumed. |
| `"step_error"` | A step failed (e.g. selector not found). |

### `EventHandler`

```ts
type EventHandler = (
  event: PlaybackEvent,
  state: EngineState,
  detail?: StepErrorDetail,
) => void;
```

The `detail` argument is only present for `step_error` events.

### `StepErrorDetail`

| Field | Type | Description |
|---|---|---|
| `error` | `StepError` | The error object. |
| `stepIndex` | `number` | Index of the failed step. |
| `stepResult` | `StepResult` | Result metadata including `status`, `stepType`, `selector`, and `durationMs`. |

---

## `StepError`

A custom error class thrown when a step fails at runtime.

```ts
import { StepError } from "@walkrstudio/engine";

engine.on("step_error", (_event, _state, detail) => {
  const err = detail!.error;
  console.error(err.stepType, err.selector, err.reason);
});
```

### Properties

| Field | Type | Description |
|---|---|---|
| `stepType` | `StepType` | The type of step that failed (e.g. `"click"`, `"waitForSelector"`). |
| `selector` | `string \| undefined` | The CSS selector involved, if any. |
| `reason` | `StepErrorReason` | `"not-found"`, `"timeout"`, or `"no-document"`. |

### `StepErrorReason`

| Value | Description |
|---|---|
| `"not-found"` | The selector did not match any element. |
| `"timeout"` | The wait/navigation timed out. |
| `"no-document"` | The iframe document was not accessible. |

---

## Low-Level Exports

The engine package also re-exports several lower-level utilities. These are considered internal but available for advanced use:

- `executeStep(step, cursor, iframe, context)` — Run a single step.
- `initializeViewport(stage)` / `getViewportState(stage)` / `resetViewport(stage, options?)` — Viewport transform helpers.
- `createCursor(config)` / `showCursor(el)` / `hideCursor(el)` / `moveCursorTo(el, x, y)` / `updateCursorConfig(el, config)` — Cursor DOM helpers.
- `showClickRipple(el)` / `showScrollIndicator(el)` / `hideScrollIndicator(el)` — Visual feedback helpers.
- `cubicBezier(...)` / `easeInOut` / `easeOut` / `linear` — Easing functions.
