# Cursor Presets Design

## Summary

Add three built-in cursor presets (`cursor-01`, `cursor-02`, `cursor-03`) as new shape
options. Users select a preset by name and can customize the color — no need to provide
raw SVG content.

## Type Changes

Extend `CursorConfig.shape` in `packages/core/src/types.ts`:

```ts
shape?: "circle" | "arrow" | "dot" | "svg" | "cursor-01" | "cursor-02" | "cursor-03"
```

## Preset Registry

New file: `packages/engine/src/cursor-presets.ts`

Maps preset names to SVG content and rendering metadata:

```ts
interface CursorPreset {
  svg: string                      // SVG markup (color placeholder)
  colorMode: "stroke" | "fill"     // how color is applied to the path
  offset: { x: number; y: number } // default hotspot position
}
```

Presets:

| Name        | Color Mode | Offset           | Description                              |
| ----------- | ---------- | ---------------- | ---------------------------------------- |
| `cursor-01` | stroke     | `{x:0.15,y:0.1}` | Outlined tilted cursor                  |
| `cursor-02` | fill       | `{x:0.15,y:0.1}` | Filled arrow cursor with click indicator |
| `cursor-03` | stroke     | `{x:0.15,y:0.1}` | Outlined arrow cursor with click indicator |

## Rendering

In `packages/engine/src/cursor.ts`, the `applyCursorVisual` function gains a branch for
preset shapes:

1. Look up the preset from the registry.
2. Replace the SVG's stroke or fill attribute with the configured `color`.
3. Render like the existing `"svg"` shape.
4. Use the preset's default offset unless the user provides an explicit one.

## Color Application

- **stroke presets** (`cursor-01`, `cursor-03`): replace `stroke="..."` on the path.
- **fill presets** (`cursor-02`): replace `fill="..."` on the path.
- The configured `color` value is injected at render time.

## Documentation

- Update the `CursorConfig` table in `apps/docs/api/core.md` to list the new shape values.
- Add a visual reference for each preset (inline SVG in markdown) so users can see
  what each cursor looks like before choosing.

## What stays the same

- `color`, `size`, `shadow`, `clickColor`, `svgContent` fields unchanged.
- `"svg"` + `svgContent` still works for fully custom cursors.
- Step-level cursor overrides work exactly as before.
- Studio passes cursor config to the engine the same way.
