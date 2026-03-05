import { beforeEach, describe, expect, it } from "vitest";
import { walkr } from "../index.js";
import {
  clearCache,
  click,
  clickCoords,
  drag,
  highlight,
  hover,
  moveTo,
  moveToCoords,
  narrate,
  pan,
  resetStepCounters,
  scroll,
  tooltip,
  type,
  wait,
  waitForNavigation,
  waitForSelector,
  zoom,
} from "../steps.js";

beforeEach(() => {
  resetStepCounters();
});

describe("step name — builder functions", () => {
  it("moveTo accepts a name option", () => {
    const step = moveTo("#btn", { name: "Navigate to button" });
    expect(step.name).toBe("Navigate to button");
  });

  it("moveToCoords accepts a name option", () => {
    const step = moveToCoords(100, 200, { name: "Go to coords" });
    expect(step.name).toBe("Go to coords");
  });

  it("click accepts a name option", () => {
    const step = click("#btn", { name: "Click submit" });
    expect(step.name).toBe("Click submit");
  });

  it("click preserves cursor option alongside name", () => {
    const cursorOverride = { size: 32 } as const;
    const step = click("#btn", { name: "Click submit", cursor: cursorOverride });
    expect(step.name).toBe("Click submit");
    expect(step.options.cursor).toEqual(cursorOverride);
  });

  it("clickCoords accepts a name option", () => {
    const step = clickCoords(50, 75, { name: "Click at position" });
    expect(step.name).toBe("Click at position");
  });

  it("clickCoords preserves cursor option alongside name", () => {
    const cursorOverride = { size: 24 } as const;
    const step = clickCoords(50, 75, { name: "Click at position", cursor: cursorOverride });
    expect(step.name).toBe("Click at position");
    expect(step.options.cursor).toEqual(cursorOverride);
  });

  it("type accepts a name option", () => {
    const step = type("hello", { name: "Enter greeting" });
    expect(step.name).toBe("Enter greeting");
  });

  it("scroll accepts a name option", () => {
    const step = scroll(0, 500, { name: "Scroll to content" });
    expect(step.name).toBe("Scroll to content");
  });

  it("wait accepts a name option", () => {
    const step = wait(1000, { name: "Wait for animation" });
    expect(step.name).toBe("Wait for animation");
  });

  it("waitForSelector accepts a name option", () => {
    const step = waitForSelector("#modal", { name: "Wait for modal" });
    expect(step.name).toBe("Wait for modal");
  });

  it("waitForNavigation accepts a name option", () => {
    const step = waitForNavigation({ name: "Wait for page load" });
    expect(step.name).toBe("Wait for page load");
  });

  it("highlight accepts a name option", () => {
    const step = highlight("#card", { name: "Spotlight feature" });
    expect(step.name).toBe("Spotlight feature");
  });

  it("tooltip accepts a name option", () => {
    const step = tooltip("#help", "Click here", { name: "Show help tip" });
    expect(step.name).toBe("Show help tip");
  });

  it("narrate accepts a name option", () => {
    const step = narrate("/audio/intro.mp3", { name: "Intro narration" });
    expect(step.name).toBe("Intro narration");
  });

  it("zoom accepts a name option", () => {
    const step = zoom(2, { name: "Zoom into detail" });
    expect(step.name).toBe("Zoom into detail");
  });

  it("pan accepts a name option", () => {
    const step = pan(100, -50, { name: "Pan to sidebar" });
    expect(step.name).toBe("Pan to sidebar");
  });

  it("clearCache accepts a name option", () => {
    const step = clearCache({ name: "Reset browser state" });
    expect(step.name).toBe("Reset browser state");
  });

  it("drag accepts a name option", () => {
    const step = drag({ selector: "#item" }, { selector: "#zone" }, { name: "Drag item to zone" });
    expect(step.name).toBe("Drag item to zone");
  });

  it("hover accepts a name option", () => {
    const step = hover("#menu", { name: "Hover over menu" });
    expect(step.name).toBe("Hover over menu");
  });
});

describe("step name — unnamed steps", () => {
  it("name is undefined when not provided", () => {
    const step = click("#btn");
    expect(step.name).toBeUndefined();
  });

  it("name is undefined for wait without options", () => {
    const step = wait(500);
    expect(step.name).toBeUndefined();
  });

  it("name is undefined for clearCache without options", () => {
    const step = clearCache();
    expect(step.name).toBeUndefined();
  });
});

describe("step name — serialisation", () => {
  it("named step serialises name to JSON", () => {
    const step = click("#btn", { name: "Save changes" });
    const json = JSON.parse(JSON.stringify(step));
    expect(json.name).toBe("Save changes");
    expect(json.type).toBe("click");
    expect(json.options.selector).toBe("#btn");
  });

  it("unnamed step does not include name in JSON", () => {
    const step = click("#btn");
    const json = JSON.parse(JSON.stringify(step));
    expect(json).not.toHaveProperty("name");
  });

  it("walkthrough with named steps round-trips through JSON", () => {
    const wt = walkr({
      url: "https://example.com",
      steps: [
        moveTo("#settings", { name: "Open settings menu", duration: 400 }),
        click("#save-btn", { name: "Save changes" }),
        wait(1000, { name: "Wait for animation" }),
      ],
    });

    const json = JSON.parse(JSON.stringify(wt));
    expect(json.steps[0].name).toBe("Open settings menu");
    expect(json.steps[1].name).toBe("Save changes");
    expect(json.steps[2].name).toBe("Wait for animation");
  });
});

describe("step name — does not leak into options", () => {
  it("name is not in step.options", () => {
    const step = click("#btn", { name: "Click it" });
    expect((step.options as unknown as Record<string, unknown>).name).toBeUndefined();
  });

  it("name is not in moveTo step.options", () => {
    const step = moveTo("#el", { name: "Go there", duration: 300 });
    expect((step.options as unknown as Record<string, unknown>).name).toBeUndefined();
  });

  it("name is not in wait step.options", () => {
    const step = wait(500, { name: "Pause" });
    expect((step.options as unknown as Record<string, unknown>).name).toBeUndefined();
  });
});
