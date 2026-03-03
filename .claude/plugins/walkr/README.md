# Walkr Plugin for Claude Code

Create product walkthrough demos with AI assistance. This plugin provides a skill that guides Claude through the full Walkr workflow: project setup, script authoring, preview, and export.

## Installation

Install via Claude Code:

```
/install-plugin walkr
```

Or add the plugin path to your Claude Code settings.

## Usage

Once installed, Claude will automatically use the `create-walkthrough` skill when you ask it to build a product demo or walkthrough. You can also invoke it directly:

```
Help me create a walkthrough for my app at http://localhost:3000
```

The skill guides through:

1. **Understanding your walkthrough** — what to demo, what flow to show
2. **Project setup** — installing Walkr packages if needed
3. **Script authoring** — writing the TypeScript walkthrough file
4. **Preview** — running Walkr Studio for live preview
5. **Export** — rendering to MP4, GIF, WebM, or HTML embed

## What you need

- A running web application to demo
- Node.js and pnpm (or npm/yarn)
- For video export: Chromium and ffmpeg installed on your system
