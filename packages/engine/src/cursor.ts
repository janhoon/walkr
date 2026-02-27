import type { CursorConfig } from "./types.js";

type ResolvedCursorConfig = Required<CursorConfig>;

const DEFAULTS: ResolvedCursorConfig = {
  size: 24,
  color: "#FF3B30",
  shape: "arrow",
  shadow: true,
  clickColor: "#FF3B30",
  opacity: 1,
};

function createArrowSVG(size: number, color: string): string {
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M2 2L2 19L7.5 13.5L12 22L15 20.5L10.5 12L17 12Z" ` +
    `fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

export class CursorOverlay {
  private el: HTMLElement;
  private config: ResolvedCursorConfig;
  private container: HTMLElement;
  private currentX = 0;
  private currentY = 0;

  constructor(container: HTMLElement, config: CursorConfig = {}) {
    this.container = container;
    this.config = {
      ...DEFAULTS,
      ...config,
      clickColor: config.clickColor ?? config.color ?? DEFAULTS.clickColor,
    };

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.top = "0";
    this.el.style.left = "0";
    this.el.style.pointerEvents = "none";
    this.el.style.zIndex = "9999";
    this.el.style.willChange = "transform";
    this.el.style.opacity = String(this.config.opacity);

    if (this.config.shadow) {
      this.el.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.3))";
    }

    this.renderShape();
    container.appendChild(this.el);
  }

  private renderShape(): void {
    const { size, color, shape } = this.config;

    switch (shape) {
      case "arrow":
        this.el.innerHTML = createArrowSVG(size, color);
        break;
      case "circle": {
        const child = document.createElement("div");
        child.style.width = `${size}px`;
        child.style.height = `${size}px`;
        child.style.borderRadius = "50%";
        child.style.border = `2px solid ${color}`;
        child.style.boxSizing = "border-box";
        this.el.appendChild(child);
        break;
      }
      case "dot": {
        const dotSize = Math.max(size / 3, 4);
        const child = document.createElement("div");
        child.style.width = `${dotSize}px`;
        child.style.height = `${dotSize}px`;
        child.style.borderRadius = "50%";
        child.style.backgroundColor = color;
        this.el.appendChild(child);
        break;
      }
    }
  }

  get x(): number {
    return this.currentX;
  }

  get y(): number {
    return this.currentY;
  }

  setPosition(x: number, y: number): void {
    this.currentX = x;
    this.currentY = y;
    this.el.style.transform = `translate(${x}px, ${y}px)`;
  }

  animateClick(): void {
    const ripple = document.createElement("div");
    const size = this.config.size * 2;
    ripple.style.position = "absolute";
    ripple.style.left = `${this.currentX - size / 2}px`;
    ripple.style.top = `${this.currentY - size / 2}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.borderRadius = "50%";
    ripple.style.backgroundColor = this.config.clickColor;
    ripple.style.opacity = "0.4";
    ripple.style.transform = "scale(0)";
    ripple.style.pointerEvents = "none";
    ripple.style.transition =
      "transform 400ms ease-out, opacity 400ms ease-out";

    this.container.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.style.transform = "scale(1)";
      ripple.style.opacity = "0";
    });

    setTimeout(() => {
      ripple.remove();
    }, 400);
  }

  setZoom(level: number, originX: number, originY: number): void {
    this.container.style.transformOrigin = `${originX}px ${originY}px`;
    this.container.style.transform = `scale(${level})`;
  }

  destroy(): void {
    this.el.remove();
  }
}
