# @walkr/cli

CLI for running Walkr demos in Studio and exporting media.

## Install

```bash
npm install -g @walkr/cli
```

Or run without global install:

```bash
npx walkr
```

## Commands

### `walkr dev <script>`

Opens Walkr Studio with live reload.

```bash
walkr dev demo.ts
```

### `walkr export <script> [options]`

Exports a walkthrough to `mp4`, `gif`, `webm`, or `embed`.

```bash
walkr export demo.ts --format mp4 --output demo.mp4
```

### `walkr --help`

Shows command help and examples.

## `walkr export` options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--format` | `mp4 \| gif \| webm \| embed` | `mp4` | Output format. |
| `--output` | `string` | `output.<ext>` | Output path. For `embed`, extension is `.html`. |
| `--width` | `number` | `1920` | Render width in px. |
| `--height` | `number` | `1080` | Render height in px. |

## Example `demo.ts`

```ts
import {
  walkr,
  moveTo,
  click,
  type,
  highlight,
  scroll,
  wait,
  sequence,
  parallel,
  zoom,
  pan,
} from "@walkr/core";

export default walkr({
  url: "https://example.com",
  title: "Walkr CLI demo",
  description: "A complete scripted walkthrough for local preview/export",
  cursor: {
    shape: "circle",
    color: "#22d3ee",
    size: 18,
    shadow: true,
    clickColor: "#0ea5e9",
  },
  steps: [
    moveTo(620, 380, { duration: 700 }),
    click(620, 380),
    type("hello@example.com", { selector: "input[name=email]", delay: 35 }),
    parallel(
      highlight(".submit-btn", {
        spotlight: true,
        color: "#22d3ee",
        duration: 1200,
        backdropOpacity: 0.35,
      }),
      sequence(
        wait(200),
        moveTo(810, 505, { duration: 500 }),
      ),
    ),
    click(810, 505),
    sequence(
      wait(300),
      scroll(0, 700, { smooth: true }),
      wait(200),
      zoom(1.2, { x: 960, y: 500 }),
      pan(960, 460, { duration: 500 }),
    ),
  ],
});
```

## Requirements

- Node.js `>=18`
- `pnpm`
- `@walkr/playwright` installed in your project for `walkr export`
