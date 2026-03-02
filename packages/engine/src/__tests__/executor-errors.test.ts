/**
 * @vitest-environment jsdom
 *
 * Tests for step error reporting and debug mode in executeStep.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeStep } from "../executor.js";
import { StepError } from "../types.js";
import type { Step, MoveToStep, ClickStep, HighlightStep, TypeStep } from "../types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function moveToStep(selector: string): MoveToStep {
  return {
    id: "s1",
    type: "moveTo",
    options: { selector },
    duration: 0,
  };
}

function clickStep(selector: string): ClickStep {
  return {
    id: "s2",
    type: "click",
    options: { selector },
    duration: 0,
  };
}

function highlightStep(selector: string): HighlightStep {
  return {
    id: "s3",
    type: "highlight",
    options: { selector },
    duration: 0,
  };
}

function typeStep(selector: string, text: string): TypeStep {
  return {
    id: "s4",
    type: "type",
    options: { selector, text },
    duration: 0,
  };
}

let iframe: HTMLIFrameElement;
let cursor: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = "";
  iframe = makeIframe();
  cursor = makeCursor();
});

// ---------------------------------------------------------------------------
// Error reporting — selector not found
// ---------------------------------------------------------------------------

describe("executeStep error reporting", () => {
  it("moveTo returns error result when selector not found", async () => {
    const result = await executeStep(moveToStep(".missing"), cursor, iframe);
    expect(result.status).toBe("error");
    expect(result.stepType).toBe("moveTo");
    expect(result.selector).toBe(".missing");
    expect(result.error).toBeInstanceOf(StepError);
    expect(result.error?.reason).toBe("not-found");
  });

  it("click returns error result when selector not found", async () => {
    const result = await executeStep(clickStep(".missing"), cursor, iframe);
    expect(result.status).toBe("error");
    expect(result.stepType).toBe("click");
    expect(result.error).toBeInstanceOf(StepError);
    expect(result.error?.reason).toBe("not-found");
  });

  it("highlight returns error result when selector not found", async () => {
    const result = await executeStep(highlightStep(".missing"), cursor, iframe);
    expect(result.status).toBe("error");
    expect(result.stepType).toBe("highlight");
    expect(result.error).toBeInstanceOf(StepError);
    expect(result.error?.reason).toBe("not-found");
  });

  it("type returns error result when explicit selector not found", async () => {
    const result = await executeStep(typeStep(".missing", "hello"), cursor, iframe);
    expect(result.status).toBe("error");
    expect(result.stepType).toBe("type");
    expect(result.error).toBeInstanceOf(StepError);
    expect(result.error?.reason).toBe("not-found");
  });

  it("wait step succeeds (no selector)", async () => {
    const result = await executeStep(
      { id: "w1", type: "wait", options: { ms: 0 }, duration: 0 } as Step,
      cursor,
      iframe,
    );
    expect(result.status).toBe("ok");
    expect(result.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// onStepError callback
// ---------------------------------------------------------------------------

describe("onStepError callback", () => {
  it("is called when a step errors", async () => {
    const onStepError = vi.fn();

    await executeStep(moveToStep(".nope"), cursor, iframe, { onStepError });

    expect(onStepError).toHaveBeenCalledOnce();
    const [error, step] = onStepError.mock.calls[0];
    expect(error).toBeInstanceOf(StepError);
    expect(error.reason).toBe("not-found");
    expect(step.type).toBe("moveTo");
  });

  it("is NOT called when a step succeeds", async () => {
    const onStepError = vi.fn();

    await executeStep(
      { id: "w1", type: "wait", options: { ms: 0 }, duration: 0 } as Step,
      cursor,
      iframe,
      { onStepError },
    );

    expect(onStepError).not.toHaveBeenCalled();
  });

  it("is called for each failing child in a sequence", async () => {
    const onStepError = vi.fn();

    const sequenceStep: Step = {
      id: "seq1",
      type: "sequence",
      options: {
        steps: [moveToStep(".a"), moveToStep(".b")],
      },
      duration: 0,
    };

    await executeStep(sequenceStep, cursor, iframe, { onStepError });

    expect(onStepError).toHaveBeenCalledTimes(2);
  });

  it("is called for each failing child in a parallel", async () => {
    const onStepError = vi.fn();

    const parallelStep: Step = {
      id: "par1",
      type: "parallel",
      options: {
        steps: [clickStep(".x"), highlightStep(".y")],
      },
      duration: 0,
    };

    await executeStep(parallelStep, cursor, iframe, { onStepError });

    expect(onStepError).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Debug logging
// ---------------------------------------------------------------------------

describe("debug mode", () => {
  it("logs step info on success when debug=true", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await executeStep(
      { id: "w1", type: "wait", options: { ms: 0 }, duration: 0 } as Step,
      cursor,
      iframe,
      { debug: true },
    );

    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("[walkr:debug]");
    expect(msg).toContain("step=wait");
    expect(msg).toContain("result=ok");
    spy.mockRestore();
  });

  it("logs step info on error when debug=true", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await executeStep(moveToStep(".missing"), cursor, iframe, { debug: true });

    expect(spy).toHaveBeenCalledOnce();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain("[walkr:debug]");
    expect(msg).toContain("step=moveTo");
    expect(msg).toContain(".missing");
    expect(msg).toContain("not-found");
    spy.mockRestore();
  });

  it("does NOT log when debug is not set", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await executeStep(
      { id: "w1", type: "wait", options: { ms: 0 }, duration: 0 } as Step,
      cursor,
      iframe,
    );

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// StepResult shape
// ---------------------------------------------------------------------------

describe("StepResult", () => {
  it("includes durationMs >= 0", async () => {
    const result = await executeStep(
      { id: "w1", type: "wait", options: { ms: 0 }, duration: 0 } as Step,
      cursor,
      iframe,
    );
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("includes the step type for both ok and error", async () => {
    const ok = await executeStep(
      { id: "w1", type: "wait", options: { ms: 0 }, duration: 0 } as Step,
      cursor,
      iframe,
    );
    expect(ok.stepType).toBe("wait");

    const err = await executeStep(moveToStep(".x"), cursor, iframe);
    expect(err.stepType).toBe("moveTo");
  });

  it("includes selector when step has one", async () => {
    const result = await executeStep(moveToStep(".target"), cursor, iframe);
    expect(result.selector).toBe(".target");
  });

  it("selector is undefined for steps without one", async () => {
    const result = await executeStep(
      { id: "w1", type: "wait", options: { ms: 0 }, duration: 0 } as Step,
      cursor,
      iframe,
    );
    expect(result.selector).toBeUndefined();
  });
});
