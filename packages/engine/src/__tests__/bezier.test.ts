import { describe, it, expect } from "vitest";
import {
  cubicBezier,
  linear,
  easeOut,
  easeInOut,
  createEasingFromCssCubicBezier,
} from "../bezier.js";

describe("cubicBezier (2D)", () => {
  const p0: [number, number] = [0, 0];
  const p3: [number, number] = [100, 200];

  it("returns the start point at t=0", () => {
    const result = cubicBezier(0, p0, [25, 50], [75, 150], p3);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
  });

  it("returns the end point at t=1", () => {
    const result = cubicBezier(1, p0, [25, 50], [75, 150], p3);
    expect(result[0]).toBeCloseTo(100);
    expect(result[1]).toBeCloseTo(200);
  });

  it("returns the midpoint for a straight line at t=0.5", () => {
    // Control points on the line from (0,0) to (100,100)
    const result = cubicBezier(
      0.5,
      [0, 0],
      [33.33, 33.33],
      [66.67, 66.67],
      [100, 100],
    );
    expect(result[0]).toBeCloseTo(50, 0);
    expect(result[1]).toBeCloseTo(50, 0);
  });

  it("clamps t below 0 to 0", () => {
    const result = cubicBezier(-0.5, p0, [25, 50], [75, 150], p3);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
  });

  it("clamps t above 1 to 1", () => {
    const result = cubicBezier(1.5, p0, [25, 50], [75, 150], p3);
    expect(result[0]).toBeCloseTo(100);
    expect(result[1]).toBeCloseTo(200);
  });

  it("produces values between start and end for t in (0,1)", () => {
    const result = cubicBezier(0.3, p0, [25, 50], [75, 150], p3);
    expect(result[0]).toBeGreaterThan(0);
    expect(result[0]).toBeLessThan(100);
    expect(result[1]).toBeGreaterThan(0);
    expect(result[1]).toBeLessThan(200);
  });
});

describe("easing functions (bezier y-component evaluation)", () => {
  // Note: These easings evaluate the y-component of a 2D bezier curve
  // at parameter t, NOT the CSS parametric model. Since linear, easeOut,
  // and easeInOut all share the same y control points (0, 0, 1, 1),
  // they all follow y(t) = 3t² - 2t³.

  it("linear returns 0 at t=0 and 1 at t=1", () => {
    expect(linear(0)).toBeCloseTo(0);
    expect(linear(1)).toBeCloseTo(1);
  });

  it("linear returns 0.5 at t=0.5", () => {
    // y(0.5) = 3*(0.25) - 2*(0.125) = 0.5
    expect(linear(0.5)).toBeCloseTo(0.5);
  });

  it("linear follows the cubic bezier curve y(t) = 3t² - 2t³", () => {
    // At t=0.25: y = 3*(0.0625) - 2*(0.015625) = 0.15625
    expect(linear(0.25)).toBeCloseTo(0.15625);
    // At t=0.75: y = 3*(0.5625) - 2*(0.421875) = 0.84375
    expect(linear(0.75)).toBeCloseTo(0.84375);
  });

  it("easeOut returns boundary values correctly", () => {
    expect(easeOut(0)).toBeCloseTo(0);
    expect(easeOut(1)).toBeCloseTo(1);
    expect(easeOut(0.5)).toBeCloseTo(0.5);
  });

  it("easeInOut is symmetric around 0.5", () => {
    expect(easeInOut(0)).toBeCloseTo(0);
    expect(easeInOut(1)).toBeCloseTo(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    // Symmetry: easeInOut(t) + easeInOut(1-t) ≈ 1
    expect(easeInOut(0.3) + easeInOut(0.7)).toBeCloseTo(1);
  });

  it("all easings are monotonically increasing", () => {
    for (const fn of [linear, easeOut, easeInOut]) {
      let prev = fn(0);
      for (let t = 0.1; t <= 1.0; t += 0.1) {
        const curr = fn(t);
        expect(curr).toBeGreaterThanOrEqual(prev);
        prev = curr;
      }
    }
  });
});

describe("createEasingFromCssCubicBezier", () => {
  it("parses a valid cubic-bezier CSS string", () => {
    const fn = createEasingFromCssCubicBezier("cubic-bezier(0.42, 0, 0.58, 1)");
    expect(fn).not.toBeNull();
    expect(fn!(0)).toBeCloseTo(0);
    expect(fn!(1)).toBeCloseTo(1);
  });

  it("returns null for an invalid string", () => {
    expect(createEasingFromCssCubicBezier("ease-in-out")).toBeNull();
    expect(createEasingFromCssCubicBezier("not-a-bezier")).toBeNull();
    expect(createEasingFromCssCubicBezier("")).toBeNull();
  });

  it("handles negative control point values", () => {
    const fn = createEasingFromCssCubicBezier("cubic-bezier(0.5, -0.5, 0.5, 1.5)");
    expect(fn).not.toBeNull();
    expect(fn!(0)).toBeCloseTo(0);
    expect(fn!(1)).toBeCloseTo(1);
  });
});
