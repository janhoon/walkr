# 🚶 Walkr Core

**Code-first product demo tool**

`@walkr/core` is the TypeScript API for describing cursor-driven walkthroughs.

## Install

```bash
pnpm add @walkr/core
```

## Quick Start

```ts
import { walkr, moveTo, click, type, highlight, sequence } from "@walkr/core";

export default walkr({
  url: "https://example.com",
  title: "Sign up flow",
  steps: [
    moveTo(640, 400, { duration: 800 }),
    click(640, 400),
    type("hello@example.com", { selector: "input[name=email]" }),
    highlight(".submit-btn", { spotlight: true, color: "#22d3ee", duration: 1200 }),
    sequence(
      moveTo(800, 500),
      click(800, 500),
    ),
  ],
});
```

## Step API

| Function | Signature | Description | Duration behavior |
| --- | --- | --- | --- |
| `moveTo` | `moveTo(x, y, options?)` | Move cursor to screen coordinates. | `options.duration ?? 0` |
| `click` | `click(x, y, options?)` | Click at coordinates. Supports button/double-click. | `0` |
| `type` | `type(text, options?)` | Type text, optionally into a selector. | `text.length * (options.delay ?? 0)` |
| `scroll` | `scroll(x, y, options?)` | Scroll viewport to coordinates. | `0` |
| `wait` | `wait(ms)` | Pause timeline. | `ms` |
| `highlight` | `highlight(selector, options?)` | Highlight a target selector. | `options.duration ?? 0` |
| `zoom` | `zoom(level, options?)` | Zoom viewport/camera. | `360` |
| `pan` | `pan(x, y, options?)` | Pan viewport/camera. | `options.duration ?? 360` |
| `sequence` | `sequence(...steps)` | Run child steps one after another. | Sum of child durations |
| `parallel` | `parallel(...steps)` | Run child steps at same time. | Max child duration |

## Options By Step

### `moveTo(x, y, options?)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `duration` | `number` | `0` | Movement duration in ms. |
| `easing` | `string` | `undefined` | CSS easing string. |
| `follow` | `boolean` | `undefined` | Keep following moving target if supported by runtime. |
| `cursor` | `Partial<CursorConfig>` | `undefined` | Per-step cursor override. |

### `click(x, y, options?)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `button` | `"left" \| "right" \| "middle"` | `"left"` | Mouse button. |
| `double` | `boolean` | `false` | Double-click if `true`. |
| `cursor` | `Partial<CursorConfig>` | `undefined` | Per-step cursor override. |

### `type(text, options?)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `delay` | `number` | `undefined` | Per-character delay in ms. |
| `selector` | `string` | `undefined` | Target selector for runtime typing. |
| `cursor` | `Partial<CursorConfig>` | `undefined` | Per-step cursor override. |

### `scroll(x, y, options?)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `smooth` | `boolean` | `undefined` | Smooth scrolling hint for runtime. |
| `cursor` | `Partial<CursorConfig>` | `undefined` | Per-step cursor override. |

### `wait(ms)`

`wait` only accepts the required `ms: number` value.

### `highlight(selector, options?)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `color` | `string` | `undefined` | Highlight color. |
| `duration` | `number` | `undefined` | Highlight duration in ms. |
| `spotlight` | `boolean` | `undefined` | Enable spotlight effect. |
| `backdropOpacity` | `number` | `undefined` | Backdrop dim amount. |
| `borderRadius` | `number` | `undefined` | Radius of highlight frame. |
| `padding` | `number` | `undefined` | Padding around target. |
| `cursor` | `Partial<CursorConfig>` | `undefined` | Per-step cursor override. |

### `zoom(level, options?)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `x` | `number` | `undefined` | Zoom anchor X. |
| `y` | `number` | `undefined` | Zoom anchor Y. |
| `easing` | `string` | `"cubic-bezier(0.42, 0, 0.58, 1)"` | Transition easing. |
| `follow` | `boolean` | `undefined` | Follow target during zoom if runtime supports it. |
| `cursor` | `Partial<CursorConfig>` | `undefined` | Per-step cursor override. |

### `pan(x, y, options?)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `duration` | `number` | `360` | Pan duration in ms. |
| `easing` | `string` | `"cubic-bezier(0.42, 0, 0.58, 1)"` | Transition easing. |
| `cursor` | `Partial<CursorConfig>` | `undefined` | Per-step cursor override. |

### `sequence(...steps)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `steps` | `Step[]` | required | Child steps run in order. |

### `parallel(...steps)`

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `steps` | `Step[]` | required | Child steps run concurrently. |

## `CursorConfig`

```ts
interface CursorConfig {
  shape?: "circle" | "arrow" | "dot" | "svg";
  color?: string;
  size?: number;
  shadow?: boolean;
  clickColor?: string;
  svgContent?: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `shape` | `"circle" \| "arrow" \| "dot" \| "svg"` | Cursor style. |
| `color` | `string` | Base cursor color. |
| `size` | `number` | Cursor size in px. |
| `shadow` | `boolean` | Enables drop shadow. |
| `clickColor` | `string` | Click flash color. |
| `svgContent` | `string` | Raw SVG markup when `shape: "svg"`. |

## Walkthrough Options

`walkr(options)` accepts:

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | `string` | yes | Target URL to load. |
| `steps` | `Step[]` | yes | Timeline step list. |
| `title` | `string` | no | Human-readable demo title. |
| `description` | `string` | no | Optional demo description. |
| `zoom` | `ZoomDefaults` | no | Global zoom defaults. |
| `cursor` | `CursorConfig` | no | Global cursor config. |

`ZoomDefaults`:

| Field | Type | Description |
| --- | --- | --- |
| `defaultLevel` | `number` | Default zoom level. |
| `easing` | `string` | Default zoom easing. |
