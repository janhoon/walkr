# Walkr

**Create polished web product demos, programmatically.**

Walkr lets you script interactive walkthroughs of any website — animated cursor movements, clicks, typing, highlights — and export them as videos or embeddable players. Think screen recording, but deterministic, editable, and pixel-perfect every time.

Write a short TypeScript script, point it at your app, and get a production-ready product demo you can embed in your landing page, docs, or sales deck.

![Walkr Studio — visual timeline editor and live preview](docs/screenshot.png)

**[Documentation](https://janhoon.github.io/walkr/)**

## Install

Walkr ships as a single CLI package that includes everything you need:

```bash
npm install -g @walkrstudio/cli
```

Or use it without installing:

```bash
npx @walkrstudio/cli dev demo.ts
```

### Prerequisites

- **Node.js** >= 18
- **Chromium** — the recorder needs a local Chromium-based browser. Install one if you don't already have it:
  - Arch Linux: `sudo pacman -S chromium`
  - Ubuntu/Debian: `sudo apt install chromium-browser`
  - macOS: `brew install --cask chromium`
  - Or set `CHROMIUM_PATH` to point at any Chrome/Brave/Edge binary
- **ffmpeg** — required for video export (`mp4`, `webm`, `gif`)

## Quick start

Create a file called `demo.ts`:

```ts
import { walkr, moveTo, click, type, highlight, hover, wait, drag } from "@walkrstudio/core";

export default walkr({
  url: "https://your-app.com",
  title: "Signup walkthrough",
  steps: [
    moveTo("#email-input", { name: "Focus email field", duration: 600 }),
    click("#email-input", { name: "Click email input" }),
    type("hello@example.com", { name: "Enter email", selector: "#email-input", delay: 35 }),
    wait(300, { name: "Pause before highlight" }),
    highlight(".submit-btn", { name: "Spotlight submit", spotlight: true, color: "#22d3ee", duration: 1200 }),
    moveTo(".submit-btn", { name: "Move to submit", duration: 400 }),
    click(".submit-btn", { name: "Submit form" }),
  ],
});
```

Preview with live reload:

```bash
walkr dev demo.ts
```

Export to video:

```bash
walkr export demo.ts --format mp4 --output demo.mp4
```

## CLI reference

```
walkr dev <script>                  Start Walkr Studio with live script reload
walkr export <script> [options]     Export walkthrough as video or embed
```

### Export options

| Flag | Description | Default |
|------|-------------|---------|
| `--format` | `mp4`, `gif`, `webm`, or `embed` | `mp4` |
| `--output` | Output file path | `output.<ext>` |
| `--width` | Video width in px | `1920` |
| `--height` | Video height in px | `1080` |
| `--realtime` | Use real-time screencast instead of virtual time | off |

### Export formats

- **mp4** — H.264 video, good default for most uses
- **webm** — VP9 video, works natively in browsers
- **gif** — animated GIF at 15 fps, scaled to 1280px wide
- **embed** — self-contained HTML file with a built-in frame player (all frames inlined as base64)

### Capture modes

**Virtual time** (default) uses Chrome's virtual time API to step through the walkthrough frame-by-frame. Every frame is a full `captureScreenshot`, so the output is fully deterministic — identical input always produces identical output. Frames stream directly to ffmpeg with no temp files.

**Real-time** (`--realtime`) plays the walkthrough at 1x speed using Chrome's `Page.startScreencast` for push-based frame delivery. Wall-clock time roughly equals walkthrough duration. Useful when your app has animations or transitions that depend on real browser timing.

```bash
# Deterministic capture (default)
walkr export demo.ts --format mp4

# Real-time capture
walkr export demo.ts --format mp4 --realtime
```

## Step functions

All step functions are imported from `@walkrstudio/core`.

### Step names

Every step accepts an optional `name` in its options. Names appear in the Studio timeline, engine lifecycle events (`step_start`, `step_end`, `step_error`), and error messages — making walkthroughs easier to read and debug.

```ts
moveTo('#settings', { name: 'Open settings menu' })
click('#save-btn', { name: 'Save changes' })
wait(1000, { name: 'Wait for animation' })
```

When a step has no name, the Studio timeline falls back to showing the step type (e.g. `CLICK`).

### `walkr(options)`

Define a walkthrough. Returns a `Walkthrough` object.

```ts
walkr({
  url: "https://your-app.com",       // target URL to load in the iframe
  title: "My Demo",                  // optional title (shown in embed player)
  description: "A product demo.",    // optional description
  viewport: { width: 1920, height: 1080 },
  cursor: { shape: "arrow", color: "#10b981", size: 24, shadow: true },
  steps: [ /* ... */ ],
})
```

### `moveTo(selector, options?)`

Animate the cursor to the center of a DOM element.

```ts
moveTo("#signup-btn", { duration: 600, easing: "ease-in-out" })
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `duration` | `number` | Animation time in ms |
| `easing` | `string` | CSS easing function |
| `follow` | `boolean` | Follow element if it moves |

### `moveToCoords(x, y, options?)`

Animate the cursor to absolute viewport coordinates. Same options as `moveTo`.

```ts
moveToCoords(960, 540, { duration: 400 })
```

### `click(selector, options?)`

Click on an element. Triggers a real DOM click event.

```ts
click("#signup-btn")
click("#context-menu", { button: "right" })
click("#file", { double: true })
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `button` | `"left" \| "right" \| "middle"` | Mouse button |
| `double` | `boolean` | Double-click |

### `clickCoords(x, y, options?)`

Click at absolute viewport coordinates. Same options as `click`.

### `type(text, options?)`

Type text character by character into a focused or targeted element.

```ts
type("hello@example.com", { selector: "#email-input", delay: 35 })
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `selector` | `string` | Target element (focuses it before typing) |
| `delay` | `number` | Delay between keystrokes in ms |

### `scroll(x, y, options?)`

Scroll the page to absolute coordinates.

```ts
scroll(0, 500, { smooth: true })
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `smooth` | `boolean` | Use smooth scrolling |

### `highlight(selector, options?)`

Draw a highlight overlay on an element. Supports a spotlight mode that dims the rest of the page.

```ts
highlight("#feature-card", {
  color: "#22d3ee",
  duration: 1200,
  spotlight: true,
  backdropOpacity: 0.3,
  padding: 8,
  borderRadius: 12,
})
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `color` | `string` | Highlight border/glow color |
| `duration` | `number` | How long the highlight stays visible (ms) |
| `spotlight` | `boolean` | Dim everything outside the element |
| `backdropOpacity` | `number` | Backdrop darkness (0–1) when spotlight is on |
| `padding` | `number` | Extra space around the element (px) |
| `borderRadius` | `number` | Corner radius of the highlight box (px) |

### `zoom(level, options?)`

Zoom the viewport to a scale level.

```ts
zoom(1.5, { x: 960, y: 400, easing: "ease-out" })
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `x` | `number` | Zoom origin X |
| `y` | `number` | Zoom origin Y |
| `easing` | `string` | CSS easing function |
| `follow` | `boolean` | Follow cursor after zooming |

### `pan(x, y, options?)`

Pan the viewport to a position (works with zoom).

```ts
pan(200, 100, { duration: 500, easing: "ease-in-out" })
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `duration` | `number` | Animation time in ms (default: 360) |
| `easing` | `string` | CSS easing function |

### `wait(ms, options?)`

Pause for a fixed duration. Useful between steps for pacing.

```ts
wait(500)
wait(1000, { name: 'Wait for animation' })
```

### `hover(selector, options?)`

Hover over an element. Moves the cursor to the element, dispatches `mouseover` and `mouseenter`, holds for the specified duration, then dispatches `mouseleave` and `mouseout` to clean up the hover state. The element returns to its default (non-hovered) appearance after the step completes.

```ts
hover(".dropdown-trigger", { duration: 1500 })
hover("#tooltip-target")
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `duration` | `number` | How long to hold the hover (ms). Default: `0` |
| `cursor` | `Partial<CursorConfig>` | Per-step cursor override |

### `drag(from, to, options?)`

Simulate a click-drag from one location to another. Each endpoint can be a CSS selector or absolute coordinates.

```ts
drag({ selector: "#item" }, { selector: "#dropzone" })
drag({ x: 100, y: 200 }, { x: 500, y: 300 })
drag({ selector: "#slider-thumb" }, { x: 800, y: 200 })
```

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Human-readable step label |
| `cursor` | `Partial<CursorConfig>` | Per-step cursor override |

Default duration: 1000 ms. Dispatches pointer and mouse events (not the HTML5 Drag and Drop API).

### `clearCache()`

Clear browser cookies and storage. Useful at the start of a walkthrough to ensure a clean state.

```ts
clearCache()
```

### `sequence(...steps)`

Run steps one after another. Total duration is the sum of all steps. This is the default behavior inside `steps`, but useful for nesting inside `parallel`.

```ts
sequence(
  moveTo("#btn", { duration: 300 }),
  click("#btn"),
)
```

### `parallel(...steps)`

Run steps at the same time. Total duration is the longest step.

```ts
parallel(
  moveTo("#btn", { duration: 600 }),
  highlight("#btn", { duration: 600, spotlight: true }),
)
```

### Cursor config

Every step accepts a `cursor` override to change cursor appearance mid-walkthrough:

```ts
moveTo("#element", {
  duration: 400,
  cursor: { shape: "dot", color: "#ef4444", size: 16 },
})
```

Global cursor config is set in `walkr()`:

```ts
walkr({
  url: "...",
  cursor: {
    shape: "arrow",   // "circle" | "arrow" | "dot" | "svg"
    color: "#10b981",
    size: 24,
    shadow: true,
    clickColor: "#059669",
    svgContent: "<svg>...</svg>",  // custom SVG for shape: "svg"
    offset: { x: 0.15, y: 0.1 },  // hotspot offset as fraction (0–1)
  },
  steps: [],
})
```

## Full example

```ts
import {
  clearCache, click, drag, highlight, moveTo,
  type, wait, walkr, zoom, parallel,
} from "@walkrstudio/core";

export default walkr({
  url: "http://localhost:5173/login",
  title: "App Login Demo",
  viewport: { width: 1920, height: 1080 },
  cursor: { shape: "arrow", color: "#10b981", size: 24, shadow: true },
  steps: [
    clearCache({ name: "Reset browser state" }),
    wait(800),

    // Fill in login form
    moveTo('[data-testid="email-input"]', { name: "Focus email", duration: 600 }),
    click('[data-testid="email-input"]'),
    type("admin@example.com", { name: "Enter email", selector: '[data-testid="email-input"]', delay: 40 }),
    wait(300),

    moveTo('[data-testid="password-input"]', { name: "Focus password", duration: 400 }),
    click('[data-testid="password-input"]'),
    type("password123", { name: "Enter password", selector: '[data-testid="password-input"]', delay: 50 }),
    wait(300),

    // Spotlight the submit button, then click
    parallel(
      highlight('[data-testid="login-btn"]', {
        name: "Spotlight login button",
        spotlight: true,
        color: "#10b981",
        duration: 1000,
        backdropOpacity: 0.3,
      }),
      moveTo('[data-testid="login-btn"]', { duration: 600 }),
    ),
    click('[data-testid="login-btn"]', { name: "Submit login" }),

    // Wait for dashboard, then zoom into a feature
    wait(1500, { name: "Wait for dashboard" }),
    zoom(1.4, { name: "Zoom into feature", x: 960, y: 400, easing: "ease-out" }),
    wait(2000),
  ],
});
```

## Status

Early development / alpha

## Architecture

```
@walkrstudio/core        Define walkthroughs (steps, cursor, viewport)
        |
        v
@walkrstudio/engine      Browser playback engine for step timelines
        |
        v
@walkrstudio/studio      Visual preview and timeline editor
        |
        v
@walkrstudio/cli         CLI commands: dev (preview) + export (record)
        |
        v
@walkrstudio/recorder    Headless capture via CDP + streaming ffmpeg encode
```

## Claude Code Plugin

Walkr includes a [Claude Code](https://claude.com/claude-code) plugin that helps AI agents create walkthroughs for you. The `create-walkthrough` skill guides Claude through project setup, script authoring, preview, and export.

### Install the plugin

In Claude Code, run:

```
/install-plugin walkr
```

Then ask Claude to create a walkthrough:

```
Create a walkthrough for my app at http://localhost:3000 showing the signup flow
```

Claude will walk through the full process — setting up the project, writing the script, previewing in Studio, and exporting to video.

See the [Claude Code Plugin guide](https://janhoon.github.io/walkr/guide/claude-code-plugin) for detailed setup instructions.

## Development

```bash
pnpm install
pnpm build
pnpm dev          # run all packages in dev mode
pnpm lint         # biome lint + format
pnpm type-check   # typescript
pnpm knip         # dead code + unused dependency detection
pnpm test         # vitest
```
