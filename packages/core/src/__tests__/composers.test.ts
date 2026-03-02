import { describe, it, expect } from "vitest";
import { sequence, parallel } from "../composers.js";
import { wait, moveToCoords, clickCoords } from "../steps.js";

describe("sequence", () => {
  it("sums the durations of all child steps", () => {
    const step = sequence(wait(100), wait(200), wait(300));
    expect(step.type).toBe("sequence");
    expect(step.duration).toBe(600);
  });

  it("stores child steps in order", () => {
    const a = wait(10);
    const b = wait(20);
    const step = sequence(a, b);
    expect(step.options.steps).toHaveLength(2);
    expect(step.options.steps[0].id).toBe(a.id);
    expect(step.options.steps[1].id).toBe(b.id);
  });

  it("handles an empty sequence with 0 duration", () => {
    const step = sequence();
    expect(step.duration).toBe(0);
    expect(step.options.steps).toHaveLength(0);
  });

  it("handles mixed step types", () => {
    const step = sequence(
      moveToCoords(0, 0, { duration: 200 }),
      wait(500),
      clickCoords(100, 100),
    );
    // moveToCoords(200) + wait(500) + clickCoords(50) = 750
    expect(step.duration).toBe(750);
  });
});

describe("parallel", () => {
  it("uses the maximum duration of child steps", () => {
    const step = parallel(wait(100), wait(300), wait(200));
    expect(step.type).toBe("parallel");
    expect(step.duration).toBe(300);
  });

  it("handles an empty parallel with 0 duration", () => {
    const step = parallel();
    expect(step.duration).toBe(0);
    expect(step.options.steps).toHaveLength(0);
  });

  it("handles uniform-duration steps", () => {
    // clickCoords has DEFAULT_CLICK_DURATION = 50
    const step = parallel(clickCoords(0, 0), clickCoords(10, 10));
    expect(step.duration).toBe(50);
  });
});
