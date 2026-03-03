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
