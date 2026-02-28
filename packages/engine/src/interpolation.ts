/**
 * Cubic bezier interpolation between four control points.
 */
export function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return mt2 * mt * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t2 * t * p3;
}

function makeCubicBezierEasing(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  function sampleX(t: number): number {
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleY(t: number): number {
    return ((ay * t + by) * t + cy) * t;
  }

  function sampleDerivX(t: number): number {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  function solveForT(x: number): number {
    // Newton-Raphson iteration
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x;
      if (Math.abs(dx) < 1e-7) return t;
      const deriv = sampleDerivX(t);
      if (Math.abs(deriv) < 1e-7) break;
      t -= dx / deriv;
    }
    // Binary search fallback
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const midX = sampleX(mid);
      if (Math.abs(midX - x) < 1e-7) return mid;
      if (midX < x) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleY(solveForT(x));
  };
}

const EASINGS: Record<string, (t: number) => number> = {
  linear: (t: number) => t,
  ease: makeCubicBezierEasing(0.25, 0.1, 0.25, 1),
  "ease-in": makeCubicBezierEasing(0.42, 0, 1, 1),
  "ease-out": makeCubicBezierEasing(0, 0, 0.58, 1),
  "ease-in-out": makeCubicBezierEasing(0.42, 0, 0.58, 1),
};

/**
 * Get an easing function by name.
 * Supports: 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'.
 * Falls back to 'ease' for unknown names.
 */
export function getEasingFunction(easing: string): (t: number) => number {
  return EASINGS[easing] ?? EASINGS.ease;
}

/**
 * Interpolate between two points with easing.
 * Returns current position given progress t (0–1).
 */
export function interpolatePosition(
  from: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
  easing: string = "ease",
): { x: number; y: number } {
  const easeFn = getEasingFunction(easing);
  const et = easeFn(t);
  return {
    x: from.x + (to.x - from.x) * et,
    y: from.y + (to.y - from.y) * et,
  };
}
