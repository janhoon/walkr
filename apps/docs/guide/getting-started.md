# Getting Started

Walkr lets you define interactive product walkthroughs in TypeScript and play them back in the browser, export them as video, or embed them as self-contained HTML.

## Installation

Install the core package and CLI:

```bash
pnpm add @walkrstudio/core @walkrstudio/cli
```

If you want to export walkthroughs as video you also need the recorder:

```bash
pnpm add @walkrstudio/recorder
```

## Write Your First Walkthrough

Create a file called `demo.ts`:

```ts
import { walkr, moveTo, click, type, wait, highlight } from "@walkrstudio/core";

export default walkr({
  url: "http://localhost:3000",
  title: "My First Walkthrough",
  viewport: { width: 1280, height: 720 },
  steps: [
    // Move the cursor to a button and click it
    moveTo("#get-started", { duration: 600 }),
    click("#get-started"),

    // Wait for the page to settle
    wait(500),

    // Type into an input
    moveTo("#email-input", { duration: 400 }),
    click("#email-input"),
    type("hello@example.com", { selector: "#email-input", delay: 40 }),

    // Highlight a section
    highlight("#signup-form", {
      spotlight: true,
      color: "#3b82f6",
      duration: 1500,
    }),
  ],
});
```

A walkthrough is created with the `walkr()` function. It takes a target URL, an optional viewport size, and an array of steps.

## Run with `walkr dev`

Start Walkr Studio with live-reload:

```bash
npx walkr dev demo.ts
```

This launches a local dev server (default port 5174) with Walkr Studio. The walkthrough replays inside an iframe pointed at your target URL. Every time you save `demo.ts`, the studio reloads automatically.

## Export

When you are happy with the walkthrough, export it:

```bash
npx walkr export demo.ts --format mp4 --output demo.mp4
```

See the [CLI Reference](/api/cli) for all export options.

## Next Steps

- [Core API](/api/core) — all step builders and composers
- [Engine API](/api/engine) — programmatic playback with `WalkrEngine`
- [CLI Reference](/api/cli) — `walkr dev` and `walkr export` flags
