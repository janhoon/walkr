# CLI Reference

The `@walkrstudio/cli` package provides the `walkr` command for developing and exporting walkthroughs.

## Installation

```bash
pnpm add @walkrstudio/cli
```

The CLI is available as `walkr` (via the `bin` field in the package).

---

## `walkr dev <script>`

Start Walkr Studio with live script reload.

```bash
walkr dev demo.ts
walkr dev demo.ts --port 3000
```

### Options

| Flag | Type | Default | Description |
|---|---|---|---|
| `--port` | `number` | `5174` | Dev server port. |

This command:

1. Loads and evaluates the walkthrough script (must `export default` a `Walkthrough`).
2. Resolves the target origin from the walkthrough's `url` field.
3. Launches a Vite dev server (default port **5174**) serving Walkr Studio.
4. Proxies requests to your target app through `/__target__/` so the iframe can access it without CORS issues.
5. Opens the Studio URL in your default browser.
6. Watches the script file — on save, the walkthrough JSON is re-written and Studio hot-reloads.

Press `Ctrl+C` to stop.

---

## `walkr export <script> [options]`

Export a walkthrough as video or a self-contained HTML embed.

```bash
walkr export demo.ts --format mp4 --output demo.mp4
```

The script must `export default` a `Walkthrough` object from `@walkrstudio/core`.

### Options

| Flag | Type | Default | Description |
|---|---|---|---|
| `--format` | `mp4 \| gif \| webm \| embed` | `mp4` | Output format. `embed` produces a self-contained HTML file. |
| `--output` | `string` | `output.<ext>` | Output file path. |
| `--width` | `number` | `1920` | Video width in pixels. |
| `--height` | `number` | `1080` | Video height in pixels. |
| `--realtime` | `boolean` | `false` | Use real-time screencast instead of virtual time. |

### Examples

```bash
# Export as MP4 (default)
walkr export demo.ts

# Export as GIF
walkr export demo.ts --format gif --output demo.gif

# Export as self-contained HTML embed
walkr export demo.ts --format embed --output demo.html

# Custom resolution
walkr export demo.ts --width 1280 --height 720 --output demo-720p.mp4

# Real-time recording
walkr export demo.ts --realtime --format webm
```

::: tip
The `export` command requires `@walkrstudio/recorder` to be installed and a Chromium binary available on the system.
:::

---

## Global Flags

| Flag | Description |
|---|---|
| `--help`, `-h` | Show usage information. |
| `--version`, `-v` | Print the CLI version. |
