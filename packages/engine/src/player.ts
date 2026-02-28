import type { Step } from "@walkr/core";
import { CursorOverlay } from "./cursor.js";
import { StepExecutor } from "./executor.js";
import type { EngineConfig, PlaybackEvent, PlaybackEventType, PlaybackState } from "./types.js";

export class WalkrPlayer {
  private iframe: HTMLIFrameElement;
  private cursor: CursorOverlay;
  private executor: StepExecutor;
  private viewport: HTMLElement;
  private _config: EngineConfig;
  private listeners = new Map<PlaybackEventType, Set<(e: PlaybackEvent) => void>>();
  private state: PlaybackState = {
    currentStepIndex: 0,
    currentTime: 0,
    totalTime: 0,
    isPlaying: false,
    isPaused: false,
    isDone: false,
  };

  constructor(container: HTMLElement, config: EngineConfig) {
    this.container = container;
    this._config = config;

    // Set up the container
    container.style.position = "relative";
    container.style.overflow = "hidden";

    // Create viewport wrapper
    this.viewport = document.createElement("div");
    this.viewport.style.position = "relative";
    this.viewport.style.width = `${config.width ?? 1280}px`;
    this.viewport.style.height = `${config.height ?? 720}px`;
    this.viewport.style.overflow = "hidden";

    // Create iframe
    this.iframe = document.createElement("iframe");
    this.iframe.src = config.url;
    this.iframe.style.width = "100%";
    this.iframe.style.height = "100%";
    this.iframe.style.border = "none";
    this.viewport.appendChild(this.iframe);

    // Create cursor overlay
    this.cursor = new CursorOverlay(this.viewport, config.cursor);

    container.appendChild(this.viewport);

    // Apply initial zoom
    if (config.zoom && config.zoom !== 1) {
      this.cursor.setZoom(config.zoom, 0, 0);
    }

    // Create executor
    this.executor = new StepExecutor(this.cursor, this.iframe, (event: PlaybackEvent) => {
      event.state = this.getState();
      this.emit(event.type, event);
    });
  }

  async play(): Promise<void> {
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.isDone = false;
    this.state.currentStepIndex = 0;
    this.executor.setAborted(false);
    this.executor.setPaused(false);

    this.emit("start", {
      type: "start",
      state: this.getState(),
    });

    const startTime = performance.now();

    try {
      for (let i = 0; i < this._config.steps.length; i++) {
        if (!this.state.isPlaying) break;

        this.state.currentStepIndex = i;
        this.state.currentTime = performance.now() - startTime;
        this.state.totalTime = this.state.currentTime;

        await this.executor.executeStep(this._config.steps[i], i);
      }

      this.state.isPlaying = false;
      this.state.isDone = true;
      this.state.totalTime = performance.now() - startTime;

      this.emit("complete", {
        type: "complete",
        state: this.getState(),
      });
    } catch (err) {
      this.state.isPlaying = false;

      this.emit("error", {
        type: "error",
        state: this.getState(),
      });

      throw err;
    }
  }

  pause(): void {
    if (!this.state.isPlaying || this.state.isPaused) return;
    this.state.isPaused = true;
    this.executor.setPaused(true);

    this.emit("pause", {
      type: "pause",
      state: this.getState(),
    });
  }

  resume(): void {
    if (!this.state.isPaused) return;
    this.state.isPaused = false;
    this.executor.setPaused(false);

    this.emit("resume", {
      type: "resume",
      state: this.getState(),
    });
  }

  seek(stepIndex: number): void {
    this.state.currentStepIndex = Math.max(0, Math.min(stepIndex, this._config.steps.length - 1));
  }

  reset(): void {
    this.state = {
      currentStepIndex: 0,
      currentTime: 0,
      totalTime: 0,
      isPlaying: false,
      isPaused: false,
      isDone: false,
    };
    this.executor.setAborted(true);
    this.executor.setPaused(false);
    this.cursor.setPosition(0, 0);
  }

  on(event: PlaybackEventType, handler: (e: PlaybackEvent) => void): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler);
  }

  off(event: PlaybackEventType, handler: (e: PlaybackEvent) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(type: PlaybackEventType, event: PlaybackEvent): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  getState(): PlaybackState {
    return { ...this.state };
  }

  destroy(): void {
    this.reset();
    this.cursor.destroy();
    this.viewport.remove();
  }

  get steps(): Step[] {
    return this._config.steps;
  }

  get config(): EngineConfig {
    return this._config;
  }
}
