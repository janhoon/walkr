import { describe, expect, it } from "vitest";
import {
  click,
  clickCoords,
  highlight,
  hover,
  moveTo,
  moveToCoords,
  narrate,
  pan,
  scroll,
  tooltip,
  type,
  wait,
  waitForNavigation,
  waitForSelector,
  zoom,
} from "../steps.js";

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

describe("tooltip", () => {
  it("creates a tooltip step with selector and text", () => {
    const step = tooltip(".btn-primary", "Click this button");
    expect(step.type).toBe("tooltip");
    expect(step.options.selector).toBe(".btn-primary");
    expect(step.options.text).toBe("Click this button");
    expect(step.options.position).toBe("top");
    expect(step.duration).toBe(3000);
  });

  it("uses default duration of 3000ms", () => {
    const step = tooltip("#el", "Some text");
    expect(step.options.duration).toBe(3000);
    expect(step.duration).toBe(3000);
  });

  it("accepts a custom duration", () => {
    const step = tooltip("#el", "Some text", { duration: 5000 });
    expect(step.options.duration).toBe(5000);
    expect(step.duration).toBe(5000);
  });

  it("accepts a custom position", () => {
    const step = tooltip("#el", "Some text", { position: "bottom" });
    expect(step.options.position).toBe("bottom");
  });

  it("accepts left and right positions", () => {
    const left = tooltip("#el", "Left tip", { position: "left" });
    const right = tooltip("#el", "Right tip", { position: "right" });
    expect(left.options.position).toBe("left");
    expect(right.options.position).toBe("right");
  });

  it("accepts a title option", () => {
    const step = tooltip("#el", "Body text", { title: "Heading" });
    expect(step.options.title).toBe("Heading");
  });

  it("leaves title undefined when not provided", () => {
    const step = tooltip("#el", "Body text");
    expect(step.options.title).toBeUndefined();
  });

  it("generates unique IDs for each step", () => {
    const a = tooltip("#a", "text a");
    const b = tooltip("#b", "text b");
    expect(a.id).not.toBe(b.id);
  });

  it("passes cursor override through", () => {
    const step = tooltip("#el", "text", { cursor: { color: "#ff0000" } });
    expect(step.options.cursor).toEqual({ color: "#ff0000" });
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

describe("narrate", () => {
  it("creates a narrate step with src and defaults", () => {
    const step = narrate("/audio/intro.mp3");
    expect(step.type).toBe("narrate");
    expect(step.options.src).toBe("/audio/intro.mp3");
    expect(step.options.volume).toBe(1);
    expect(step.options.loop).toBe(false);
    expect(step.options.duration).toBeUndefined();
    expect(step.duration).toBe(0);
  });

  it("accepts a custom duration", () => {
    const step = narrate("/audio/intro.mp3", { duration: 5000 });
    expect(step.options.duration).toBe(5000);
    expect(step.duration).toBe(5000);
  });

  it("accepts a custom volume", () => {
    const step = narrate("/audio/intro.mp3", { volume: 0.5 });
    expect(step.options.volume).toBe(0.5);
  });

  it("accepts loop option", () => {
    const step = narrate("/audio/bg-music.mp3", { loop: true });
    expect(step.options.loop).toBe(true);
  });

  it("accepts all options together", () => {
    const step = narrate("https://cdn.example.com/narration.ogg", {
      duration: 10000,
      volume: 0.8,
      loop: true,
    });
    expect(step.options.src).toBe("https://cdn.example.com/narration.ogg");
    expect(step.options.duration).toBe(10000);
    expect(step.options.volume).toBe(0.8);
    expect(step.options.loop).toBe(true);
    expect(step.duration).toBe(10000);
  });

  it("generates unique IDs for each step", () => {
    const a = narrate("/audio/a.mp3");
    const b = narrate("/audio/b.mp3");
    expect(a.id).not.toBe(b.id);
  });

  it("uses 0 as step duration when no duration option is set", () => {
    const step = narrate("/audio/file.mp3");
    expect(step.duration).toBe(0);
  });
});

describe("hover", () => {
  it("creates a hover step with selector and default duration", () => {
    const step = hover("#menu-item");
    expect(step.type).toBe("hover");
    expect(step.options.selector).toBe("#menu-item");
    expect(step.options.duration).toBe(0);
    expect(step.duration).toBe(0);
  });

  it("accepts a custom duration", () => {
    const step = hover(".tooltip-trigger", { duration: 1500 });
    expect(step.options.duration).toBe(1500);
    expect(step.duration).toBe(1500);
  });

  it("creates a zero-duration hover step", () => {
    const step = hover("#btn", { duration: 0 });
    expect(step.options.duration).toBe(0);
    expect(step.duration).toBe(0);
  });

  it("passes cursor override through", () => {
    const step = hover("#el", { cursor: { color: "#ff0000" } });
    expect(step.options.cursor).toEqual({ color: "#ff0000" });
  });

  it("generates unique IDs for each step", () => {
    const a = hover("#a");
    const b = hover("#b");
    expect(a.id).not.toBe(b.id);
  });
});
