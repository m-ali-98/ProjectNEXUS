/**
 * Offline character preview renderer.
 *
 *   npx tsx scripts/preview-character.ts [outDir]
 *
 * There is no GPU in this environment, so this rasterises the real rig geometry
 * with a z-buffered software renderer and writes PNGs to `preview/`. It exists so
 * the model can be *looked at* and iterated on: silhouette, proportions, face,
 * hair, hands and shoes. It is a reference image, not the shipping renderer.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";

import { buildRig, PART_COLOURS, rigParts, type RigNode } from "../src/world/character/rig";
import { encodePng } from "./lib/png";

type Triangle = {
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  na: THREE.Vector3;
  nb: THREE.Vector3;
  nc: THREE.Vector3;
  colour: [number, number, number];
  metal: number;
  emissive: number;
};

const MATERIAL_LOOK: Record<string, { metal: number; emissive: number }> = {
  metal: { metal: 1, emissive: 0 },
  suitEdge: { metal: 0.6, emissive: 0 },
  leather: { metal: 0.2, emissive: 0 },
  accent: { metal: 0.2, emissive: 0.9 },
  sclera: { metal: 0, emissive: 0 },
  cornea: { metal: 0, emissive: 0.4 },
  pupil: { metal: 0, emissive: 0 },
  iris: { metal: 0, emissive: 0.1 },
};

/** Walks the rig, composing YXZ joint transforms, and emits world triangles. */
function collectTriangles(): Triangle[] {
  const out: Triangle[] = [];
  const root = buildRig();

  const walk = (node: RigNode, parent: THREE.Matrix4) => {
    const scale = node.scale ?? 1;
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(...node.position),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...(node.rotation ?? [0, 0, 0]), "YXZ"),
      ),
      new THREE.Vector3(scale, scale, scale),
    );
    const world = parent.clone().multiply(local);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(world);

    for (const part of node.parts) {
      const look = MATERIAL_LOOK[part.material] ?? { metal: 0, emissive: 0 };
      const colour = PART_COLOURS[part.material];
      const geometry = part.geometry;
      const position = geometry.getAttribute("position") as THREE.BufferAttribute;
      const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
      const index = geometry.getIndex();
      const count = index ? index.count : position.count;

      const vertex = (i: number) =>
        new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(world);
      const normalAt = (i: number) =>
        new THREE.Vector3(normal.getX(i), normal.getY(i), normal.getZ(i))
          .applyMatrix3(normalMatrix)
          .normalize();

      for (let t = 0; t < count; t += 3) {
        const ia = index ? index.getX(t) : t;
        const ib = index ? index.getX(t + 1) : t + 1;
        const ic = index ? index.getX(t + 2) : t + 2;
        out.push({
          a: vertex(ia),
          b: vertex(ib),
          c: vertex(ic),
          na: normalAt(ia),
          nb: normalAt(ib),
          nc: normalAt(ic),
          colour,
          metal: look.metal,
          emissive: look.emissive,
        });
      }
    }

    for (const child of node.children) walk(child, world);
  };

  walk(root, new THREE.Matrix4());
  return out;
}

type Camera = {
  eye: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  up?: THREE.Vector3;
};

type Light = { dir: THREE.Vector3; colour: [number, number, number]; intensity: number };

const KEY: Light = { dir: new THREE.Vector3(-0.45, 0.62, -0.65).normalize(), colour: [0.82, 0.92, 1], intensity: 1.35 };
const FILL: Light = { dir: new THREE.Vector3(0.7, 0.2, -0.5).normalize(), colour: [0.42, 0.55, 0.75], intensity: 0.5 };
const RIM: Light = { dir: new THREE.Vector3(0.35, 0.35, 0.87).normalize(), colour: [0.5, 0.78, 1], intensity: 0.8 };

