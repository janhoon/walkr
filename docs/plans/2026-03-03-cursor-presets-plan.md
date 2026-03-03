# Cursor Presets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three built-in cursor presets (`cursor-01`, `cursor-02`, `cursor-03`) as shape options so users can pick a preset cursor and customize its color without providing raw SVG.

**Architecture:** Extend the `shape` union type in core, add a preset registry in the engine that maps preset names to SVG content + color mode + default offset, and wire presets into the existing `applyCursorVisual` rendering pipeline.

**Tech Stack:** TypeScript, Vitest, VitePress (docs)

---

### Task 1: Extend the shape type in core

**Files:**
- Modify: `packages/core/src/types.ts:29`

**Step 1: Update the shape union**

In `packages/core/src/types.ts` line 29, change:

```ts
shape?: "circle" | "arrow" | "dot" | "svg";
```

to:

```ts
shape?: "circle" | "arrow" | "dot" | "svg" | "cursor-01" | "cursor-02" | "cursor-03";
```

**Step 2: Run type-check to confirm no breakage**

Run: `pnpm type-check`
Expected: PASS — the union is widened, so all existing code still compiles.

**Step 3: Commit**

```bash
git add packages/core/src/types.ts
git commit -m "feat(core): add cursor preset names to shape union"
```

---

### Task 2: Create the cursor preset registry

**Files:**
- Create: `packages/engine/src/cursor-presets.ts`

**Step 1: Write the failing test**

Create `packages/engine/src/__tests__/cursor-presets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CURSOR_PRESETS, isPresetShape, getPresetSvg } from "../cursor-presets.js";

describe("cursor-presets", () => {
  it("exports all three presets", () => {
    expect(CURSOR_PRESETS["cursor-01"]).toBeDefined();
    expect(CURSOR_PRESETS["cursor-02"]).toBeDefined();
    expect(CURSOR_PRESETS["cursor-03"]).toBeDefined();
  });

  it("isPresetShape returns true for preset names", () => {
    expect(isPresetShape("cursor-01")).toBe(true);
    expect(isPresetShape("cursor-02")).toBe(true);
    expect(isPresetShape("cursor-03")).toBe(true);
  });

  it("isPresetShape returns false for non-preset shapes", () => {
    expect(isPresetShape("circle")).toBe(false);
    expect(isPresetShape("arrow")).toBe(false);
    expect(isPresetShape("svg")).toBe(false);
  });

  it("getPresetSvg injects color into stroke-mode preset", () => {
    const svg = getPresetSvg("cursor-01", "#ff0000");
    expect(svg).toContain('stroke="#ff0000"');
    expect(svg).not.toContain('stroke="#000000"');
  });

  it("getPresetSvg injects color into fill-mode preset", () => {
    const svg = getPresetSvg("cursor-02", "#00ff00");
    expect(svg).toContain('fill="#00ff00"');
    expect(svg).not.toContain('fill="#1C274C"');
  });

  it("each preset has a valid offset", () => {
    for (const preset of Object.values(CURSOR_PRESETS)) {
      expect(preset.offset.x).toBeGreaterThanOrEqual(0);
      expect(preset.offset.x).toBeLessThanOrEqual(1);
      expect(preset.offset.y).toBeGreaterThanOrEqual(0);
      expect(preset.offset.y).toBeLessThanOrEqual(1);
    }
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `pnpm --filter @walkrstudio/engine test -- cursor-presets`
Expected: FAIL — module does not exist yet.

**Step 3: Implement the preset registry**

Create `packages/engine/src/cursor-presets.ts`:

```ts
export interface CursorPreset {
  svg: string;
  colorAttr: "stroke" | "fill";
  originalColor: string;
  offset: { x: number; y: number };
}

