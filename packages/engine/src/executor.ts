import type {
  ClickStep,
  HighlightStep,
  MoveToStep,
  PanStep,
  ScrollStep,
  Step,
  TypeStep,
  WaitStep,
  ZoomStep,
} from "@walkr/core";
import type { PlaybackEvent, PlaybackState } from "./types.js";
import type { CursorOverlay } from "./cursor.js";
import { getEasingFunction, interpolatePosition } from "./interpolation.js";

export class StepExecutor {
  paused = false;
  aborted = false;
  private resumeResolve: (() => void) | null = null;
  private currentX = 0;
  private currentY = 0;

  constructor(
    private cursor: CursorOverlay,
    private iframe: HTMLIFrameElement,
    private onEvent: (event: PlaybackEvent) => void,
  ) {}

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (!paused && this.resumeResolve) {
      this.resumeResolve();
      this.resumeResolve = null;
    }
  }

  setAborted(aborted: boolean): void {
    this.aborted = aborted;
  }

  private waitForResume(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.resumeResolve = resolve;
    });
  }

  private makeState(stepIndex: number): PlaybackState {
    return {
      currentStepIndex: stepIndex,
      currentTime: 0,
      totalTime: 0,
      isPlaying: !this.paused && !this.aborted,
      isPaused: this.paused,
      isDone: false,
    };
  }

  async executeStep(step: Step, stepIndex: number): Promise<void> {
    if (this.aborted) return;
    if (this.paused) await this.waitForResume();

    this.onEvent({
      type: "step",
      stepIndex,
      step,
      state: this.makeState(stepIndex),
    });

    // Cast through unknown since Step's default TOptions (Record<string, unknown>)
    // doesn't directly overlap with specific option types
    const s = step as unknown;
    switch (step.type) {
      case "moveTo":
        await this.executeMoveTo(s as MoveToStep);
        break;
      case "click":
        await this.executeClick(s as ClickStep);
        break;
      case "type":
        await this.executeType(s as TypeStep);
        break;
      case "scroll":
        await this.executeScroll(s as ScrollStep);
        break;
      case "wait":
        await this.executeWait(s as WaitStep);
        break;
      case "zoom":
        await this.executeZoom(s as ZoomStep);
        break;
      case "pan":
        await this.executePan(s as PanStep);
        break;
      case "highlight":
        await this.executeHighlight(s as HighlightStep);
        break;
    }
  }

  /**
   * requestAnimationFrame-based animation loop with pause support.
   * Calls `tick(t)` on each frame where t goes from 0 to 1.
   */
  private animate(
    duration: number,
    tick: (t: number) => void,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (duration <= 0) {
        tick(1);
        resolve();
        return;
      }

      let elapsed = 0;
      let lastTimestamp: number | null = null;

      const frame = (timestamp: number): void => {
        if (this.aborted) {
          resolve();
          return;
        }

        if (this.paused) {
          lastTimestamp = null;
          this.waitForResume().then(() => {
            requestAnimationFrame(frame);
          });
          return;
        }

        if (lastTimestamp !== null) {
          elapsed += timestamp - lastTimestamp;
        }
        lastTimestamp = timestamp;

        const t = Math.min(elapsed / duration, 1);
        tick(t);

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });
  }

  private async executeMoveTo(step: MoveToStep): Promise<void> {
    const from = { x: this.currentX, y: this.currentY };
    const to = { x: step.options.x, y: step.options.y };
    const duration = step.duration || 500;
    const easing = step.options.easing ?? "ease";

    await this.animate(duration, (t) => {
      const pos = interpolatePosition(from, to, t, easing);
      this.cursor.setPosition(pos.x, pos.y);
      this.currentX = pos.x;
      this.currentY = pos.y;
    });
  }

  private async executeClick(step: ClickStep): Promise<void> {
    const { x, y, button, double: isDouble } = step.options;

    // Move cursor to target if not already there
    if (this.currentX !== x || this.currentY !== y) {
      const from = { x: this.currentX, y: this.currentY };
      const to = { x, y };
      await this.animate(200, (t) => {
        const pos = interpolatePosition(from, to, t, "ease");
        this.cursor.setPosition(pos.x, pos.y);
        this.currentX = pos.x;
        this.currentY = pos.y;
      });
    }

    this.cursor.animateClick();

    const iframeDoc = this.iframe.contentDocument;
    if (!iframeDoc) return;

    const buttonCode = button === "right" ? 2 : button === "middle" ? 1 : 0;
    const target = iframeDoc.elementFromPoint(x, y) ?? iframeDoc.body;
    const eventInit: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: buttonCode,
    };

    target.dispatchEvent(new MouseEvent("mousedown", eventInit));
    target.dispatchEvent(new MouseEvent("mouseup", eventInit));
    target.dispatchEvent(new MouseEvent("click", eventInit));

    if (isDouble) {
      target.dispatchEvent(new MouseEvent("mousedown", eventInit));
      target.dispatchEvent(new MouseEvent("mouseup", eventInit));
      target.dispatchEvent(new MouseEvent("click", eventInit));
      target.dispatchEvent(new MouseEvent("dblclick", eventInit));
    }
  }

  private async executeType(step: TypeStep): Promise<void> {
    const { text, delay = 50, selector } = step.options;
    const iframeDoc = this.iframe.contentDocument;
    if (!iframeDoc) return;

    let target: Element | null = null;
    if (selector) {
      target = iframeDoc.querySelector(selector);
    } else {
      target = iframeDoc.activeElement;
    }

    if (target && "focus" in target) {
      (target as HTMLElement).focus();
    }

    for (const char of text) {
      if (this.aborted) return;
      if (this.paused) await this.waitForResume();

      const eventTarget = target ?? iframeDoc.body;

      eventTarget.dispatchEvent(
        new KeyboardEvent("keydown", { key: char, bubbles: true }),
      );
      eventTarget.dispatchEvent(
        new KeyboardEvent("keypress", { key: char, bubbles: true }),
      );

      if (target && "value" in target) {
        (target as HTMLInputElement).value += char;
      }

      eventTarget.dispatchEvent(
        new InputEvent("input", {
          data: char,
          inputType: "insertText",
          bubbles: true,
        }),
      );
      eventTarget.dispatchEvent(
        new KeyboardEvent("keyup", { key: char, bubbles: true }),
      );

      if (delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async executeScroll(step: ScrollStep): Promise<void> {
    const { x, y, smooth } = step.options;
    const iframeWin = this.iframe.contentWindow;
    if (!iframeWin) return;

    if (smooth === false || step.duration <= 0) {
      iframeWin.scrollTo(x, y);
      return;
    }

    const duration = step.duration || 500;
    const startX = iframeWin.scrollX;
    const startY = iframeWin.scrollY;

    await this.animate(duration, (t) => {
      const cx = startX + (x - startX) * t;
      const cy = startY + (y - startY) * t;
      iframeWin.scrollTo(cx, cy);
    });
  }

  private async executeWait(step: WaitStep): Promise<void> {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, step.options.ms),
    );
  }

  private async executeZoom(step: ZoomStep): Promise<void> {
    const { level, x, y, easing } = step.options;
    const duration = step.duration || 500;

    const container = this.iframe.parentElement;
    if (!container) return;

    const currentTransform = container.style.transform;
    const scaleMatch = currentTransform.match(/scale\(([\d.]+)\)/);
    const startScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    // Use provided origin, or fall back to cursor position
    const originX = x ?? this.currentX;
    const originY = y ?? this.currentY;

    const easeFn = getEasingFunction(easing ?? "ease");

    await this.animate(duration, (t) => {
      const et = easeFn(t);
      const currentScale = startScale + (level - startScale) * et;
      this.cursor.setZoom(currentScale, originX, originY);
    });
  }

  private async executePan(step: PanStep): Promise<void> {
    const { x, y, easing } = step.options;
    const duration = step.duration || 500;

    const container = this.iframe.parentElement;
    if (!container) return;

    const currentTransform = container.style.transform;
    const translateMatch = currentTransform.match(
      /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/,
    );
    const startX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const startY = translateMatch ? parseFloat(translateMatch[2]) : 0;

    const easeFn = getEasingFunction(easing ?? "ease");

    // Preserve any existing scale
    const scaleMatch = currentTransform.match(/scale\(([\d.]+)\)/);
    const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    await this.animate(duration, (t) => {
      const et = easeFn(t);
      const cx = startX + (x - startX) * et;
      const cy = startY + (y - startY) * et;
      container.style.transform =
        `translate(${cx}px, ${cy}px) scale(${scale})`;
    });
  }

  private async executeHighlight(step: HighlightStep): Promise<void> {
    const { selector, color = "rgba(255, 59, 48, 0.5)" } = step.options;
    const holdDuration = step.duration || 2000;

    const iframeDoc = this.iframe.contentDocument;
    if (!iframeDoc) return;

    const target = iframeDoc.querySelector(selector);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const container = this.iframe.parentElement;
    if (!container) return;

    // Backdrop
    const backdrop = document.createElement("div");
    backdrop.style.position = "absolute";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.width = "100%";
    backdrop.style.height = "100%";
    backdrop.style.backgroundColor = "rgba(0,0,0,0.3)";
    backdrop.style.pointerEvents = "none";
    backdrop.style.zIndex = "9998";
    backdrop.style.opacity = "0";
    backdrop.style.transition = "opacity 200ms ease";

    // Highlight ring
    const ring = document.createElement("div");
    ring.style.position = "absolute";
    ring.style.left = `${rect.left - 4}px`;
    ring.style.top = `${rect.top - 4}px`;
    ring.style.width = `${rect.width + 8}px`;
    ring.style.height = `${rect.height + 8}px`;
    ring.style.border = `3px solid ${color}`;
    ring.style.borderRadius = "4px";
    ring.style.pointerEvents = "none";
    ring.style.zIndex = "9999";
    ring.style.opacity = "0";
    ring.style.transition = "opacity 200ms ease";

    container.appendChild(backdrop);
    container.appendChild(ring);

    // Fade in
    requestAnimationFrame(() => {
      backdrop.style.opacity = "1";
      ring.style.opacity = "1";
    });

    // Hold
    await new Promise<void>((resolve) =>
      setTimeout(resolve, holdDuration),
    );

    // Fade out
    backdrop.style.opacity = "0";
    ring.style.opacity = "0";
    await new Promise<void>((resolve) => setTimeout(resolve, 200));

    backdrop.remove();
    ring.remove();
  }
}