function render(
  triangles: Triangle[],
  camera: Camera,
  width: number,
  height: number,
  ss = 2,
): Uint8Array {
  const w = width * ss;
  const h = height * ss;
  const colour = new Float32Array(w * h * 3);
  const depth = new Float32Array(w * h).fill(Number.POSITIVE_INFINITY);
  const coverage = new Float32Array(w * h);

  // background: a cold vertical gradient so the silhouette reads
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const r = 0.016 + t * 0.02;
    const g = 0.024 + t * 0.035;
    const b = 0.033 + t * 0.05;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      colour[i] = r;
      colour[i + 1] = g;
      colour[i + 2] = b;
    }
  }

  const viewMatrix = new THREE.Matrix4().lookAt(camera.eye, camera.target, camera.up ?? new THREE.Vector3(0, 1, 0));
  const cameraMatrix = new THREE.Matrix4().makeBasis(
    new THREE.Vector3().setFromMatrixColumn(viewMatrix, 0),
    new THREE.Vector3().setFromMatrixColumn(viewMatrix, 1),
    new THREE.Vector3().setFromMatrixColumn(viewMatrix, 2),
  );
  const inverseCamera = cameraMatrix.clone().invert();
  const toView = (v: THREE.Vector3) =>
    v.clone().sub(camera.eye).applyMatrix4(inverseCamera);

  const focal = h / 2 / Math.tan((camera.fov * Math.PI) / 360);
  const project = (v: THREE.Vector3) => ({
    x: w / 2 + (v.x / -v.z) * focal,
    y: h / 2 - (v.y / -v.z) * focal,
    z: -v.z,
  });

  const tangent = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    // face normal for back-face rejection
    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    return ab.cross(ac);
  };

  for (const tri of triangles) {
    const va = toView(tri.a);
    const vb = toView(tri.b);
    const vc = toView(tri.c);
    if (va.z > -0.02 || vb.z > -0.02 || vc.z > -0.02) continue;
    // cull back faces (counter-clockwise in world space)
    const facing = tangent(tri.a, tri.b, tri.c);
    const toEye = camera.eye.clone().sub(tri.a);
    if (facing.dot(toEye) <= 0) continue;

    const pa = project(va);
    const pb = project(vb);
    const pc = project(vc);

    const minX = Math.max(0, Math.floor(Math.min(pa.x, pb.x, pc.x)));
    const maxX = Math.min(w - 1, Math.ceil(Math.max(pa.x, pb.x, pc.x)));
    const minY = Math.max(0, Math.floor(Math.min(pa.y, pb.y, pc.y)));
    const maxY = Math.min(h - 1, Math.ceil(Math.max(pa.y, pb.y, pc.y)));
    if (minX > maxX || minY > maxY) continue;

    const area = (pb.x - pa.x) * (pc.y - pa.y) - (pc.x - pa.x) * (pb.y - pa.y);
    if (Math.abs(area) < 1e-9) continue;
    const invArea = 1 / area;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w0 = ((pb.x - px) * (pc.y - py) - (pc.x - px) * (pb.y - py)) * invArea;
        const w1 = ((pc.x - px) * (pa.y - py) - (pa.x - px) * (pc.y - py)) * invArea;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;

        // perspective-correct depth
        const invZ = w0 / -va.z + w1 / -vb.z + w2 / -vc.z;
        const z = 1 / Math.max(1e-6, invZ);
        const index = y * w + x;
        if (z >= depth[index]) continue;
        depth[index] = z;
        coverage[index] = 1;

        const n = new THREE.Vector3()
          .addScaledVector(tri.na, w0)
          .addScaledVector(tri.nb, w1)
          .addScaledVector(tri.nc, w2)
          .normalize();
        const viewDir = tri.a.clone().sub(camera.eye).normalize();

        const lambert = (light: Light) => {
          const d = Math.max(0, n.dot(light.dir));
          return d * light.intensity;
        };
        const shadowless =
          lambert(KEY) * 1 +
          lambert(FILL) * 0.55 +
          lambert(RIM) * 0.35 * Math.max(0, 1 - Math.abs(n.dot(viewDir)));
        const ambient = 0.1 + 0.07 * (0.5 + 0.5 * n.y);
        const specular =
          Math.max(0, n.dot(KEY.dir.clone().add(viewDir).normalize())) ** (tri.metal > 0.5 ? 36 : 18) *
          (0.12 + tri.metal * 0.6);

        const shade = ambient + shadowless;
        const r = tri.colour[0] * shade + specular * 0.9 + tri.colour[0] * tri.emissive * 1.6;
        const g = tri.colour[1] * shade + specular * 0.95 + tri.colour[1] * tri.emissive * 1.6;
        const b = tri.colour[2] * shade + specular + tri.colour[2] * tri.emissive * 1.6;
        colour[index * 3] = r;
        colour[index * 3 + 1] = g;
        colour[index * 3 + 2] = b;
      }
    }
  }

  // downsample (2×2 box) and apply a soft filmic curve + gamma
  const out = new Uint8Array(width * height * 4);
  const tone = (v: number) => {
    const x = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14);
    return Math.round(Math.min(1, Math.max(0, x)) ** (1 / 2.2) * 255);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const i = (((y * ss + sy) * w) + (x * ss + sx)) * 3;
          r += colour[i];
          g += colour[i + 1];
          b += colour[i + 2];
        }
      }
      const n = ss * ss;
      const o = (y * width + x) * 4;
      out[o] = tone(r / n);
      out[o + 1] = tone(g / n);
      out[o + 2] = tone(b / n);
      out[o + 3] = 255;
    }
  }
  return out;
}

const outDir = process.argv[2] ?? "preview";
mkdirSync(outDir, { recursive: true });

const triangles = collectTriangles();
const parts = rigParts();

const views: { name: string; camera: Camera; width: number; height: number }[] = [
  {
    name: "front",
    camera: { eye: new THREE.Vector3(0, 1.0, -2.9), target: new THREE.Vector3(0, 0.88, 0), fov: 34 },
    width: 620,
    height: 940,
  },
  {
    name: "three-quarter",
    camera: { eye: new THREE.Vector3(-1.5, 1.15, -2.4), target: new THREE.Vector3(0, 0.86, 0), fov: 34 },
    width: 620,
    height: 940,
  },
  {
    name: "side",
    camera: { eye: new THREE.Vector3(2.7, 1.0, -0.35), target: new THREE.Vector3(0, 0.88, 0), fov: 34 },
    width: 620,
    height: 940,
  },
  {
    name: "face",
    camera: { eye: new THREE.Vector3(-0.2, 1.68, -0.55), target: new THREE.Vector3(0, 1.655, 0), fov: 24 },
    width: 620,
    height: 620,
  },
  {
    name: "face-front",
    camera: { eye: new THREE.Vector3(0, 1.664, -0.5), target: new THREE.Vector3(0, 1.652, 0), fov: 26 },
    width: 620,
    height: 620,
  },
];

for (const view of views) {
  const pixels = render(triangles, view.camera, view.width, view.height);
  const file = join(outDir, `${view.name}.png`);
  writeFileSync(file, encodePng(view.width, view.height, pixels));
  console.log(`  ✓ ${file}`);
}

console.log(
  `  · ${parts.length} parts, ${triangles.length.toLocaleString()} triangles, built from ${buildRig().children.length} root node`,
);
