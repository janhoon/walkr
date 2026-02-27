import type { Walkthrough } from "../../core/src/types.js";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function buildEmbedHtml(
  frames: Buffer[],
  fps: number,
  walkthrough: Walkthrough,
): string {
  const title = escapeHtml(walkthrough.title ?? "Walkr Capture");
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.round(fps) : 30;
  const frameData = frames.map((frame) => `data:image/png;base64,${frame.toString("base64")}`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
:root {
  color-scheme: dark;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  min-height: 100vh;
  font-family: "Segoe UI", Tahoma, sans-serif;
  background: radial-gradient(circle at top, #1e293b, #020617);
  color: #f8fafc;
  display: grid;
  place-items: center;
  padding: 24px;
}
.player {
  width: min(1100px, 100%);
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.5);
}
header {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  font-size: 14px;
  letter-spacing: 0.02em;
}
canvas {
  width: 100%;
  height: auto;
  display: block;
  background: #000;
}
.controls {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 16px 16px;
}
button {
  border: 0;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
  background: #2563eb;
  color: #eff6ff;
}
input[type=\"range\"] {
  width: 100%;
}
.status {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #cbd5e1;
}
label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
</head>
<body>
  <main class="player">
    <header>${title}</header>
    <canvas id="canvas"></canvas>
    <section class="controls">
      <button id="playPause" type="button">Play</button>
      <input id="progress" type="range" min="0" max="${Math.max(frameData.length - 1, 0)}" step="1" value="0" />
      <div class="status">
        <span id="counter">0 / ${frameData.length}</span>
        <label><input id="loop" type="checkbox" checked /> Loop</label>
      </div>
    </section>
  </main>
<script>
const frames = ${JSON.stringify(frameData)};
const fps = ${safeFps};
const frameDuration = 1000 / fps;

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const progress = document.getElementById("progress");
const playPause = document.getElementById("playPause");
const counter = document.getElementById("counter");
const loopCheckbox = document.getElementById("loop");

let index = 0;
let playing = false;
let raf = 0;
let lastTick = 0;
const images = frames.map((src) => {
  const image = new Image();
  image.src = src;
  return image;
});

const draw = (nextIndex) => {
  if (!images[nextIndex]) {
    return;
  }

  const image = images[nextIndex];
  const render = () => {
    if (canvas.width !== image.naturalWidth || canvas.height !== image.naturalHeight) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    index = nextIndex;
    progress.value = String(index);
    counter.textContent = `${index + 1} / ${images.length}`;
  };

  if (image.complete) {
    render();
  } else {
    image.onload = render;
  }
};

const step = (timestamp) => {
  if (!playing) {
    return;
  }

  if (!lastTick) {
    lastTick = timestamp;
  }

  if (timestamp - lastTick >= frameDuration) {
    lastTick = timestamp;
    const next = index + 1;

    if (next >= images.length) {
      if (loopCheckbox.checked) {
        draw(0);
      } else {
        playing = false;
        playPause.textContent = "Play";
        return;
      }
    } else {
      draw(next);
    }
  }

  raf = requestAnimationFrame(step);
};

playPause.addEventListener("click", () => {
  playing = !playing;
  playPause.textContent = playing ? "Pause" : "Play";

  if (playing) {
    lastTick = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  } else {
    cancelAnimationFrame(raf);
  }
});

progress.addEventListener("input", () => {
  const value = Number(progress.value);
  draw(value);
});

draw(0);
</script>
</body>
</html>`;
}
