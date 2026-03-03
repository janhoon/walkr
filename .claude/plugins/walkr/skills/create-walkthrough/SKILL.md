---
name: create-walkthrough
description: "Create product walkthrough demos with Walkr. Use when the user wants to build a product demo, walkthrough, tutorial video, or animated product tour. Guides through project setup, script authoring, preview, and export."
---

# Create a Product Walkthrough with Walkr

Walkr lets you script interactive product demos in TypeScript and export them as MP4, GIF, WebM, or self-contained HTML embeds. This skill guides you through the full workflow.

## Process

Follow these phases in order:

### Phase 1: Understand the walkthrough

Ask the user these questions (one at a time, skip any they've already answered):

1. **Target app URL** — What URL should the walkthrough demo? The app must be running locally or accessible via URL.
2. **Flow description** — Describe the user journey to demo in natural language (e.g. "log in, navigate to the dashboard, click on a project, filter by date range").
3. **Export format** — MP4 (default), GIF, WebM, or self-contained HTML embed?

Use sensible defaults for everything else:
- Viewport: 1920x1080 (or 1280x720 for smaller demos)
- Cursor: circle shape, cyan color (#22d3ee), size 24, with shadow
- Timing: 600ms for cursor movements, 35-50ms typing delay, 300-800ms waits between scenes

### Phase 2: Project setup

Check if Walkr is already installed:

```bash
ls node_modules/@walkrstudio/core 2>/dev/null && echo "installed" || echo "not installed"
```

If not installed:
```bash
pnpm add @walkrstudio/core @walkrstudio/cli
```

If the user wants video export (mp4/gif/webm), also install the recorder:
```bash
pnpm add @walkrstudio/recorder
```

Verify the target app is accessible:
```bash
curl -s -o /dev/null -w "%{http_code}" <target-url>
```

### Phase 3: Write the walkthrough script

**Before writing any code**, read the API reference file in this skill's directory:
- File: `api-reference.md` (in the same directory as this SKILL.md)

This contains the complete step builder API, all options, and examples.

Create a TypeScript file (default: `demo.ts`, or whatever name the user prefers):

```ts
import { walkr, moveTo, click, type, wait, highlight, ... } from "@walkrstudio/core";

export default walkr({
  url: "<target-url>",
  title: "<walkthrough-title>",
  viewport: { width: 1920, height: 1080 },
  steps: [
    // Steps go here
  ],
});
```

#### Script authoring guidelines

**Structure:**
- Group steps into scenes with comment headers: `// ── Scene 1: Login ──`
- Start with `clearCache()` if the app uses cookies/auth state
- Add `wait()` between scenes for visual breathing room (300-800ms)

**Cursor movement pattern:**
For every interaction, move the cursor first, then act:
```ts
moveTo("#button", { duration: 600 }),
click("#button"),
```

**Typing pattern:**
Move to the input, click to focus, then type:
```ts
moveTo("#email-input", { duration: 400 }),
click("#email-input"),
type("user@example.com", { selector: "#email-input", delay: 40 }),
```

**Selector strategy:**
- Prefer `data-testid` attributes: `[data-testid="login-btn"]`
- Fall back to meaningful IDs: `#submit-button`
- Fall back to classes or semantic selectors: `.nav-item`, `button[type="submit"]`
- **Tell the user** that selectors may need adjustment after previewing — you're writing best-guess selectors from their description

**Timing defaults:**
| Action | Duration |
|--------|----------|
| `moveTo` | 400-700ms |
| `type` delay | 35-50ms per character |
| `wait` between scenes | 300-800ms |
| `wait` for page loads | 1000-2000ms |
| `highlight` | 800-2000ms |

**Highlights and tooltips:**
Use `highlight()` with `spotlight: true` to draw attention to key UI elements. Use `tooltip()` to add explanatory text.

**Waiting for dynamic content:**
- Use `waitForSelector()` instead of `wait()` when waiting for elements to appear
- Use `waitForNavigation()` after clicks that trigger page navigation

### Phase 4: Preview and iterate

Start the dev server:
```bash
npx walkr dev <script-file>
```

This opens Walkr Studio at http://localhost:5174 with live reload. Tell the user:
- Open the Studio URL in their browser
- The walkthrough plays in an iframe pointed at their target app
- Every time you save the script file, Studio hot-reloads

Help the user iterate:
- Fix broken selectors (elements not found)
- Adjust timing (too fast, too slow)
- Add/remove/reorder steps
- Tune highlight colors and durations

### Phase 5: Export

When the user is happy with the preview, export:

```bash
npx walkr export <script-file> --format <format> --output <output-path>
```

Format options:
- `mp4` — H.264 video (best compatibility, default)
- `webm` — VP9 video (native browser support)
- `gif` — Animated GIF (auto-scaled, 15fps)
- `embed` — Self-contained HTML file (no dependencies, works offline)

Custom resolution:
```bash
npx walkr export demo.ts --width 1280 --height 720 --output demo-720p.mp4
```

Report the output file path and size when done.

## Available step builders

Quick reference (see `api-reference.md` for full details and all options):

| Builder | Purpose | Example |
|---------|---------|---------|
| `moveTo(selector, opts?)` | Move cursor to element | `moveTo("#btn", { duration: 600 })` |
| `moveToCoords(x, y, opts?)` | Move cursor to coordinates | `moveToCoords(960, 540)` |
| `click(selector, opts?)` | Click an element | `click("#btn")` |
| `clickCoords(x, y, opts?)` | Click at coordinates | `clickCoords(100, 200)` |
| `type(text, opts?)` | Type text character by character | `type("hello", { selector: "#input", delay: 40 })` |
| `scroll(x, y, opts?)` | Scroll the page | `scroll(0, 300, { smooth: true })` |
| `wait(ms)` | Pause playback | `wait(500)` |
| `waitForSelector(sel, opts?)` | Wait for element to exist | `waitForSelector(".modal")` |
| `waitForNavigation(opts?)` | Wait for page navigation | `waitForNavigation()` |
| `highlight(selector, opts?)` | Highlight an element | `highlight("#card", { spotlight: true })` |
| `tooltip(selector, text, opts?)` | Show a tooltip | `tooltip("#btn", "Click here")` |
| `narrate(src, opts?)` | Play audio | `narrate("/audio/intro.mp3")` |
| `zoom(level, opts?)` | Zoom the viewport | `zoom(2, { x: 500, y: 300 })` |
| `pan(x, y, opts?)` | Pan the viewport | `pan(200, 100)` |
| `drag(from, to, opts?)` | Click-drag between locations | `drag({ selector: "#a" }, { selector: "#b" })` |
| `clearCache()` | Clear browser cache | `clearCache()` |
| `sequence(...steps)` | Run steps sequentially | `sequence(moveTo(...), click(...))` |
| `parallel(...steps)` | Run steps simultaneously | `parallel(moveTo(...), narrate(...))` |
