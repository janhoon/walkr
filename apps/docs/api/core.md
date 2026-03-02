# Core API

`@walkrstudio/core` provides the step builders, composers, and the `walkr()` factory that together define a walkthrough.

## `walkr(options)`

Creates a `Walkthrough` object — the top-level unit that the engine and CLI consume.

```ts
import { walkr, moveTo, click } from "@walkrstudio/core";

export default walkr({
  url: "https://example.com",
  steps: [moveTo("#btn", { duration: 500 }), click("#btn")],
  title: "Example",
  description: "A short walkthrough.",
  viewport: { width: 1920, height: 1080 },
  cursor: { shape: "circle", color: "#22d3ee", size: 24 },
  zoom: { defaultLevel: 1, easing: "cubic-bezier(0.42, 0, 0.58, 1)" },
});
```

### `WalkthroughOptions`

| Field | Type | Description |
|---|---|---|
| `url` | `string` | **(required)** The target page URL. |
| `steps` | `Step[]` | **(required)** Array of steps to execute. |
| `title` | `string` | Optional walkthrough title. |
| `description` | `string` | Optional description. |
| `viewport` | `Viewport` | Design viewport `{ width, height }`. |
| `cursor` | `CursorConfig` | Default cursor appearance. |
| `zoom` | `ZoomDefaults` | Default zoom level and easing. |

### `CursorConfig`

| Field | Type | Default | Description |
|---|---|---|---|
| `shape` | `"circle" \| "arrow" \| "dot" \| "svg"` | — | Cursor shape. |
| `color` | `string` | — | Cursor colour. |
| `size` | `number` | — | Cursor size in pixels. |
| `shadow` | `boolean` | — | Show drop shadow. |
| `clickColor` | `string` | — | Colour of the click ripple. |
| `svgContent` | `string` | — | Raw SVG string (when `shape` is `"svg"`). |
| `offset` | `{ x: number; y: number }` | `{ x: 0.5, y: 0.5 }` | Hotspot offset as a fraction of cursor size. |

---

## Step Builders

Every step builder returns a `Step` object with `id`, `type`, `options`, and `duration`.

### `moveTo(selector, options?)`

Move the virtual cursor to a DOM element.

```ts
moveTo("#my-button", { duration: 600, easing: "ease-in-out" });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | `0` | Animation duration in ms. |
| `easing` | `string` | — | CSS easing function. |
| `follow` | `boolean` | — | Keep cursor attached to the element. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `moveToCoords(x, y, options?)`

Move the cursor to absolute coordinates.

```ts
moveToCoords(960, 540, { duration: 400 });
```

Accepts the same options as `moveTo`.

### `click(selector, options?)`

Click a DOM element.

```ts
click("#submit-btn");
click("#item", { button: "right", double: true });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `button` | `"left" \| "right" \| "middle"` | `"left"` | Mouse button. |
| `double` | `boolean` | `false` | Double-click. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `clickCoords(x, y, options?)`

Click at absolute coordinates.

```ts
clickCoords(100, 200, { button: "left" });
```

Accepts the same options as `click`.

### `type(text, options?)`

Type text character by character.

```ts
type("hello@example.com", { selector: "#email", delay: 40 });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `delay` | `number` | `0` | Delay between keystrokes in ms. |
| `selector` | `string` | — | Target input element. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

The step duration is computed as `text.length * delay`.

### `scroll(x, y, options?)`

Scroll the page by `(x, y)` pixels.

```ts
scroll(0, 300, { smooth: true });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `smooth` | `boolean` | — | Use smooth scrolling. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `wait(ms)`

Pause playback for the given number of milliseconds.

```ts
wait(1000); // wait one second
```

### `waitForSelector(selector, options?)`

Wait until a DOM element matching `selector` exists (and optionally is visible).

```ts
waitForSelector(".modal", { timeout: 3000, visible: true });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `timeout` | `number` | `5000` | Maximum wait time in ms. |
| `visible` | `boolean` | — | Also require the element to be visible. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `waitForNavigation(options?)`

Wait for a page navigation to complete.

```ts
waitForNavigation({ waitUntil: "networkidle", timeout: 8000 });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `timeout` | `number` | `5000` | Maximum wait time in ms. |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle"` | `"load"` | When to consider navigation complete. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `highlight(selector, options?)`

Highlight a DOM element with an optional spotlight overlay.

```ts
highlight("#feature-card", {
  spotlight: true,
  color: "#3b82f6",
  duration: 2000,
  backdropOpacity: 0.3,
  padding: 8,
  borderRadius: 6,
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `color` | `string` | — | Highlight border / glow colour. |
| `duration` | `number` | `0` | How long the highlight stays visible (ms). |
| `spotlight` | `boolean` | — | Dim the rest of the page behind the element. |
| `backdropOpacity` | `number` | — | Opacity of the spotlight backdrop (0–1). |
| `borderRadius` | `number` | — | Border radius of the highlight box (px). |
| `padding` | `number` | — | Extra padding around the element (px). |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `tooltip(selector, text, options?)`

Show a tooltip anchored to a DOM element.

```ts
tooltip("#help-icon", "Click here to get started", {
  position: "bottom",
  duration: 3000,
  title: "Tip",
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | `3000` | How long the tooltip is shown (ms). |
| `position` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Tooltip placement relative to the element. |
| `title` | `string` | — | Bold title line above the text. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `narrate(src, options?)`

Play an audio file during the walkthrough.

```ts
narrate("/audio/intro.mp3", { duration: 5000, volume: 0.8 });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | — | Duration in ms. If omitted, derived from audio length at runtime. |
| `volume` | `number` | `1` | Volume level from 0 to 1. |
| `loop` | `boolean` | `false` | Whether to loop the audio. |

### `zoom(level, options?)`

Zoom the viewport to a given level.

```ts
zoom(2, { x: 500, y: 300, easing: "ease-out" });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `x` | `number` | — | Zoom origin X coordinate. |
| `y` | `number` | — | Zoom origin Y coordinate. |
| `easing` | `string` | `"cubic-bezier(0.42, 0, 0.58, 1)"` | CSS easing function. |
| `follow` | `boolean` | — | Keep zoom centred on cursor. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

Default animation duration is 360 ms.

### `pan(x, y, options?)`

Pan (translate) the viewport to a position.

```ts
pan(200, 100, { duration: 500, easing: "ease-in-out" });
```

| Option | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | `360` | Animation duration in ms. |
| `easing` | `string` | `"cubic-bezier(0.42, 0, 0.58, 1)"` | CSS easing function. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### `clearCache()`

Clear the browser cache inside the iframe. Useful at the start of a walkthrough to ensure a clean state.

```ts
clearCache();
```

No options. Default duration is 50 ms.

---

## Composers

Composers combine multiple steps into a single logical unit.

### `sequence(...steps)`

Run steps one after another. The total duration is the sum of all child durations.

```ts
import { sequence, moveTo, click, wait } from "@walkrstudio/core";

sequence(
  moveTo("#btn", { duration: 400 }),
  click("#btn"),
  wait(300),
);
```

### `parallel(...steps)`

Run steps simultaneously. The total duration is the maximum of all child durations.

```ts
import { parallel, moveTo, narrate } from "@walkrstudio/core";

parallel(
  moveTo("#hero", { duration: 1000 }),
  narrate("/audio/intro.mp3", { duration: 1000 }),
);
```
