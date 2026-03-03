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
| `shape` | `"circle" \| "arrow" \| "dot" \| "svg" \| "cursor-01" \| "cursor-02" \| "cursor-03"` | — | Cursor shape. Use a `cursor-*` preset for a ready-made pointer. |
| `color` | `string` | — | Cursor colour. |
| `size` | `number` | — | Cursor size in pixels. |
| `shadow` | `boolean` | — | Show drop shadow. |
| `clickColor` | `string` | — | Colour of the click ripple. |
| `svgContent` | `string` | — | Raw SVG string (when `shape` is `"svg"`). |
| `offset` | `{ x: number; y: number }` | `{ x: 0.5, y: 0.5 }` | Hotspot offset as a fraction of cursor size. |

#### Cursor Presets

Built-in cursor presets you can use by setting `shape` to the preset name. The `color` option controls the cursor colour.

<div style="display:flex;gap:2rem;align-items:flex-start;margin:1.5rem 0">
  <div style="text-align:center">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div><code>cursor-01</code></div>
  </div>
  <div style="text-align:center">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M16.5744 19.1999L12.6361 15.2616L11.4334 16.4643C10.2022 17.6955 9.58656 18.3111 8.92489 18.1658C8.26322 18.0204 7.96225 17.2035 7.3603 15.5696L5.3527 10.1205C4.15187 6.86106 3.55146 5.23136 4.39141 4.39141C5.23136 3.55146 6.86106 4.15187 10.1205 5.35271L15.5696 7.3603C17.2035 7.96225 18.0204 8.26322 18.1658 8.92489C18.3111 9.58656 17.6955 10.2022 16.4643 11.4334L15.2616 12.6361L19.1999 16.5744C19.6077 16.9821 19.8116 17.186 19.9058 17.4135C20.0314 17.7168 20.0314 18.0575 19.9058 18.3608C19.8116 18.5882 19.6077 18.7921 19.1999 19.1999C18.7921 19.6077 18.5882 19.8116 18.3608 19.9058C18.0575 20.0314 17.7168 20.0314 17.4135 19.9058C17.186 19.8116 16.9821 19.6077 16.5744 19.1999Z" fill="currentColor"/></svg>
    <div><code>cursor-02</code></div>
  </div>
  <div style="text-align:center">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M16.5744 19.1999L12.6361 15.2616L11.4334 16.4643C10.2022 17.6955 9.58656 18.3111 8.92489 18.1658C8.26322 18.0204 7.96225 17.2035 7.3603 15.5696L5.3527 10.1205C4.15187 6.86106 3.55146 5.23136 4.39141 4.39141C5.23136 3.55146 6.86106 4.15187 10.1205 5.35271L15.5696 7.3603C17.2035 7.96225 18.0204 8.26322 18.1658 8.92489C18.3111 9.58656 17.6955 10.2022 16.4643 11.4334L15.2616 12.6361L19.1999 16.5744C19.6077 16.9821 19.8116 17.186 19.9058 17.4135C20.0314 17.7168 20.0314 18.0575 19.9058 18.3608C19.8116 18.5882 19.6077 18.7921 19.1999 19.1999C18.7921 19.6077 18.5882 19.8116 18.3608 19.9058C18.0575 20.0314 17.7168 20.0314 17.4135 19.9058C17.186 19.8116 16.9821 19.6077 16.5744 19.1999Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div><code>cursor-03</code></div>
  </div>
</div>

```ts
// Example: use cursor-02 preset with a custom colour
walkr({
  url: "https://example.com",
  cursor: { shape: "cursor-02", color: "#10b981", size: 28 },
  steps: [/* ... */],
});
```

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

### `drag(from, to, options?)`

Simulate a click-drag from one location to another. Each endpoint can be a CSS selector (resolves to the element's center) or absolute coordinates.

```ts
drag({ selector: "#item" }, { selector: "#dropzone" });
drag({ x: 100, y: 200 }, { x: 500, y: 300 });
drag({ selector: "#slider-thumb" }, { x: 800, y: 200 });
```

**Endpoint types:**

| Shape | Type | Resolves to |
|---|---|---|
| Selector | `{ selector: string }` | Center of the matching DOM element. |
| Coordinates | `{ x: number; y: number }` | Absolute viewport position. |

| Option | Type | Default | Description |
|---|---|---|---|
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

Default duration is 1000 ms (15% move to source, 5% press, 70% drag, 10% release). Dispatches standard pointer and mouse events (`pointerdown`, `mousemove`, `pointerup`, etc.), not the HTML5 Drag and Drop API.

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
