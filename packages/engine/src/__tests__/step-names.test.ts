/**
 * @vitest-environment jsdom
 *
 * Tests for step name propagation in executeStep results, debug logging, and StepError messages.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeStep } from "../executor.js";
import type { ClickStep, MoveToStep, Step } from "../types.js";
import { StepError } from "../types.js";

function makeIframe(): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  return iframe;
}

function makeCursor(): HTMLElement {
  const cursor = document.createElement("div");
  cursor.dataset.walkrCursorX = "0";
  cursor.dataset.walkrCursorY = "0";
  document.body.appendChild(cursor);
  return cursor;
}

function namedMoveToStep(selector: string, name: string): MoveToStep {
  return {
    id: "s1",
    type: "moveTo",
    options: { selector },
    duration: 0,
    name,
  };
}

function namedClickStep(selector: string, name: string): ClickStep {
  return {
    id: "s2",
    type: "click",
    options: { selector },
    duration: 0,
    name,
  };
}

let iframe: HTMLIFrameElement;
let cursor: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = "";
  iframe = makeIframe();
  cursor = makeCursor();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("step name in StepResult", () => {
  it("includes stepName in successful result", async () => {
    const step: Step = {
      id: "w1",
      type: "wait",
      options: { ms: 0 },
      duration: 0,
      name: "Pause briefly",
    };
    const result = await executeStep(step, cursor, iframe);
    expect(result.status).toBe("ok");
    expect(result.stepName).toBe("Pause briefly");
  });

  it("includes stepName in error result", async () => {
    const step = namedMoveToStep(".missing", "Navigate to settings");
    const result = await executeStep(step, cursor, iframe);
    expect(result.status).toBe("error");
    expect(result.stepName).toBe("Navigate to settings");
  });

  it("stepName is undefined when step has no name", async () => {
    const step: Step = {
      id: "w1",
      type: "wait",
      options: { ms: 0 },
      duration: 0,
    };
    const result = await executeStep(step, cursor, iframe);
    expect(result.stepName).toBeUndefined();
  });
});

describe("step name in debug logging", () => {
  it("includes name in debug log for named step (success)", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const step: Step = {
      id: "w1",
      type: "wait",
      options: { ms: 0 },
      duration: 0,
      name: "Wait for animation",
    };
    await executeStep(step, cursor, iframe, { debug: true });

    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('name="Wait for animation"');
    expect(msg).toContain("result=ok");
    spy.mockRestore();
  });

  it("includes name in debug log for named step (error)", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const step = namedMoveToStep(".missing", "Open settings menu");
    await executeStep(step, cursor, iframe, { debug: true });

    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('name="Open settings menu"');
    expect(msg).toContain("not-found");
    spy.mockRestore();
  });

  it("does not include name label for unnamed step", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const step: Step = {
      id: "w1",
      type: "wait",
      options: { ms: 0 },
      duration: 0,
    };
    await executeStep(step, cursor, iframe, { debug: true });

    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).not.toContain("name=");
    spy.mockRestore();
  });
});

describe("StepError with step name", () => {
  it("includes step name in error message", () => {
    const err = new StepError({
      stepType: "click",
      selector: "#settings",
      reason: "not-found",
      stepName: "Open settings menu",
    });
    expect(err.message).toContain("Open settings menu");
    expect(err.message).toContain("click");
    expect(err.message).toContain("#settings");
    expect(err.stepName).toBe("Open settings menu");
  });

  it("error message works without step name", () => {
    const err = new StepError({
      stepType: "click",
      selector: "#btn",
      reason: "not-found",
    });
    expect(err.stepName).toBeUndefined();
    expect(err.message).toContain("click");
    expect(err.message).toContain("#btn");
    expect(err.message).not.toContain("undefined");
  });

  it("custom message overrides generated message even with step name", () => {
    const err = new StepError({
      stepType: "click",
      selector: "#btn",
      reason: "not-found",
      stepName: "Click save",
      message: "Custom error message",
    });
    expect(err.message).toBe("Custom error message");
    expect(err.stepName).toBe("Click save");
  });
});

describe("step name in onStepError callback", () => {
  it("passes named step to onStepError", async () => {
    const onStepError = vi.fn();
    const step = namedClickStep(".nope", "Save changes");

    await executeStep(step, cursor, iframe, { onStepError });

    expect(onStepError).toHaveBeenCalledOnce();
    const [error, failedStep] = onStepError.mock.calls[0];
    expect(error).toBeInstanceOf(StepError);
    expect(failedStep.name).toBe("Save changes");
  });
});

describe("fallback to step type when unnamed", () => {
  it("unnamed step result has no stepName", async () => {
    const step: Step = {
      id: "w1",
      type: "wait",
      options: { ms: 0 },
      duration: 0,
    };
    const result = await executeStep(step, cursor, iframe);
    expect(result.stepName).toBeUndefined();
    expect(result.stepType).toBe("wait");
  });
});
