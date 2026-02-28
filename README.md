# Walkr

**Create polished web product demos, programmatically.**

Walkr lets you script interactive walkthroughs of any website — animated cursor movements, clicks, typing, highlights — and export them as videos or embeddable players. Think screen recording, but deterministic, editable, and pixel-perfect every time.

Write a short TypeScript script, point it at your app, and get a production-ready product demo you can embed in your landing page, docs, or sales deck.

## Quick start

```bash
npm create walkrstudio@latest my-demo
cd my-demo
npm install
npx walkr dev demo.ts
```

Or add `@walkrstudio/core` to an existing project:

```bash
npm install @walkrstudio/core
```

Create `demo.ts`:

```ts
import { walkr, moveTo, click, type, highlight } from "@walkrstudio/core";

export default walkr({
  url: "https://your-app.com",
  title: "Signup walkthrough",
  steps: [
    moveTo("#email-input", { duration: 600 }),
    click("#email-input"),
    type("hello@example.com", { selector: "#email-input", delay: 35 }),
    highlight(".submit-btn", { spotlight: true, color: "#22d3ee", duration: 1200 }),
  ],
});
```

Preview with live reload:

```bash
npx walkr dev demo.ts
```

Export to video:

```bash
npx walkr export demo.ts --format mp4 --output demo.mp4
```

## Status

Early development / alpha

## Packages

| Package | Description |
| --- | --- |
| [`@walkrstudio/core`](./packages/core/README.md) | TypeScript API for defining walkthroughs and timeline steps. |
| [`@walkrstudio/engine`](./packages/engine/README.md) | Browser playback engine for step timelines. |
| [`@walkr/studio`](./packages/studio/README.md) | Visual timeline editor and live preview (private). |
| [`@walkrstudio/cli`](./packages/cli/README.md) | CLI to preview in Studio and export to media/embed. |
| [`@walkrstudio/playwright`](./packages/playwright/README.md) | Headless capture adapter for rendering and encoding. |
| [`create-walkrstudio`](./packages/create-walkrstudio/README.md) | Project scaffolding tool. |

## Architecture

```text
+-----------------------+        +------------------------+
| @walkrstudio/core     | -----> | @walkrstudio/engine    |
| (define walkthroughs) |        | (browser playback)     |
+-----------------------+        +------------------------+
         |                                |
         |                                v
         |                       +------------------------+
         +--------------------->  | @walkr/studio          |
                                 | (preview + editor)     |
                                 +------------------------+
                                          |
                                          v
                                 +------------------------+
                                 | @walkrstudio/cli       |
                                 | (dev + export)         |
                                 +------------------------+
                                          |
                                          v
                                 +------------------------+
                                 | @walkrstudio/playwright|
                                 | (capture + encode)     |
                                 +------------------------+
```

## Development

```bash
pnpm install
pnpm build
pnpm dev      # run all packages in dev mode
pnpm check    # lint + type-check + tests + dead code detection
```