export const CURSOR_PRESETS: Record<string, CursorPreset> = {
  "cursor-01": {
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    colorAttr: "stroke",
    originalColor: "#000000",
    offset: { x: 0.15, y: 0.1 },
  },
  "cursor-02": {
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5744 19.1999L12.6361 15.2616L11.4334 16.4643C10.2022 17.6955 9.58656 18.3111 8.92489 18.1658C8.26322 18.0204 7.96225 17.2035 7.3603 15.5696L5.3527 10.1205C4.15187 6.86106 3.55146 5.23136 4.39141 4.39141C5.23136 3.55146 6.86106 4.15187 10.1205 5.35271L15.5696 7.3603C17.2035 7.96225 18.0204 8.26322 18.1658 8.92489C18.3111 9.58656 17.6955 10.2022 16.4643 11.4334L15.2616 12.6361L19.1999 16.5744C19.6077 16.9821 19.8116 17.186 19.9058 17.4135C20.0314 17.7168 20.0314 18.0575 19.9058 18.3608C19.8116 18.5882 19.6077 18.7921 19.1999 19.1999C18.7921 19.6077 18.5882 19.8116 18.3608 19.9058C18.0575 20.0314 17.7168 20.0314 17.4135 19.9058C17.186 19.8116 16.9821 19.6077 16.5744 19.1999Z" fill="#1C274C"/></svg>',
    colorAttr: "fill",
    originalColor: "#1C274C",
    offset: { x: 0.15, y: 0.1 },
  },
  "cursor-03": {
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5744 19.1999L12.6361 15.2616L11.4334 16.4643C10.2022 17.6955 9.58656 18.3111 8.92489 18.1658C8.26322 18.0204 7.96225 17.2035 7.3603 15.5696L5.3527 10.1205C4.15187 6.86106 3.55146 5.23136 4.39141 4.39141C5.23136 3.55146 6.86106 4.15187 10.1205 5.35271L15.5696 7.3603C17.2035 7.96225 18.0204 8.26322 18.1658 8.92489C18.3111 9.58656 17.6955 10.2022 16.4643 11.4334L15.2616 12.6361L19.1999 16.5744C19.6077 16.9821 19.8116 17.186 19.9058 17.4135C20.0314 17.7168 20.0314 18.0575 19.9058 18.3608C19.8116 18.5882 19.6077 18.7921 19.1999 19.1999C18.7921 19.6077 18.5882 19.8116 18.3608 19.9058C18.0575 20.0314 17.7168 20.0314 17.4135 19.9058C17.186 19.8116 16.9821 19.6077 16.5744 19.1999Z" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    colorAttr: "stroke",
    originalColor: "#1C274C",
    offset: { x: 0.15, y: 0.1 },
  },
};

export function isPresetShape(shape: string): shape is keyof typeof CURSOR_PRESETS {
  return shape in CURSOR_PRESETS;
}

export function getPresetSvg(presetName: string, color: string): string {
  const preset = CURSOR_PRESETS[presetName];
  if (!preset) {
    return "";
  }
  return preset.svg.replace(
    `${preset.colorAttr}="${preset.originalColor}"`,
    `${preset.colorAttr}="${color}"`,
  );
}
```

**Step 4: Run the test to verify it passes**

Run: `pnpm --filter @walkrstudio/engine test -- cursor-presets`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/engine/src/cursor-presets.ts packages/engine/src/__tests__/cursor-presets.test.ts
git commit -m "feat(engine): add cursor preset registry with tests"
```

---

### Task 3: Wire presets into cursor rendering

**Files:**
- Modify: `packages/engine/src/cursor.ts:24-25,53-64,121-160`

**Step 1: Update `ResolvedCursorConfig` shape type**

In `packages/engine/src/cursor.ts` line 25, change:

```ts
  shape: "circle" | "arrow" | "dot" | "svg";
```

to:

```ts
  shape: "circle" | "arrow" | "dot" | "svg" | "cursor-01" | "cursor-02" | "cursor-03";
```

**Step 2: Update `resolveCursorConfig` to handle preset offsets**

In `packages/engine/src/cursor.ts`, add import at the top (after the existing imports):

```ts
import { CURSOR_PRESETS, isPresetShape } from "./cursor-presets.js";
```

In `resolveCursorConfig` (lines 53-65), update the offset resolution so that
presets use their default offset when the user hasn't provided one:

```ts
function resolveCursorConfig(config: Partial<CursorConfig> = {}): ResolvedCursorConfig {
  const shape = config.shape ?? DEFAULT_CURSOR_CONFIG.shape;
  const presetOffset = isPresetShape(shape) ? CURSOR_PRESETS[shape].offset : undefined;

  return {
    shape,
    color: config.color ?? DEFAULT_CURSOR_CONFIG.color,
    size: clampSize(config.size),
    shadow: config.shadow ?? DEFAULT_CURSOR_CONFIG.shadow,
    clickColor: config.clickColor ?? DEFAULT_CURSOR_CONFIG.clickColor,
    svgContent: shape === "svg" ? config.svgContent : undefined,
    offset: clampOffset(config.offset ?? presetOffset),
  };
}
```

**Step 3: Add preset rendering branch in `applyCursorVisual`**

In `packages/engine/src/cursor.ts`, inside `applyCursorVisual` (line 121-160), add a
new branch for presets. Insert it before the `else` (default circle) branch — after the
`"svg"` branch at line 146:

```ts
  } else if (isPresetShape(config.shape)) {
    applyCommonVisualStyle(visual, config);
    const presetSvg = getPresetSvg(config.shape, config.color);
    visual.innerHTML = presetSvg;
    const first = visual.firstElementChild;
    if (first instanceof HTMLElement) {
      first.style.width = "100%";
      first.style.height = "100%";
      first.style.display = "block";
    }
```

