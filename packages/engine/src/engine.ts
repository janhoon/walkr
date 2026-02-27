import { createCursor, hideCursor, showCursor } from "./cursor.js";
import { executeStep } from "./executor.js";
import type {
  EngineOptions,
  EngineState,
  EventHandler,
  PlaybackEvent,
  Walkthrough,
} from "./types.js";

export class WalkrEngine {
  private readonly options: EngineOptions;

  private container: HTMLElement | null = null;

  private stage: HTMLElement | null = null;

  private iframe: HTMLIFrameElement | null = null;

  private cursor: HTMLElement | null = null;

  private readonly handlers = new Map<PlaybackEvent, Set<EventHandler>>();

  private state: EngineState = {
    playing: false,
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
  };

  private paused = false;

  private pauseResolvers: Array<() => void> = [];

  private runId = 0;

  constructor(options: EngineOptions = {}) {
    this.options = options;

    if (options.container) {
      this.mount(options.container);
    }
  }

  mount(container: HTMLElement): void {
    if (this.container === container && this.stage && this.iframe && this.cursor) {
      return;
    }

    this.unmount();

    this.container = container;

    const stage = document.createElement("div");
    stage.style.position = "relative";
    stage.style.width = "100%";
    stage.style.height = "100%";
    stage.style.overflow = "hidden";
    stage.style.transformOrigin = "50% 50%";
    stage.style.willChange = "transform";
    stage.dataset.walkrPanX = "0";
    stage.dataset.walkrPanY = "0";
    stage.dataset.walkrScale = "1";

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.inset = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "1";

    const cursor = createCursor(this.options.cursor);
    hideCursor(cursor);
    overlay.appendChild(cursor);

    stage.appendChild(iframe);
    stage.appendChild(overlay);
    container.appendChild(stage);

    this.stage = stage;
    this.iframe = iframe;
    this.cursor = cursor;
  }

  unmount(): void {
    this.runId += 1;
    this.paused = false;
    this.flushPauseResolvers();

    if (this.stage) {
      this.stage.remove();
    }

    this.container = null;
    this.stage = null;
    this.iframe = null;
    this.cursor = null;

    this.state = {
      playing: false,
      currentStep: 0,
      totalSteps: 0,
      progress: 0,
    };
  }

  async play(walkthrough: Walkthrough): Promise<void> {
    if (!this.iframe || !this.cursor) {
      throw new Error("WalkrEngine must be mounted before play().");
    }

    const runId = ++this.runId;
    this.paused = false;
    this.flushPauseResolvers();

    this.state = {
      playing: true,
      currentStep: 0,
      totalSteps: walkthrough.steps.length,
      progress: walkthrough.steps.length === 0 ? 1 : 0,
    };
    this.emit("start");

    showCursor(this.cursor);

    await this.loadWalkthroughUrl(walkthrough.url, runId);

    if (runId !== this.runId) {
      return;
    }

    for (let index = 0; index < walkthrough.steps.length; index += 1) {
      await this.waitForResume(runId);

      if (runId !== this.runId || !this.iframe || !this.cursor) {
        return;
      }

      const step = walkthrough.steps[index];
      await executeStep(step, this.cursor, this.iframe);

      if (runId !== this.runId) {
        return;
      }

      this.state.currentStep = index + 1;
      this.state.progress = this.state.totalSteps > 0 ? this.state.currentStep / this.state.totalSteps : 1;
      this.emit("step");
    }

    if (runId !== this.runId) {
      return;
    }

    this.state.playing = false;
    this.paused = false;
    this.state.progress = this.state.totalSteps > 0 ? 1 : this.state.progress;
    this.emit("complete");
  }

  pause(): void {
    if (!this.state.playing || this.paused) {
      return;
    }

    this.paused = true;
    this.state.playing = false;
    this.emit("pause");
  }

  resume(): void {
    if (!this.paused) {
      return;
    }

    this.paused = false;
    this.state.playing = true;
    this.flushPauseResolvers();
    this.emit("resume");
  }

  on(event: PlaybackEvent, handler: EventHandler): void {
    const existing = this.handlers.get(event);
    if (existing) {
      existing.add(handler);
      return;
    }

    this.handlers.set(event, new Set([handler]));
  }

  off(event: PlaybackEvent, handler: EventHandler): void {
    const existing = this.handlers.get(event);
    if (!existing) {
      return;
    }

    existing.delete(handler);
    if (existing.size === 0) {
      this.handlers.delete(event);
    }
  }

  getState(): EngineState {
    return { ...this.state };
  }

  private emit(event: PlaybackEvent): void {
    const listeners = this.handlers.get(event);
    if (!listeners || listeners.size === 0) {
      return;
    }

    const snapshot = this.getState();
    for (const listener of listeners) {
      listener(event, snapshot);
    }
  }

  private async loadWalkthroughUrl(url: string, runId: number): Promise<void> {
    if (!this.iframe) {
      return;
    }

    await new Promise<void>((resolve) => {
      const iframe = this.iframe;
      if (!iframe) {
        resolve();
        return;
      }

      let settled = false;

      const finish = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        iframe.removeEventListener("load", onLoad);
        iframe.removeEventListener("error", onError);
        resolve();
      };

      const onLoad = (): void => {
        finish();
      };

      const onError = (): void => {
        finish();
      };

      iframe.addEventListener("load", onLoad);
      iframe.addEventListener("error", onError);
      iframe.src = url;

      if (runId !== this.runId) {
        finish();
      }
    });
  }

  private flushPauseResolvers(): void {
    const resolvers = [...this.pauseResolvers];
    this.pauseResolvers = [];
    for (const resolve of resolvers) {
      resolve();
    }
  }

  private async waitForResume(runId: number): Promise<void> {
    while (this.paused && runId === this.runId) {
      await new Promise<void>((resolve) => {
        this.pauseResolvers.push(resolve);
      });
    }
  }
}
