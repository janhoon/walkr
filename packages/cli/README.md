# @walkrstudio/cli

CLI for previewing and exporting Walkr walkthroughs.

## Install

```bash
npm install -g @walkrstudio/cli
```

Or run without a global install:

```bash
npx walkr <command>
```

## Commands

### `walkr dev <script>`

Opens Walkr Studio with live reload. Write your walkthrough script, and the preview updates every time you save.

```bash
walkr dev demo.ts
```

This starts a Vite dev server on port 5174, loads your script, proxies the target website, and opens the Studio UI in your browser.

### `walkr export <script> [options]`

Exports a walkthrough to video or a self-contained HTML embed.

```bash
# MP4 (default)
walkr export demo.ts

# GIF
walkr export demo.ts --format gif --output demo.gif

# Self-contained HTML embed
walkr export demo.ts --format embed --output demo.html
```

**Options:**

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--format` | `mp4 \| gif \| webm \| embed` | `mp4` | Output format. |
| `--output` | `string` | `output.<ext>` | Output file path. |
| `--width` | `number` | `1920` | Render width in px. |
| `--height` | `number` | `1080` | Render height in px. |

### `walkr --help`

Shows command usage and examples.

### `walkr --version`

Prints the current version.

## Example walkthrough script

```ts
import {
  walkr,
  moveTo,
  click,
  type,
  highlight,
  wait,
  scroll,
  zoom,
  pan,
  sequence,
  parallel,
} from "@walkrstudio/core";

export default walkr({
  url: "https://your-app.com",
  title: "Product demo",
  cursor: {
    shape: "circle",
    color: "#22d3ee",
    size: 18,
    shadow: true,
    clickColor: "#0ea5e9",
  },
  steps: [
    moveTo("#email-input", { duration: 600 }),
    click("#email-input"),
    type("hello@example.com", { selector: "#email-input", delay: 35 }),

    parallel(
      highlight(".submit-btn", {
        spotlight: true,
        color: "#22d3ee",
        duration: 1200,
        backdropOpacity: 0.35,
      }),
      sequence(
        wait(200),
        moveTo(".submit-btn", { duration: 500 }),
      ),
    ),
    click(".submit-btn"),

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

- Node.js >= 18
- `@walkrstudio/core` — defines the walkthrough
- `@walkrstudio/playwright` — required for `walkr export` (peer dependency)
- `ffmpeg` — required on your system PATH for video encoding (mp4/gif/webm)
