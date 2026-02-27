# 🚶 Walkr

**Create polished web product demos, programmatically.**

Walkr lets you script interactive walkthroughs of any website — animated cursor movements, clicks, typing, highlights — and export them as videos or embeddable players. Think screen recording, but deterministic, editable, and pixel-perfect every time. The name? Walk + through → **walkr**.

Write a short TypeScript script, point it at your app, and get a production-ready product demo you can embed in your landing page, docs, or sales deck.

## Status

🚧 Early development / alpha

## Packages

| Package | Description |
| --- | --- |
| [`@walkr/core`](./packages/core/README.md) | TypeScript API for defining walkthroughs and timeline steps. |
| [`@walkr/engine`](./packages/engine/README.md) | Playback and execution runtime for step timelines. |
| [`@walkr/studio`](./packages/studio/README.md) | Visual timeline editor and live preview application. |
| [`@walkr/cli`](./packages/cli/README.md) | CLI to run Studio and export demos to media/embed. |
| [`@walkr/playwright`](./packages/playwright/README.md) | Headless capture adapter for rendering walkthrough output. |

## Quick Start

```ts
import { walkr, moveTo, click, type, highlight } from "@walkr/core";

export default walkr({
  url: "https://example.com",
  title: "Signup walkthrough",
  steps: [
    moveTo(640, 400, { duration: 700 }),
    click(640, 400),
    type("hello@example.com", { selector: "input[name=email]", delay: 35 }),
    highlight(".submit-btn", { spotlight: true, color: "#22d3ee", duration: 1200 }),
  ],
});
```

## Architecture

```text
+-----------------+        +------------------+
|   @walkr/core   | -----> |  @walkr/engine   |
| (script author) |        | (timeline run)   |
+-----------------+        +------------------+
         |                           |
         |                           v
         |                  +------------------+
         +--------------->  |  @walkr/studio   |
                            | (preview/editor) |
                            +------------------+
                                     |
                                     v
                            +------------------+
                            |   @walkr/cli     |
                            | (dev/export UX)  |
                            +------------------+
                                     |
                                     v
                            +------------------+
                            | @walkr/playwright|
                            | (capture/encode) |
                            +------------------+
```

## Package Docs

- [@walkr/core README](./packages/core/README.md)
- [@walkr/engine README](./packages/engine/README.md)
- [@walkr/studio README](./packages/studio/README.md)
- [@walkr/cli README](./packages/cli/README.md)
- [@walkr/playwright README](./packages/playwright/README.md)
