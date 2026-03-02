import { describe, it, expect } from "vitest";
import { moveTo, click, type, scroll, wait, highlight, zoom, pan } from "../steps.js";

describe("moveTo", () => {
  it("creates a moveTo step with coordinates", () => {
    const step = moveTo(100, 200);
    expect(step.type).toBe("moveTo");
    expect(step.options.x).toBe(100);
    expect(step.options.y).toBe(200);
    expect(step.duration).toBe(0);
  });

  it("accepts a custom duration", () => {
    const step = moveTo(50, 75, { duration: 500 });
    expect(step.options.duration).toBe(500);
    expect(step.duration).toBe(500);
  });

  it("generates unique IDs for each step", () => {
    const a = moveTo(0, 0);
    const b = moveTo(10, 10);
    expect(a.id).not.toBe(b.id);
  });
});

describe("click", () => {
  it("creates a click step with default options", () => {
    const step = click(50, 100);
    expect(step.type).toBe("click");
    expect(step.options.x).toBe(50);
    expect(step.options.y).toBe(100);
    expect(step.options.button).toBe("left");
    expect(step.options.double).toBe(false);
    expect(step.duration).toBe(0);
  });

  it("supports right-click and double-click", () => {
    const step = click(0, 0, { button: "right", double: true });
    expect(step.options.button).toBe("right");
    expect(step.options.double).toBe(true);
  });
});

describe("type", () => {
  it("creates a type step with text", () => {
    const step = type("hello");
    expect(step.type).toBe("type");
    expect(step.options.text).toBe("hello");
  });

  it("computes duration from text length and delay", () => {
    const step = type("hello", { delay: 50 });
    // "hello" = 5 chars × 50ms = 250ms
    expect(step.duration).toBe(250);
  });

  it("defaults to 0 duration with no delay", () => {
    const step = type("world");
    expect(step.duration).toBe(0);
  });
});

describe("wait", () => {
  it("creates a wait step with the given duration", () => {
    const step = wait(1000);
    expect(step.type).toBe("wait");
    expect(step.options.ms).toBe(1000);
    expect(step.duration).toBe(1000);
  });
});

describe("highlight", () => {
  it("creates a highlight step with selector", () => {
    const step = highlight(".btn-primary");
    expect(step.type).toBe("highlight");
    expect(step.options.selector).toBe(".btn-primary");
    expect(step.duration).toBe(0);
  });

  it("accepts custom duration and color", () => {
    const step = highlight("#nav", { duration: 500, color: "#ff0000" });
    expect(step.options.color).toBe("#ff0000");
    expect(step.options.duration).toBe(500);
    expect(step.duration).toBe(500);
  });

  it("passes spotlight and padding options through", () => {
    const step = highlight(".card", {
      spotlight: true,
      backdropOpacity: 0.8,
      padding: 16,
      borderRadius: 12,
    });
    expect(step.options.spotlight).toBe(true);
    expect(step.options.backdropOpacity).toBe(0.8);
    expect(step.options.padding).toBe(16);
    expect(step.options.borderRadius).toBe(12);
  });
});

describe("zoom", () => {
  it("creates a zoom step with level and default duration", () => {
    const step = zoom(2);
    expect(step.type).toBe("zoom");
    expect(step.options.level).toBe(2);
    // Default zoom duration is 360
    expect(step.duration).toBe(360);
  });

  it("applies default easing", () => {
    const step = zoom(1.5);
    expect(step.options.easing).toBe("cubic-bezier(0.42, 0, 0.58, 1)");
  });
});

describe("pan", () => {
  it("creates a pan step with coordinates", () => {
    const step = pan(100, -50);
    expect(step.type).toBe("pan");
    expect(step.options.x).toBe(100);
    expect(step.options.y).toBe(-50);
  });

  it("uses the default pan duration of 360", () => {
    const step = pan(0, 0);
    expect(step.duration).toBe(360);
  });

  it("allows custom duration override", () => {
    const step = pan(0, 0, { duration: 1000 });
    expect(step.options.duration).toBe(1000);
    expect(step.duration).toBe(1000);
  });
});

describe("scroll", () => {
  it("creates a scroll step", () => {
    const step = scroll(0, 500);
    expect(step.type).toBe("scroll");
    expect(step.options.x).toBe(0);
    expect(step.options.y).toBe(500);
    expect(step.duration).toBe(0);
  });
});
