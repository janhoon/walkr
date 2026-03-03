# Claude Code Plugin

Walkr ships with a [Claude Code](https://claude.com/claude-code) plugin that teaches Claude how to create walkthroughs. Instead of writing scripts by hand, you can describe what you want to demo and Claude handles the rest.

## Prerequisites

- [Claude Code](https://claude.com/claude-code) installed and working
- A running web application you want to demo
- Node.js >= 18 and a package manager (pnpm, npm, or yarn)

## Installation

Add the Walkr marketplace and install the plugin from inside Claude Code:

```
/plugin marketplace add janhoon/walkr
```

Then install the Walkr plugin:

```
/plugin install walkr@walkr
```

This registers the `create-walkthrough` skill, which Claude will use automatically when you ask it to build a product demo.

## Usage

Once the plugin is installed, ask Claude to create a walkthrough in natural language:

```
Create a walkthrough for my app at http://localhost:3000 showing the login flow
```

```
Build a product demo of the dashboard — log in, open settings, toggle dark mode
```

```
Record a GIF of the signup process on http://localhost:5173/register
```

Claude follows a 5-phase workflow:

### Phase 1: Understand the walkthrough

Claude asks you about the target URL, the user flow to demo, and the export format (MP4, GIF, WebM, or HTML embed). Everything else uses sensible defaults.

### Phase 2: Project setup

Claude checks if Walkr is installed in your project. If not, it installs the required packages:

```bash
pnpm add @walkrstudio/core @walkrstudio/cli
```

### Phase 3: Write the script

Claude writes a TypeScript walkthrough file with all the steps — cursor movements, clicks, typing, highlights, and waits. It uses `data-testid` attributes or meaningful selectors from your app.

### Phase 4: Preview and iterate

Claude starts Walkr Studio for live preview:

```bash
npx walkr dev demo.ts
```

Open `http://localhost:5174` in your browser to see the walkthrough playing against your app. Claude helps you iterate — fixing selectors, adjusting timing, adding or removing steps. The studio hot-reloads on every save.

### Phase 5: Export

When you're happy with the preview, Claude exports the walkthrough:

```bash
npx walkr export demo.ts --format mp4 --output demo.mp4
```

## Tips

- **Keep your app running.** Walkr loads your app in an iframe, so it needs to be accessible at the URL you provide.
- **Use `data-testid` attributes.** They make selectors stable across UI changes. Claude prefers them when available.
- **Start simple.** Get a basic flow working first, then add highlights, zooms, and fine-tuning.
- **Video export needs Chromium and ffmpeg.** Make sure they're installed on your system if you want MP4/GIF/WebM output.
