import { describe, it, expect, vi } from "vitest";
import { StepError } from "../types.js";
import type { StepResult, StepErrorReason } from "../types.js";
import type { Step, MoveToStep, ClickStep, HighlightStep, TypeStep, WaitForSelectorStep } from "../types.js";

describe("StepError", () => {
  it("creates an error with default message", () => {
    const err = new StepError({
      stepType: "click",
      selector: ".btn",
      reason: "not-found",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(StepError);
    expect(err.name).toBe("StepError");
    expect(err.stepType).toBe("click");
    expect(err.selector).toBe(".btn");
    expect(err.reason).toBe("not-found");
    expect(err.message).toContain("click");
    expect(err.message).toContain(".btn");
    expect(err.message).toContain("not-found");
  });

  it("creates an error with custom message", () => {
    const err = new StepError({
      stepType: "waitForSelector",
      selector: "#modal",
      reason: "timeout",
      message: "Custom timeout message",
    });
    expect(err.message).toBe("Custom timeout message");
    expect(err.stepType).toBe("waitForSelector");
    expect(err.reason).toBe("timeout");
  });

  it("creates an error without selector", () => {
    const err = new StepError({
      stepType: "moveTo",
      reason: "no-document",
    });
    expect(err.selector).toBeUndefined();
    expect(err.reason).toBe("no-document");
    expect(err.message).toContain("moveTo");
  });

  it("preserves the error stack trace", () => {
    const err = new StepError({
      stepType: "highlight",
      selector: ".target",
      reason: "not-found",
    });
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("StepError");
  });

  it("supports all reason types", () => {
    const reasons: StepErrorReason[] = ["not-found", "timeout", "no-document"];
    for (const reason of reasons) {
      const err = new StepError({ stepType: "click", reason });
      expect(err.reason).toBe(reason);
    }
  });
});

describe("StepResult type", () => {
  it("ok result has expected shape", () => {
    const result: StepResult = {
      status: "ok",
      stepType: "click",
      selector: ".btn",
      durationMs: 120.5,
    };
    expect(result.status).toBe("ok");
    expect(result.error).toBeUndefined();
  });

  it("error result includes StepError", () => {
    const err = new StepError({
      stepType: "moveTo",
      selector: ".missing",
      reason: "not-found",
    });
    const result: StepResult = {
      status: "error",
      stepType: "moveTo",
      selector: ".missing",
      durationMs: 0.3,
      error: err,
    };
    expect(result.status).toBe("error");
    expect(result.error).toBe(err);
    expect(result.error?.reason).toBe("not-found");
  });
});

describe("PlaybackEvent types", () => {
  it("step_error is a valid PlaybackEvent value", () => {
    // Compile-time check: if this compiles, the type includes step_error
    const event: import("../types.js").PlaybackEvent = "step_error";
    expect(event).toBe("step_error");
  });
});

describe("EngineOptions.debug", () => {
  it("debug flag is accepted in EngineOptions", () => {
    // Compile-time check
    const opts: import("../types.js").EngineOptions = { debug: true };
    expect(opts.debug).toBe(true);
  });

  it("debug defaults to undefined", () => {
    const opts: import("../types.js").EngineOptions = {};
    expect(opts.debug).toBeUndefined();
  });
});
