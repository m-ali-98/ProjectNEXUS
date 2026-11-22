/**
 * Procedural display surfaces.
 *
 * These are abstract graphics — grids, plots, node maps and bar fields — drawn
 * to canvases so the facility has dozens of live-looking screens at almost no
 * cost. No invented status text or fake telemetry is used; anything that states
 * a fact is rendered as real DOM/3D text from the content layer.
 */
import * as THREE from "three";

export type ScreenVariant =
  | "terminal"
  | "plot"
  | "network"
  | "server"
  | "archive"
  | "identity"
  | "pipeline";

const cache = new Map<string, THREE.CanvasTexture>();

function base(ctx: CanvasRenderingContext2D, size: number, tint: string) {
  ctx.fillStyle = "#04080b";
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "rgba(8,20,26,0.9)");
  g.addColorStop(1, "rgba(2,5,8,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = tint;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    const p = (size / 8) * i;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function scanlines(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let y = 0; y < size; y += 3) ctx.fillRect(0, y, size, 1);
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 4294967296;
  };
}

export function screenTexture(variant: ScreenVariant, tint = "#46e6ff"): THREE.CanvasTexture {
  const key = `${variant}:${tint}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  base(ctx, size, tint);
  const rand = rng(variant.length * 977 + 13);

  ctx.strokeStyle = tint;
  ctx.fillStyle = tint;

  if (variant === "plot" || variant === "terminal") {
    // waveform
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 4) {
      const y =
        size * 0.5 +
        Math.sin(x * 0.03) * 40 +
        Math.sin(x * 0.091 + 1.3) * 18 +
        Math.sin(x * 0.013) * 34;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // bars
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 22; i++) {
      const h = 8 + rand() * 70;
      ctx.fillRect(28 + i * 21, size - 60 - h, 10, h);
    }
    // readout blocks
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(30, 34 + i * 18, 60 + rand() * 120, 6);
    }
    ctx.globalAlpha = 0.6;
    ctx.fillRect(30, 30, 6, 120);
  }

  if (variant === "network") {
    const nodes = Array.from({ length: 13 }, () => ({
      x: 60 + rand() * (size - 120),
      y: 60 + rand() * (size - 120),
    }));
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1.4;
    nodes.forEach((n, i) => {
      nodes.slice(i + 1).forEach((m) => {
        if (Math.hypot(n.x - m.x, n.y - m.y) < 150) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      });
    });
    nodes.forEach((n, i) => {
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(n.x, n.y, i % 3 === 0 ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (i % 3 === 0) {
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(20, 20, size - 40, size - 40);
  }

  if (variant === "server") {
    for (let row = 0; row < 9; row++) {
      ctx.globalAlpha = 0.22;
      ctx.fillRect(26, 40 + row * 46, size - 52, 32);
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 18; i++) {
        if (rand() > 0.45) continue;
        ctx.fillStyle = rand() > 0.85 ? "#f2a93b" : tint;
        ctx.fillRect(40 + i * 24, 52 + row * 46, 8, 7);
      }
      ctx.fillStyle = tint;
    }
    ctx.globalAlpha = 0.3;
    ctx.fillRect(size - 70, 40, 8, size - 120);
  }

  if (variant === "archive" || variant === "identity") {
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const cx = size / 2;
    const cy = size / 2;
    for (let i = 0; i < 6; i++) {
      const r = 60 + i * 34;
      ctx.arc(cx, cy, r, 0.2 + i * 0.2, 0.2 + i * 0.2 + Math.PI * 1.1);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.9;
    ctx.fillRect(cx - 2, cy - 190, 4, 380);
    ctx.fillRect(cx - 190, cy - 2, 380, 4);
  }

  if (variant === "pipeline") {
    const stages = 5;
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < stages; i++) {
      const x = 60 + i * ((size - 120) / (stages - 1));
      const y = size / 2;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 0.14;
      ctx.fill();
      if (i < stages - 1) {
        const nx = 60 + (i + 1) * ((size - 120) / (stages - 1));
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(x + 22, y);
        ctx.lineTo(nx - 22, y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 0.25;
    ctx.fillRect(40, size / 2 - 80, size - 80, 2);
    ctx.fillRect(40, size / 2 + 80, size - 80, 2);
  }

  scanlines(ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/** Small square glyph used on interactive markers. */
export function markerTexture(color = "#46e6ff") {
  const key = `marker:${color}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  const c = 26;
  [
    [8, 8, 1, 1],
    [120, 8, -1, 1],
    [8, 120, 1, -1],
    [120, 120, -1, -1],
  ].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x + dx * c, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * c);
    ctx.stroke();
  });
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(64, 64, 9, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function disposeScreenTextures() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
