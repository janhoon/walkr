import { describe, it, expect } from "vitest";
import { moveTo, moveToCoords, click, clickCoords, type, scroll, wait, waitForSelector, waitForNavigation, highlight, zoom, pan } from "../steps.js";

describe("moveTo (selector)", () => {
  it("creates a moveTo step with a selector", () => {
    const step = moveTo("#button");
    expect(step.type).toBe("moveTo");
    expect(step.options.selector).toBe("#button");
    expect(step.duration).toBe(0);
  });

  it("accepts a custom duration", () => {
    const step = moveTo("#el", { duration: 500 });
    expect(step.duration).toBe(500);
  });

  it("generates unique IDs for each step", () => {
    const a = moveTo("#a");
    const b = moveTo("#b");
    expect(a.id).not.toBe(b.id);
  });
});

describe("moveToCoords", () => {
  it("creates a moveToCoords step with coordinates", () => {
    const step = moveToCoords(100, 200);
    expect(step.type).toBe("moveToCoords");
    expect(step.options.x).toBe(100);
    expect(step.options.y).toBe(200);
    expect(step.duration).toBe(0);
  });

  it("accepts a custom duration", () => {
    const step = moveToCoords(50, 75, { duration: 500 });
    expect(step.duration).toBe(500);
  });
});

describe("click (selector)", () => {
  it("creates a click step with default options", () => {
    const step = click("#btn");
    expect(step.type).toBe("click");
    expect(step.options.selector).toBe("#btn");
    expect(step.options.button).toBe("left");
    expect(step.options.double).toBe(false);
  });

  it("supports right-click and double-click", () => {
    const step = click("#btn", { button: "right", double: true });
    expect(step.options.button).toBe("right");
    expect(step.options.double).toBe(true);
  });
});

describe("clickCoords", () => {
  it("creates a clickCoords step", () => {
    const step = clickCoords(50, 100);
    expect(step.type).toBe("clickCoords");
    expect(step.options.x).toBe(50);
    expect(step.options.y).toBe(100);
    expect(step.options.button).toBe("left");
    expect(step.options.double).toBe(false);
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

describe("waitForSelector", () => {
  it("creates a waitForSelector step with a selector and defaults", () => {
    const step = waitForSelector("#loading-spinner");
    expect(step.type).toBe("waitForSelector");
    expect(step.options.selector).toBe("#loading-spinner");
    expect(step.options.timeout).toBe(5000);
    expect(step.options.visible).toBeUndefined();
    expect(step.duration).toBe(5000);
  });

  it("accepts a custom timeout", () => {
    const step = waitForSelector(".modal", { timeout: 10000 });
    expect(step.options.timeout).toBe(10000);
    expect(step.duration).toBe(10000);
  });

  it("accepts visible option", () => {
    const step = waitForSelector("[data-ready]", { visible: true });
    expect(step.options.visible).toBe(true);
  });

  it("generates unique IDs", () => {
    const a = waitForSelector("#a");
    const b = waitForSelector("#b");
    expect(a.id).not.toBe(b.id);
  });
});

describe("waitForNavigation", () => {
  it("creates a waitForNavigation step with defaults", () => {
    const step = waitForNavigation();
    expect(step.type).toBe("waitForNavigation");
    expect(step.options.timeout).toBe(5000);
    expect(step.options.waitUntil).toBe("load");
    expect(step.duration).toBe(5000);
  });

  it("accepts a custom timeout", () => {
    const step = waitForNavigation({ timeout: 15000 });
    expect(step.options.timeout).toBe(15000);
    expect(step.duration).toBe(15000);
  });

  it("accepts waitUntil option", () => {
    const step = waitForNavigation({ waitUntil: "domcontentloaded" });
    expect(step.options.waitUntil).toBe("domcontentloaded");
  });

  it("accepts networkidle waitUntil", () => {
    const step = waitForNavigation({ waitUntil: "networkidle" });
    expect(step.options.waitUntil).toBe("networkidle");
  });

  it("generates unique IDs", () => {
    const a = waitForNavigation();
    const b = waitForNavigation();
    expect(a.id).not.toBe(b.id);
  });
});