Also add `getPresetSvg` to the import statement.

**Step 4: Run type-check and existing tests**

Run: `pnpm type-check && pnpm --filter @walkrstudio/engine test`
Expected: All pass.

**Step 5: Commit**

```bash
git add packages/engine/src/cursor.ts
git commit -m "feat(engine): wire cursor presets into rendering pipeline"
```

---

### Task 4: Update documentation

**Files:**
- Modify: `apps/docs/api/core.md:37-45`

**Step 1: Update the CursorConfig table**

In `apps/docs/api/core.md` line 39, change the shape row from:

```markdown
| `shape` | `"circle" \| "arrow" \| "dot" \| "svg"` | — | Cursor shape. |
```

to:

```markdown
| `shape` | `"circle" \| "arrow" \| "dot" \| "svg" \| "cursor-01" \| "cursor-02" \| "cursor-03"` | — | Cursor shape. Use a `cursor-*` preset for a ready-made pointer. |
```

**Step 2: Add cursor presets visual reference**

After the `CursorConfig` table (after line 45), add:

````markdown

#### Cursor Presets

Built-in cursor presets you can use by setting `shape` to the preset name. The `color` option controls the cursor colour.

<div style="display:flex;gap:2rem;align-items:flex-start;margin:1.5rem 0">
  <div style="text-align:center">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div><code>cursor-01</code></div>
  </div>
  <div style="text-align:center">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M16.5744 19.1999L12.6361 15.2616L11.4334 16.4643C10.2022 17.6955 9.58656 18.3111 8.92489 18.1658C8.26322 18.0204 7.96225 17.2035 7.3603 15.5696L5.3527 10.1205C4.15187 6.86106 3.55146 5.23136 4.39141 4.39141C5.23136 3.55146 6.86106 4.15187 10.1205 5.35271L15.5696 7.3603C17.2035 7.96225 18.0204 8.26322 18.1658 8.92489C18.3111 9.58656 17.6955 10.2022 16.4643 11.4334L15.2616 12.6361L19.1999 16.5744C19.6077 16.9821 19.8116 17.186 19.9058 17.4135C20.0314 17.7168 20.0314 18.0575 19.9058 18.3608C19.8116 18.5882 19.6077 18.7921 19.1999 19.1999C18.7921 19.6077 18.5882 19.8116 18.3608 19.9058C18.0575 20.0314 17.7168 20.0314 17.4135 19.9058C17.186 19.8116 16.9821 19.6077 16.5744 19.1999Z" fill="currentColor"/></svg>
    <div><code>cursor-02</code></div>
  </div>
  <div style="text-align:center">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M16.5744 19.1999L12.6361 15.2616L11.4334 16.4643C10.2022 17.6955 9.58656 18.3111 8.92489 18.1658C8.26322 18.0204 7.96225 17.2035 7.3603 15.5696L5.3527 10.1205C4.15187 6.86106 3.55146 5.23136 4.39141 4.39141C5.23136 3.55146 6.86106 4.15187 10.1205 5.35271L15.5696 7.3603C17.2035 7.96225 18.0204 8.26322 18.1658 8.92489C18.3111 9.58656 17.6955 10.2022 16.4643 11.4334L15.2616 12.6361L19.1999 16.5744C19.6077 16.9821 19.8116 17.186 19.9058 17.4135C20.0314 17.7168 20.0314 18.0575 19.9058 18.3608C19.8116 18.5882 19.6077 18.7921 19.1999 19.1999C18.7921 19.6077 18.5882 19.8116 18.3608 19.9058C18.0575 20.0314 17.7168 20.0314 17.4135 19.9058C17.186 19.8116 16.9821 19.6077 16.5744 19.1999Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div><code>cursor-03</code></div>
  </div>
</div>

```ts
// Example: use cursor-02 preset with a custom colour
walkr({
  url: "https://example.com",
  cursor: { shape: "cursor-02", color: "#10b981", size: 28 },
  steps: [/* ... */],
});
```
````

**Step 3: Run the docs dev server to verify rendering**

Run: `pnpm --filter @walkrstudio/docs dev`
Expected: Navigate to `/api/core` and see the three cursor SVGs rendered inline.

**Step 4: Commit**

```bash
git add apps/docs/api/core.md
git commit -m "docs: add cursor presets visual reference and update config table"
```

---

### Task 5: Final verification

**Step 1: Run full lint, type-check, and test suite**

Run: `pnpm lint && pnpm type-check && pnpm test`
Expected: All pass with no errors.

**Step 2: Run build**

Run: `pnpm build`
Expected: All packages build successfully.
