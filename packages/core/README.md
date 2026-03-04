# @walkrstudio/core

TypeScript API for scripting cursor-driven product walkthroughs.

`@walkrstudio/core` is a zero-dependency library that lets you describe a walkthrough as a sequence of steps: cursor movements, clicks, typing, highlights, scrolls, and camera controls. The output is a plain `Walkthrough` object consumed by the engine, CLI, or recorder packages.

## Install

```bash
npm install @walkrstudio/core
```

## Quick start

Create a file called `demo.ts`:

```ts
import {
  walkr,
  moveTo,
  click,
  type,
  highlight,
  wait,
  sequence,
} from "@walkrstudio/core";

export default walkr({
  url: "https://your-app.com",
  title: "Sign up flow",
  steps: [
    moveTo("#email-input", { duration: 600 }),
    click("#email-input"),
    type("hello@example.com", { selector: "#email-input", delay: 35 }),

    moveTo(".submit-btn", { duration: 400 }),
    highlight(".submit-btn", { spotlight: true, color: "#22d3ee", duration: 1200 }),
    click(".submit-btn"),

    wait(500),
  ],
});
```

Preview it with the CLI:

```bash
npx walkr dev demo.ts
```

## Step names

Every step accepts an optional `name` in its options. Names appear in the Studio timeline, engine lifecycle events, and error messages — making walkthroughs easier to read and debug.

```ts
moveTo('#settings', { name: 'Open settings menu' })
click('#save-btn', { name: 'Save changes' })
wait(1000, { name: 'Wait for animation' })
```

Step names also help AI agents debug: when a user reports an issue with "the Save changes step", an AI can target that step directly by name rather than guessing from step indices.

## Step reference

### Cursor movement

| Function | Signature | Description |
| --- | --- | --- |
| `moveTo` | `moveTo(selector, options?)` | Move cursor to the center of a DOM element. |
| `moveToCoords` | `moveToCoords(x, y, options?)` | Move cursor to absolute screen coordinates. |

**Options** (`MoveToOptions`):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Human-readable step label. |
| `duration` | `number` | `0` | Animation duration in ms. |
| `easing` | `string` | — | CSS easing string (e.g. `"ease-in-out"`). |
| `follow` | `boolean` | — | Keep following a moving target when supported by the runtime. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### Click

| Function | Signature | Description |
| --- | --- | --- |
| `click` | `click(selector, options?)` | Click on a DOM element. |
| `clickCoords` | `clickCoords(x, y, options?)` | Click at absolute screen coordinates. |

**Options** (`ClickOptions`):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Human-readable step label. |
| `button` | `"left" \| "right" \| "middle"` | `"left"` | Mouse button. |
| `double` | `boolean` | `false` | Double-click. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### Hover

```ts
hover(".dropdown-trigger", { duration: 1500 })
hover("#tooltip-target")
```

| Function | Signature | Description |
| --- | --- | --- |
| `hover` | `hover(selector, options?)` | Hover over a DOM element with automatic cleanup. |

**Options** (`HoverOptions`):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `0` | How long to hold the hover state (ms). |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

Moves cursor to the element, dispatches `mouseover` + `mouseenter`, holds for the duration, then dispatches `mouseleave` + `mouseout`. The element returns to its default (non-hovered) appearance after the step completes.

### Drag

```ts
drag({ selector: "#item" }, { selector: "#dropzone" })
drag({ x: 100, y: 200 }, { x: 500, y: 300 })
```

| Function | Signature | Description |
| --- | --- | --- |
| `drag` | `drag(from, to, options?)` | Click-drag from one location to another. |

Each endpoint is either `{ selector: string }` (resolved to element center) or `{ x: number; y: number }` (absolute coordinates).

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

Default duration: 1000 ms. Dispatches pointer and mouse events (not HTML5 Drag and Drop).

### Type

