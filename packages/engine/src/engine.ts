import { createCursor, hideCursor, showCursor, updateCursorConfig } from "./cursor.js";
import {
  executeStep,
  getViewportState,
  initializeViewport,
  resetViewport,
  type ViewportState,
} from "./executor.js";
import type {
  CursorConfig,
  EngineOptions,
  EngineState,
  EventHandler,
  PlaybackEvent,
  Viewport,
  Walkthrough,
} from "./types.js";

export class WalkrEngine {
  private readonly options: EngineOptions;

  private container: HTMLElement | null = null;

  private stage: HTMLElement | null = null;

  private iframe: HTMLIFrameElement | null = null;

  private cursor: HTMLElement | null = null;

  private scaler: HTMLElement | null = null;

  private resizeObserver: ResizeObserver | null = null;

  private activeViewport: Viewport | null = null;

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

  private activeCursorConfig: CursorConfig = {};

  constructor(options: EngineOptions = {}) {
    this.options = options;
    this.activeCursorConfig = options.cursor ?? {};

    if (options.container) {
      this.mount(options.container);
    }
  }

  setCursorConfig(config: Partial<CursorConfig>): void {
    this.activeCursorConfig = { ...this.activeCursorConfig, ...config };
    if (this.cursor) {
      updateCursorConfig(this.cursor, this.activeCursorConfig);
    }
  }

  getViewportState(): ViewportState {
    if (this.stage) {
      return getViewportState(this.stage);
    }
    return { zoom: 1, panX: 0, panY: 0 };
  }

  async resetViewport(options?: { duration?: number; easing?: string }): Promise<void> {
    if (this.stage) {
      await resetViewport(this.stage, options);
    }
  }

  mount(container: HTMLElement): void {
    if (
      this.container === container &&
      this.stage &&
      this.iframe &&
      this.cursor &&
      this.activeViewport === (this.options.viewport ?? null)
    ) {
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
    initializeViewport(stage);

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

    const cursor = createCursor(this.activeCursorConfig);
    hideCursor(cursor);
    overlay.appendChild(cursor);

    stage.appendChild(iframe);
    stage.appendChild(overlay);

    if (this.activeViewport) {
      const scaler = document.createElement("div");
      scaler.style.width = `${this.activeViewport.width}px`;
      scaler.style.height = `${this.activeViewport.height}px`;
      scaler.style.position = "absolute";
      scaler.style.top = "0";
      scaler.style.left = "0";
      scaler.style.transformOrigin = "0 0";
      scaler.style.overflow = "hidden";

      scaler.appendChild(stage);
      container.appendChild(scaler);
      this.scaler = scaler;

      this.resizeObserver = new ResizeObserver(() => {
        this.applyViewportScale();
      });
      this.resizeObserver.observe(container);
      this.applyViewportScale();
    } else {
      container.appendChild(stage);
    }

    this.stage = stage;
    this.iframe = iframe;
    this.cursor = cursor;
  }

  private applyViewportScale(): void {
    if (!this.scaler || !this.container || !this.activeViewport) {
      return;
    }

    const containerW = this.container.clientWidth;
    const containerH = this.container.clientHeight;
    const designW = this.activeViewport.width;
    const designH = this.activeViewport.height;

    const scale = Math.min(containerW / designW, containerH / designH);
    const offsetX = (containerW - designW * scale) / 2;
    const offsetY = (containerH - designH * scale) / 2;

    this.scaler.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  unmount(): void {
    this.runId += 1;
    this.paused = false;
    this.flushPauseResolvers();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.scaler) {
      this.scaler.remove();
      this.scaler = null;
    } else if (this.stage) {
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
    if (!this.container) {
      throw new Error("WalkrEngine must be mounted before play().");
    }

    // Resolve viewport: walkthrough takes precedence over engine options
    const nextViewport = walkthrough.viewport ?? this.options.viewport ?? null;
    const viewportChanged =
      nextViewport?.width !== this.activeViewport?.width ||
      nextViewport?.height !== this.activeViewport?.height;

    if (viewportChanged) {
      this.activeViewport = nextViewport;
      const container = this.container;
      this.unmount();
      this.mount(container);
    }

    if (!this.iframe || !this.cursor) {
      throw new Error("WalkrEngine must be mounted before play().");
    }

    // Merge walkthrough cursor config with engine options cursor config
    if (walkthrough.cursor) {
      this.activeCursorConfig = { ...this.options.cursor, ...walkthrough.cursor };
      updateCursorConfig(this.cursor, this.activeCursorConfig);
    }

    const zoomDefaults = walkthrough.zoom;

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
      const cursorRef = this.cursor;
      await executeStep(step, cursorRef, this.iframe, {
        getCursorConfig: () => ({ ...this.activeCursorConfig }),
        setCursorConfig: (config) => {
          this.activeCursorConfig = { ...this.activeCursorConfig, ...config };
          updateCursorConfig(cursorRef, this.activeCursorConfig);
        },
        zoomDefaults,
      });

      if (runId !== this.runId) {
        return;
      }

      this.state.currentStep = index + 1;
      this.state.progress =
        this.state.totalSteps > 0 ? this.state.currentStep / this.state.totalSteps : 1;
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
