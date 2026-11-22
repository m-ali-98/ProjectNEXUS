/**
 * Procedural texture library — every surface detail in NEXUS is generated at
 * runtime from canvases, so the facility ships without binary texture assets
 * and never blocks loading on a download.
 *
 * (Blender-authored PBR maps can be dropped into /public/textures and wired in
 * materials.ts without changing any component.)
 */
import * as THREE from "three";

const THREE_NS = THREE;
const cache = new Map<string, THREE.Texture>();

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

function finish(
  key: string,
  canvas: HTMLCanvasElement,
  opts: { srgb?: boolean; repeat?: [number, number]; anisotropy?: number } = {},
) {
  const tex = new THREE_NS.CanvasTexture(canvas);
  tex.wrapS = THREE_NS.RepeatWrapping;
  tex.wrapT = THREE_NS.RepeatWrapping;
  tex.colorSpace = opts.srgb ? THREE_NS.SRGBColorSpace : THREE_NS.NoColorSpace;
  tex.repeat.set(opts.repeat?.[0] ?? 1, opts.repeat?.[1] ?? 1);
  tex.anisotropy = opts.anisotropy ?? 8;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

/** Deterministic pseudo-random so surfaces are stable between reloads. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function floorGridTexture(accent = "#46e6ff", repeat = 14): THREE.Texture {
  const key = `floorGrid:${accent}:${repeat}`;
  const cached = cache.get(key);
  if (cached) return cached;
  // Draw in a 512-unit space onto a 1024² canvas: same layout, twice the detail.
  const { canvas, ctx } = makeCanvas(1024);
  ctx.scale(2, 2);
  ctx.fillStyle = "#080b0f";
  ctx.fillRect(0, 0, 512, 512);

  const rand = rng(7);
  // subtle mottling
  for (let i = 0; i < 2600; i++) {
    const v = 16 + Math.floor(rand() * 26);
    ctx.fillStyle = `rgba(${v},${v + 4},${v + 6},0.5)`;
    ctx.fillRect(rand() * 512, rand() * 512, 2, 2);
  }

  // major grid
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 510, 510);

  // minor grid
  ctx.globalAlpha = 0.055;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    const p = (512 / 4) * i;
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 512);
    ctx.moveTo(0, p);
    ctx.lineTo(512, p);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  return finish(key, canvas, { srgb: true, repeat: [repeat, repeat] });
}

export function hexFloorTexture(accent = "#46e6ff"): THREE.Texture {
  const key = `hexFloor:${accent}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeCanvas(512);
  ctx.fillStyle = "#070a0d";
  ctx.fillRect(0, 0, 512, 512);

  const rand = rng(19);
  for (let i = 0; i < 3200; i++) {
    const v = 12 + Math.floor(rand() * 20);
    ctx.fillStyle = `rgba(${v},${v + 4},${v + 7},0.55)`;
    ctx.fillRect(rand() * 512, rand() * 512, 3, 1);
  }

  const size = 64;
  const h = Math.sin(Math.PI / 3) * size;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 1.4;
  for (let row = -1; row < 9; row++) {
    for (let col = -1; col < 9; col++) {
      const cx = col * size * 1.5;
      const cy = row * h * 2 + (col % 2 ? h : 0);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const x = cx + size * Math.cos(a);
        const y = cy + size * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return finish(key, canvas, { srgb: true, repeat: [6, 6] });
}

export function panelTexture(repeat: [number, number] = [2, 2]): THREE.Texture {
  const key = `panel:${repeat.join(",")}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeCanvas(512);
  ctx.fillStyle = "#1b2127";
  ctx.fillRect(0, 0, 512, 512);
  const rand = rng(31);
  for (let i = 0; i < 5000; i++) {
    const v = 22 + Math.floor(rand() * 22);
    ctx.fillStyle = `rgba(${v},${v + 3},${v + 5},0.4)`;
    ctx.fillRect(rand() * 512, rand() * 512, 2, 2);
  }
  // horizontal seams
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 3;
  for (let i = 1; i < 4; i++) {
    const y = (512 / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  // vertical seams offset per row
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : 128;
    for (let c = 0; c < 3; c++) {
      const x = offset + c * 256;
      ctx.beginPath();
      ctx.moveTo(x, (512 / 4) * row);
      ctx.lineTo(x, (512 / 4) * (row + 1));
      ctx.stroke();
    }
  }
  // bolts
  ctx.fillStyle = "rgba(120,140,150,0.22)";
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 24 + col * 84 + (row % 2) * 20;
      const y = 20 + row * 128;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return finish(key, canvas, { srgb: true, repeat });
}

export function roughnessNoise(repeat: [number, number] = [3, 3]): THREE.Texture {
  const key = `rough:${repeat.join(",")}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeCanvas(256);
  const img = ctx.createImageData(256, 256);
  const rand = rng(53);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.floor(rand() * 90);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return finish(key, canvas, { repeat });
}

/**
 * Normal map generated from a height field.
 *
 * Used to give floors and wall panels real relief instead of relying on albedo
 * contrast alone: seams catch the key light, and grazing angles pick up the
 * micro-surface. 256² with a 4-tap Sobel is cheap and repeatable.
 */
export function normalTexture(
  kind: "panel" | "concrete" | "grid" = "panel",
  repeat: [number, number] = [2, 2],
  strength = 2.4,
): THREE.Texture {
  const key = `normal:${kind}:${repeat.join(",")}:${strength}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const height = new Float32Array(size * size);
  const rand = rng(kind === "panel" ? 91 : kind === "concrete" ? 17 : 43);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let h = 0;
      if (kind === "panel") {
        // bevelled panel grid with rivets
        const cell = 64;
        const dx = Math.min(x % cell, cell - (x % cell));
        const dy = Math.min(y % cell, cell - (y % cell));
        const edge = Math.min(dx, dy);
        h = edge < 6 ? 0.25 + edge / 24 : 0.7;
        const rx = x % cell - cell / 2;
        const ry = y % cell - cell / 2;
        if (rx * rx + ry * ry < 9) h += 0.35;
        h += (rand() - 0.5) * 0.12;
      } else if (kind === "concrete") {
        h = 0.5 + (rand() - 0.5) * 0.5;
        h += Math.sin(x * 0.13) * Math.sin(y * 0.11) * 0.12;
      } else {
        // thin grout lines every 32 px
        const line = x % 32 < 2 || y % 32 < 2;
        h = (line ? 0.15 : 0.6) + (rand() - 0.5) * 0.1;
      }
      height[y * size + x] = h;
    }
  }

  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(key, canvas, { repeat });
}

export function hazardTexture(): THREE.Texture {
  const key = "hazard";
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#0c0d0e";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#c9922f";
  ctx.lineWidth = 26;
  for (let i = -256; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();
  }
  return finish(key, canvas, { srgb: true, repeat: [6, 1] });
}

/** Faint vertical scan pattern used on holographic panels. */
export function holoTexture(color = "#46e6ff"): THREE.Texture {
  const key = `holo:${color}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeCanvas(256);
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 252, 252);
  return finish(key, canvas, { srgb: true, repeat: [1, 1] });
}

/** Soft radial sprite for particles, glow cards and light bloom stand-ins. */
export function glowTexture(color = "#46e6ff"): THREE.Texture {
  const key = `glow:${color}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { canvas, ctx } = makeCanvas(128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.25, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(key, canvas, { srgb: true });
}

export function disposeProceduralTextures() {
  cache.forEach((tex) => tex.dispose());
  cache.clear();
}