```ts
type("hello@example.com", { selector: "#email-input", delay: 35 })
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `delay` | `number` | — | Per-character delay in ms. |
| `selector` | `string` | — | Target element to focus before typing. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

Duration is calculated as `text.length * (delay ?? 0)`.

### Scroll

```ts
scroll(0, 700, { smooth: true })
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `smooth` | `boolean` | — | Smooth scrolling hint for the runtime. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### Wait

```ts
wait(500) // pause for 500ms
```

No options — accepts a single `ms` value.

### Highlight

```ts
highlight(".submit-btn", {
  spotlight: true,
  color: "#22d3ee",
  duration: 1200,
  backdropOpacity: 0.35,
})
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | — | Highlight border/glow color. |
| `duration` | `number` | — | How long the highlight stays visible (ms). |
| `spotlight` | `boolean` | — | Dim the rest of the page behind the target. |
| `backdropOpacity` | `number` | — | Dim amount (0–1). |
| `borderRadius` | `number` | — | Highlight frame radius in px. |
| `padding` | `number` | — | Extra padding around the target in px. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### Zoom

```ts
zoom(1.5, { x: 960, y: 540 })
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `x` | `number` | — | Zoom anchor X coordinate. |
| `y` | `number` | — | Zoom anchor Y coordinate. |
| `easing` | `string` | `"cubic-bezier(0.42, 0, 0.58, 1)"` | Transition easing. |
| `follow` | `boolean` | — | Follow target during zoom. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

Default duration: 360 ms.

### Pan

```ts
pan(960, 460, { duration: 500 })
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `360` | Pan duration in ms. |
| `easing` | `string` | `"cubic-bezier(0.42, 0, 0.58, 1)"` | Transition easing. |
| `cursor` | `Partial<CursorConfig>` | — | Per-step cursor override. |

### Clear cache

```ts
clearCache()
```

Clears browser state (cookies, cache) so the walkthrough starts from a clean slate. No options.

### Composition

| Function | Signature | Description |
| --- | --- | --- |
| `sequence` | `sequence(...steps)` | Run steps one after another. Duration = sum of children. |
| `parallel` | `parallel(...steps)` | Run steps at the same time. Duration = max of children. |

```ts
parallel(
  highlight(".btn", { spotlight: true, color: "#22d3ee", duration: 1200 }),
  sequence(
    wait(200),
    moveTo(".btn", { duration: 500 }),
  ),
)
```

## Walkthrough options

`walkr(options)` accepts:

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | `string` | yes | Target URL to load in the iframe/browser. |
| `steps` | `Step[]` | yes | Timeline steps. |
| `title` | `string` | no | Human-readable demo title. |
| `description` | `string` | no | Description of the walkthrough. |
| `viewport` | `Viewport` | no | Fixed viewport size (`{ width, height }`). |
| `cursor` | `CursorConfig` | no | Global cursor config. |
| `zoom` | `ZoomDefaults` | no | Default zoom level and easing. |

## Cursor config

```ts
interface CursorConfig {
  shape?: "circle" | "arrow" | "dot" | "svg";
  color?: string;
  size?: number;
  shadow?: boolean;
  clickColor?: string;
  svgContent?: string;
  offset?: { x: number; y: number };
}
```

| Field | Type | Description |
| --- | --- | --- |
| `shape` | `"circle" \| "arrow" \| "dot" \| "svg"` | Cursor style. |
| `color` | `string` | Base cursor color. |
| `size` | `number` | Cursor diameter in px. |
| `shadow` | `boolean` | Enable drop shadow. |
| `clickColor` | `string` | Flash color on click. |
| `svgContent` | `string` | Raw SVG markup when `shape` is `"svg"`. |
| `offset` | `{ x: number; y: number }` | Hotspot offset as a fraction of cursor size (0–1). Default: `{ x: 0.5, y: 0.5 }`. |

## Zoom defaults

```ts
interface ZoomDefaults {
  defaultLevel?: number;
  easing?: string;
}
```
