# @walkrstudio/playwright

Headless capture and encoding adapter for Walkr walkthroughs.

`@walkrstudio/playwright` uses Playwright to launch a real Chromium browser, execute a walkthrough, capture frames, and encode them into video or a self-contained HTML embed. It powers the `walkr export` command.

## Install

```bash
npm install @walkrstudio/playwright
npx playwright install chromium
```

## Usage

```ts
import { captureWalkthrough } from "@walkrstudio/playwright";
import demoWalkthrough from "./demo.js";

const result = await captureWalkthrough(demoWalkthrough, {
  format: "mp4",
  output: "demo.mp4",
  width: 1920,
  height: 1080,
  fps: 30,
  onProgress: (percent) => console.log(`${Math.round(percent)}%`),
});

console.log(`Saved to ${result.outputPath}`);
console.log(`${result.frameCount} frames, ${result.duration}ms`);
```

## Options

`captureWalkthrough(walkthrough, options?)` accepts:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | `"mp4" \| "gif" \| "webm" \| "embed"` | `"mp4"` | Output format. |
| `output` | `string` | — | Output file path. |
| `width` | `number` | `1920` | Viewport width in px. |
| `height` | `number` | `1080` | Viewport height in px. |
| `fps` | `number` | `30` | Frames per second. |
| `onProgress` | `(percent: number) => void` | — | Progress callback (0–100). |

## Return value

```ts
interface CaptureResult {
  outputPath: string;
  duration: number;
  frameCount: number;
}
```

## How it works

1. Launches headless Chromium via Playwright.
2. Navigates to the walkthrough URL.
3. Injects a cursor overlay and executes each step, capturing screenshots at the configured FPS.
4. Encodes the PNG frame sequence using `ffmpeg`:
   - **MP4** — libx264, yuv420p
   - **GIF** — two-pass palette optimization
   - **WebM** — libvpx-vp9
   - **Embed** — generates a self-contained HTML file with the engine and walkthrough data inlined

## Requirements

- Node.js >= 18
- `@walkrstudio/core`
- Playwright (`@playwright/test` >= 1.50.0)
- `ffmpeg` on your system PATH (for mp4/gif/webm)
