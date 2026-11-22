/**
 * Offline preview of the imported protagonist GLB.
 *
 *   npx tsx scripts/preview-model.ts [--anim walk] [--time 0.4] [--scan]
 *                                    [--views front,back,side,face] [--out preview-model]
 *
 * Loads the real asset through three's GLTFLoader inside jsdom (geometry, skin
 * and clips intact), skins it in software and rasterises it with the same
 * material split the app uses — so the character can be reviewed, grounded and
 * framed without a browser or GPU.
 *
 * `--scan` steps through the clip and prints sole and crown heights, which is
 * how foot contact is verified.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import { loadGlb } from "./lib/load-glb";
import { encodePng } from "./lib/png";

type Vec3 = [number, number, number];

const flag = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
};
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const outDir = flag("out", "preview-model");
  const { gltf, mesh, atlas } = await loadGlb(flag("model", "public/models/protagonist.glb"));
  const root = gltf.scene;

  // ---- animation ----------------------------------------------------------
  const clipName = flag("anim", "");
  const clip = clipName ? gltf.animations.find((entry) => entry.name === clipName) : null;
  if (clipName && !clip) {
    throw new Error(`no clip "${clipName}"; have ${gltf.animations.map((entry) => entry.name).join(", ")}`);
  }
  const mixer = new THREE.AnimationMixer(root);
  if (clip) mixer.clipAction(clip).play();

  const seek = (time: number) => {
    if (clip) mixer.setTime(time);
    root.updateMatrixWorld(true);
    mesh.skeleton.update();
  };

  const measure = (sample = 8000) => {
    const box = new THREE.Box3();
    const point = new THREE.Vector3();
    const total = mesh.geometry.getAttribute("position").count;
    for (let i = 0; i < sample; i++) {
      mesh.getVertexPosition(Math.floor((i / sample) * total), point);
      box.expandByPoint(point.applyMatrix4(mesh.matrixWorld));
    }
    return box;
  };

  if (has("scan") && clip) {
    console.log(`  · scanning ${clip.name} (${clip.duration.toFixed(2)} s)`);
    for (let step = 0; step < 16; step++) {
      const time = (step / 16) * clip.duration;
      seek(time);
      const box = measure();
      console.log(
        `    t=${time.toFixed(2)}  sole ${box.min.y.toFixed(3)}  crown ${box.max.y.toFixed(3)}  z ${box.min.z.toFixed(2)}…${box.max.z.toFixed(2)}`,
      );
    }
    return;
  }

  seek(Number(flag("time", "0")));

  // ---- suit paint ---------------------------------------------------------
  const { paintProtagonist, suitTintAt, trimAt, PROTAGONIST } = await import(
    "../src/world/character/protagonist"
  );
  paintProtagonist(mesh);
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const uvAttr = geometry.getAttribute("uv") as THREE.BufferAttribute | undefined;
  const suitAttr = geometry.getAttribute("aSuit") as THREE.BufferAttribute;
  const index = geometry.getIndex()!;
  const world = mesh.matrixWorld;

  const atlasColour = (u: number, v: number): Vec3 => {
    if (!atlas) return [0.72, 0.51, 0.42];
    const total: Vec3 = [0, 0, 0];
    // Average a small neighbourhood: the atlas is a union of UV islands and a
    // point sample alone produces crunchy speckle at the island seams.
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const uu = u + dx * 0.0015;
        const vv = v + dy * 0.0015;
        const x = Math.min(atlas.width - 1, Math.max(0, Math.floor((uu - Math.floor(uu)) * atlas.width)));
        const y = Math.min(atlas.height - 1, Math.max(0, Math.floor((vv - Math.floor(vv)) * atlas.height)));
        const offset = (y * atlas.width + x) * 4;
        total[0] += (atlas.data[offset] / 255) ** 2.2;
        total[1] += (atlas.data[offset + 1] / 255) ** 2.2;
        total[2] += (atlas.data[offset + 2] / 255) ** 2.2;
      }
    }
    return [total[0] / 9, total[1] / 9, total[2] / 9];
  };

  const tint = new THREE.Color();
  const smoothstep = (edge0: number, edge1: number, value: number) => {
    const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };

  // ---- software skinning ---------------------------------------------------
  const points = new Map<number, THREE.Vector3>();
  const pointAt = (i: number) => {
    const cached = points.get(i);
    if (cached) return cached;
    const point = new THREE.Vector3();
    mesh.getVertexPosition(i, point);
    point.applyMatrix4(world);
    points.set(i, point);
    return point;
  };

  type Triangle = {
    a: THREE.Vector3;
    b: THREE.Vector3;
    c: THREE.Vector3;
    /** rest-space corners: the suit paint is evaluated per fragment from these */
    ra: Vec3;
    rb: Vec3;
    rc: Vec3;
    sa: number;
    sb: number;
    sc: number;
    /** baked atlas / facial colour, only used where the suit mask is low */
    ca: Vec3;
    cb: Vec3;
    cc: Vec3;
  };

  const triangles: Triangle[] = [];
  for (let t = 0; t < index.count; t += 3) {
    const ia = index.getX(t);
    const ib = index.getX(t + 1);
    const ic = index.getX(t + 2);
    const restAt = (i: number): Vec3 => [positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i)];
    const skinAt = (i: number): Vec3 =>
      uvAttr ? atlasColour(uvAttr.getX(i), uvAttr.getY(i)) : [0.72, 0.51, 0.42];
    triangles.push({
      a: pointAt(ia).clone(),
      b: pointAt(ib).clone(),
      c: pointAt(ic).clone(),
      ra: restAt(ia),
      rb: restAt(ib),
      rc: restAt(ic),
      sa: suitAttr.getX(ia),
      sb: suitAttr.getX(ib),
      sc: suitAttr.getX(ic),
      ca: skinAt(ia),
      cb: skinAt(ib),
      cc: skinAt(ic),
    });
  }

  const box = measure();
  console.log(`  · ${triangles.length.toLocaleString()} triangles painted with the suit shader`);
  console.log(
    `  · bounds y ${box.min.y.toFixed(3)}…${box.max.y.toFixed(3)}, x ${box.min.x.toFixed(3)}…${box.max.x.toFixed(3)}, z ${box.min.z.toFixed(3)}…${box.max.z.toFixed(3)}`,
  );

  const centre = box.getCenter(new THREE.Vector3());
  const height = box.max.y - box.min.y;

  // ---- rasterise -----------------------------------------------------------
  function render(
    eye: THREE.Vector3,
    target: THREE.Vector3,
    width: number,
    heightPx: number,
    fov: number,
  ): Uint8Array {
    const w = width * 2;
    const h = heightPx * 2;
    const colour = new Float32Array(w * h * 3);
    const depth = new Float32Array(w * h).fill(Number.POSITIVE_INFINITY);

    for (let y = 0; y < h; y++) {
      const t = y / h;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3;
        colour[i] = 0.014 + t * 0.02;
        colour[i + 1] = 0.022 + t * 0.032;
        colour[i + 2] = 0.03 + t * 0.046;
      }
    }

    const key = new THREE.Vector3(-0.45, 0.62, -0.65).normalize();
    const fill = new THREE.Vector3(0.7, 0.2, -0.5).normalize();
    const rim = new THREE.Vector3(0.35, 0.35, 0.87).normalize();

    const view = new THREE.Matrix4().lookAt(eye, target, new THREE.Vector3(0, 1, 0));
    const cameraMatrix = new THREE.Matrix4().makeBasis(
      new THREE.Vector3().setFromMatrixColumn(view, 0),
      new THREE.Vector3().setFromMatrixColumn(view, 1),
      new THREE.Vector3().setFromMatrixColumn(view, 2),
    );
    const inverse = cameraMatrix.clone().invert();
    const toView = (v: THREE.Vector3) => v.clone().sub(eye).applyMatrix4(inverse);
    const focal = h / 2 / Math.tan((fov * Math.PI) / 360);
    const project = (v: THREE.Vector3) => ({
      x: w / 2 + (v.x / -v.z) * focal,
      y: h / 2 - (v.y / -v.z) * focal,
    });

    for (const tri of triangles) {
      const va = toView(tri.a);
      const vb = toView(tri.b);
      const vc = toView(tri.c);
      if (va.z > -0.02 || vb.z > -0.02 || vc.z > -0.02) continue;
      const facing = tri.b.clone().sub(tri.a).cross(tri.c.clone().sub(tri.a));
      if (facing.dot(eye.clone().sub(tri.a)) <= 0) continue;

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
      const normal = facing.normalize();
      const viewDir = tri.a.clone().sub(eye).normalize();
      const shade =
        0.08 +
        0.06 * (0.5 + 0.5 * normal.y) +
        Math.max(0, normal.dot(key)) * 1.25 +
        Math.max(0, normal.dot(fill)) * 0.26 +
        Math.max(0, normal.dot(rim)) * 0.3;
      const spec = Math.max(0, normal.dot(key.clone().add(viewDir).normalize())) ** 20 * 0.14;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          const py = y + 0.5;
          const w0 = ((pb.x - px) * (pc.y - py) - (pc.x - px) * (pb.y - py)) * invArea;
          const w1 = ((pc.x - px) * (pa.y - py) - (pa.x - px) * (pc.y - py)) * invArea;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = 1 / Math.max(1e-6, w0 / -va.z + w1 / -vb.z + w2 / -vc.z);
          const pixel = y * w + x;
          if (z >= depth[pixel]) continue;
          depth[pixel] = z;
          // Mirror of the shader: interpolate the rest position and the suit
          // mask, then evaluate the same paint functions.
          const suited = tri.sa * w0 + tri.sb * w1 + tri.sc * w2;
          const rx = tri.ra[0] * w0 + tri.rb[0] * w1 + tri.rc[0] * w2;
          const ry = tri.ra[1] * w0 + tri.rb[1] * w1 + tri.rc[1] * w2;
          const rz = tri.ra[2] * w0 + tri.rb[2] * w1 + tri.rc[2] * w2;
          const suit = smoothstep(0.26, 0.74, suited);
          const trim = trimAt(rx, ry, rz);
          suitTintAt(rx, ry, tint);
          const suitColour: Vec3 = [tint.r, tint.g, tint.b];
          const luminance =
            0.299 * (tri.ca[0] * w0 + tri.cb[0] * w1 + tri.cc[0] * w2) +
            0.587 * (tri.ca[1] * w0 + tri.cb[1] * w1 + tri.cc[1] * w2) +
            0.114 * (tri.ca[2] * w0 + tri.cb[2] * w1 + tri.cc[2] * w2);
          const detail = Math.min(1.35, Math.max(0.6, luminance / 0.32));
          const seam =
            smoothstep(0.18, 0.42, suited) * (1 - smoothstep(0.58, 0.82, suited));
          const seamShade = 1 - 0.45 * seam;
          for (let channel = 0; channel < 3; channel++) {
            const skin = tri.ca[channel] * w0 + tri.cb[channel] * w1 + tri.cc[channel] * w2;
            const albedo =
              skin * (1 - suit) +
              suitColour[channel] * (1 + 0.3 * (detail - 1)) * seamShade * suit;
            const emissive = [0.294, 0.89, 1.0][channel] * trim * 1.6;
            colour[pixel * 3 + channel] = albedo * shade + spec + emissive;
          }
        }
      }
    }

    const out = new Uint8Array(width * heightPx * 4);
    const tone = (v: number) => {
      const x = (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14);
      return Math.round(Math.min(1, Math.max(0, x)) ** (1 / 2.2) * 255);
    };
    for (let y = 0; y < heightPx; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        for (let sy = 0; sy < 2; sy++) {
          for (let sx = 0; sx < 2; sx++) {
            const i = ((y * 2 + sy) * w + (x * 2 + sx)) * 3;
            r += colour[i];
            g += colour[i + 1];
            b += colour[i + 2];
          }
        }
        const o = (y * width + x) * 4;
        out[o] = tone(r / 4);
        out[o + 1] = tone(g / 4);
        out[o + 2] = tone(b / 4);
        out[o + 3] = 255;
      }
    }
    return out;
  }

  // The asset faces +Z, the engine's forward is -Z, so `front` looks from +Z.
  const views = [
    {
      name: "front",
      eye: new THREE.Vector3(centre.x, centre.y - 0.05, centre.z + height * 1.7),
      target: new THREE.Vector3(centre.x, centre.y - 0.05, centre.z),
      fov: 34,
      w: 640,
      h: 960,
    },
    {
      name: "back",
      eye: new THREE.Vector3(centre.x, centre.y - 0.05, centre.z - height * 1.7),
      target: new THREE.Vector3(centre.x, centre.y - 0.05, centre.z),
      fov: 34,
      w: 640,
      h: 960,
    },
    {
      name: "side",
      eye: new THREE.Vector3(centre.x + height * 1.7, centre.y - 0.05, centre.z),
      target: new THREE.Vector3(centre.x, centre.y - 0.05, centre.z),
      fov: 34,
      w: 640,
      h: 960,
    },
    {
      name: "face",
      eye: new THREE.Vector3(centre.x + height * 0.07, box.max.y - height * 0.085, centre.z + height * 0.22),
      target: new THREE.Vector3(centre.x, box.max.y - height * 0.07, centre.z),
      fov: 30,
      w: 640,
      h: 640,
    },
  ].filter((view) => {
    const wanted = flag("views", "");
    return !wanted || wanted.split(",").includes(view.name);
  });

  mkdirSync(outDir, { recursive: true });
  for (const view of views) {
    const pixels = render(view.eye, view.target, view.w, view.h, view.fov);
    const file = join(outDir, `${view.name}.png`);
    writeFileSync(file, encodePng(view.w, view.h, pixels));
    console.log(`  ✓ ${file}`);
  }
}

void main();
