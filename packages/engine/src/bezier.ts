export type Point = [number, number];
export type EasingFunction = (t: number) => number;

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function cubicBezier(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Point {
  const clampedT = clamp(t);
  const oneMinusT = 1 - clampedT;
  const oneMinusTSquared = oneMinusT * oneMinusT;
  const oneMinusTCubed = oneMinusTSquared * oneMinusT;
  const tSquared = clampedT * clampedT;
  const tCubed = tSquared * clampedT;

  const x =
    oneMinusTCubed * p0[0] +
    3 * oneMinusTSquared * clampedT * p1[0] +
    3 * oneMinusT * tSquared * p2[0] +
    tCubed * p3[0];
  const y =
    oneMinusTCubed * p0[1] +
    3 * oneMinusTSquared * clampedT * p1[1] +
    3 * oneMinusT * tSquared * p2[1] +
    tCubed * p3[1];

  return [x, y];
}

function easingFromControlPoints(
  p1: Point,
  p2: Point,
  p0: Point = [0, 0],
  p3: Point = [1, 1],
): EasingFunction {
  return (t: number): number => {
    return cubicBezier(t, p0, p1, p2, p3)[1];
  };
}

export const linear = easingFromControlPoints([0, 0], [1, 1]);
export const easeOut = easingFromControlPoints([0, 0], [0.58, 1]);
export const easeInOut = easingFromControlPoints([0.42, 0], [0.58, 1]);

export function createEasingFromCssCubicBezier(value: string): EasingFunction | null {
  const match = value.match(
    /^cubic-bezier\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/,
  );

  if (!match) {
    return null;
  }

  const [, x1, y1, x2, y2] = match;
  return easingFromControlPoints([Number(x1), Number(y1)], [Number(x2), Number(y2)]);
}
