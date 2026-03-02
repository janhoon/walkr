import { describe, it, expect } from "vitest";
import {
  cubicBezier,
  getEasingFunction,
  interpolatePosition,
} from "../interpolation.js";

describe("cubicBezier (1D)", () => {
  it("returns p0 at t=0", () => {
    expect(cubicBezier(0, 10, 20, 30, 0)).toBeCloseTo(0);
  });

  it("returns p3 at t=1", () => {
    expect(cubicBezier(0, 10, 20, 30, 1)).toBeCloseTo(30);
  });

  it("returns the midpoint for evenly spaced control points at t=0.5", () => {
    // For evenly spaced points 0,10,20,30, the curve is a straight line
    const result = cubicBezier(0, 10, 20, 30, 0.5);
    expect(result).toBeCloseTo(15, 0);
  });
});

describe("getEasingFunction", () => {
  it("returns the linear easing for 'linear'", () => {
    const fn = getEasingFunction("linear");
    expect(fn(0)).toBe(0);
    expect(fn(0.5)).toBeCloseTo(0.5);
    expect(fn(1)).toBe(1);
  });

  it("returns ease-out for 'ease-out'", () => {
    const fn = getEasingFunction("ease-out");
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
    // ease-out should be ahead of linear at t=0.5
    expect(fn(0.5)).toBeGreaterThan(0.5);
  });

  it("returns ease-in-out for 'ease-in-out'", () => {
    const fn = getEasingFunction("ease-in-out");
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
    expect(fn(0.5)).toBeCloseTo(0.5, 1);
  });

  it("falls back to 'ease' for unknown names", () => {
    const easeDefault = getEasingFunction("ease");
    const unknown = getEasingFunction("nonexistent");
    // Both should produce the same results
    expect(unknown(0.3)).toBeCloseTo(easeDefault(0.3));
    expect(unknown(0.7)).toBeCloseTo(easeDefault(0.7));
  });
});

describe("interpolatePosition", () => {
  const from = { x: 0, y: 0 };
  const to = { x: 100, y: 200 };

  it("returns the start position at t=0", () => {
    const pos = interpolatePosition(from, to, 0);
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(0);
  });

  it("returns the end position at t=1", () => {
    const pos = interpolatePosition(from, to, 1);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(200);
  });

  it("returns the midpoint for linear easing at t=0.5", () => {
    const pos = interpolatePosition(from, to, 0.5, "linear");
    expect(pos.x).toBeCloseTo(50);
    expect(pos.y).toBeCloseTo(100);
  });

  it("respects the easing function", () => {
    // With ease-out, position at t=0.5 should be ahead of linear
    const pos = interpolatePosition(from, to, 0.5, "ease-out");
    expect(pos.x).toBeGreaterThan(50);
    expect(pos.y).toBeGreaterThan(100);
  });
});
