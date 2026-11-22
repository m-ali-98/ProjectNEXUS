/**
 * Head, face and hair.
 *
 * One sculpted skull plus a small number of *inset* features. The rule learned
 * the hard way: nothing may intersect the skull. Eyes are shallow lenses that sit
 * on the socket floor, lips and brows are patches that follow the surface, and
 * the hairline stops above the brow. Intersecting spheres produced the jagged
 * white slivers and the blob mouth of the first attempt.
 *
 * Head-local frame: origin at the neck joint, +y up, the character faces −z.
 * Crown ≈ +0.121, chin ≈ −0.081, face surface at the eyes ≈ z −0.061.
 */
import * as THREE from "three";

import { groove, loft, mirrorX, sculpt, tube, type Section, type Sculpt } from "./surface";

export const HEAD = {
  /** Centre of the cranium in head-local space. */
  centre: [0, 0.026, 0.006] as [number, number, number],
  rx: 0.0695,
  ry: 0.0945,
  rz: 0.0875,
  /** Eye centre (pupil): local position. */
  eyeX: 0.0305,
  eyeY: 0.0205,
  eyeZ: -0.0615,
  /** Almond opening. */
  eyeHalfWidth: 0.0135,
  eyeHalfHeight: 0.0068,
  mouthY: -0.0385,
  mouthZ: -0.0765,
};

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0 || 1e-6)));
  return t * t * (3 - 2 * t);
};

/** Deforms the unit sphere into a female skull. */
function skullPoint(n: THREE.Vector3, out: THREE.Vector3) {
  const [cx, cy, cz] = HEAD.centre;
  const down = smoothstep(0.1, -0.9, n.y);
  const face = smoothstep(0.05, -0.7, n.z);

  const width = HEAD.rx * (1 - 0.24 * down * down);
  const height = HEAD.ry * (1 - 0.02 * down);
  const depth = HEAD.rz * (1 + 0.045 * smoothstep(0, 0.85, n.z) - 0.06 * face);

  out.set(n.x * width + cx, n.y * height + cy, n.z * depth + cz);

  // chin comes forward; jaw corners keep the lower face from tapering to a cone
  const chin = Math.exp(-(((n.x * 2.0) ** 2 + ((n.y + 0.66) * 2.4) ** 2)));
  out.z -= 0.012 * chin * face;
  out.y -= 0.004 * chin;
  const jawCorner = Math.exp(-(((Math.abs(n.x) - 0.66) ** 2) / 0.05 + ((n.y + 0.52) ** 2) / 0.07));
  out.x += 0.005 * Math.sign(n.x) * jawCorner;
  out.z -= 0.002 * jawCorner * face;

  // flat cheek plane in front of the jaw so the lower face is not a cone
  const cheek = Math.exp(-(((Math.abs(n.x) - 0.6) ** 2) / 0.05 + ((n.y + 0.16) ** 2) / 0.1));
  out.z -= 0.0035 * cheek * face;

  return out;
}

/** Face relief. Every bump is small: the skull already carries the big form. */
const FACE: Sculpt[] = [
  // brow ridge, split at the glabella
  { at: [0.027, 0.0455, -0.062], radius: [0.028, 0.012, 0.026], amount: 0.006, falloff: 2.5, mirror: true },
  { at: [0, 0.044, -0.066], radius: [0.011, 0.012, 0.02], amount: 0.0015, falloff: 2.8 },
  // eye sockets: recessed, so the lens sits inside the opening
  { at: [HEAD.eyeX, HEAD.eyeY + 0.0015, -0.058], radius: [0.0305, 0.0215, 0.03], amount: -0.0145, falloff: 2.0, mirror: true },
  // upper lid ridge, above the almond
  { at: [HEAD.eyeX, HEAD.eyeY + 0.0105, -0.0635], radius: [0.0225, 0.0075, 0.016], amount: 0.0045, falloff: 2.3, mirror: true },
  // lower lid pad, a soft ridge under the socket
  { at: [HEAD.eyeX, HEAD.eyeY - 0.0165, -0.062], radius: [0.023, 0.0095, 0.018], amount: 0.0042, falloff: 2.4, mirror: true },
  // cheekbones
  { at: [0.05, 0.0, -0.052], radius: [0.026, 0.024, 0.03], amount: 0.007, falloff: 2.5, mirror: true },
  // temples
  { at: [0.061, 0.055, -0.022], radius: [0.022, 0.026, 0.03], amount: -0.003, falloff: 2.5, mirror: true },
  // nose bridge → tip
  { at: [0, 0.028, -0.072], radius: [0.0075, 0.02, 0.016], amount: 0.005, falloff: 2.6 },
  { at: [0, 0.002, -0.078], radius: [0.0085, 0.016, 0.016], amount: 0.009, falloff: 2.5 },
  { at: [0, -0.0185, -0.0825], radius: [0.0092, 0.0105, 0.014], amount: 0.0165, falloff: 2.1 },
  // nostril wings and the shadow under the nose
  { at: [0.0125, -0.0225, -0.0775], radius: [0.0085, 0.008, 0.011], amount: 0.0055, falloff: 2.3, mirror: true },
  { at: [0.0068, -0.0255, -0.079], radius: [0.0036, 0.0038, 0.0075], amount: -0.0045, falloff: 2.5, mirror: true },
  // philtrum
  { at: [0, -0.0265, -0.079], radius: [0.0055, 0.007, 0.011], amount: -0.0022, falloff: 2.6 },
  // upper lip (two lobes) and lower lip
  { at: [0.0078, -0.0345, -0.0775], radius: [0.0115, 0.0062, 0.012], amount: 0.0068, falloff: 2.25, mirror: true },
  { at: [0, -0.0355, -0.0785], radius: [0.0055, 0.0055, 0.01], amount: 0.0022, falloff: 2.6 },
  { at: [0, -0.0435, -0.0755], radius: [0.0145, 0.0078, 0.014], amount: 0.0068, falloff: 2.25 },
  // mouth line and corners
  { at: [0, -0.0395, -0.080], radius: [0.0175, 0.0022, 0.008], amount: -0.003, falloff: 2.2 },
  { at: [0.018, -0.0395, -0.073], radius: [0.006, 0.006, 0.011], amount: -0.003, falloff: 2.6, mirror: true },
  // chin and jawline
  { at: [0, -0.0705, -0.063], radius: [0.017, 0.015, 0.02], amount: 0.0075, falloff: 2.4 },
  { at: [0.05, -0.048, -0.026], radius: [0.02, 0.019, 0.028], amount: 0.0035, falloff: 2.5, mirror: true },
  // soft hollow under the cheekbone
  { at: [0.045, -0.026, -0.05], radius: [0.018, 0.016, 0.022], amount: -0.0022, falloff: 2.6, mirror: true },
];

export function headGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  const out = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    n.set(normal.getX(i), normal.getY(i), normal.getZ(i)).normalize();
    skullPoint(n, out);
    position.setXYZ(i, out.x, out.y, out.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  sculpt(geometry, FACE);
  return geometry;
}

/* -------------------------------------------------------------------------- */
/* Eyes                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Eye lens: a shallow dome that reads as cornea + sclera, sitting in the socket.
 * Placed at the pupil position; the parts share the eye's local frame.
 */
export type EyeSet = {
  sclera: THREE.BufferGeometry;
  iris: THREE.BufferGeometry;
  pupil: THREE.BufferGeometry;
  catchlight: THREE.BufferGeometry;
  /** Dark almond rim: lash line and the waterline. */
  rim: THREE.BufferGeometry;
  /** Soft crease above the lid. */
  crease: THREE.BufferGeometry;
  brow: THREE.BufferGeometry;
};

export function eyeGeometries(): EyeSet {
  const w = HEAD.eyeHalfWidth;
  const h = HEAD.eyeHalfHeight;

  // sclera: shallow almond dome, front surface at z = 0
  const sclera = new THREE.SphereGeometry(1, 32, 22);
  sclera.scale(w * 0.97, h * 0.94, 0.0072);
  sclera.translate(0, 0, 0.0068);

  // iris and pupil are FLAT caps on the dome: spheres read as beads
  const iris = new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42);
  iris.scale(0.0054, 0.0054, 0.0042);
  iris.rotateX(-Math.PI / 2);
  iris.translate(0, 0.0004, -0.0016);

  const pupil = new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
  pupil.scale(0.0024, 0.0024, 0.003);
  pupil.rotateX(-Math.PI / 2);
  pupil.translate(0, 0.0004, -0.0022);

  const catchlight = new THREE.SphereGeometry(0.00085, 8, 6);
  catchlight.translate(-0.0018, 0.0031, -0.0036);

  // lash line: almond outline, thick on the upper lid
  const rimPoints: THREE.Vector3[] = [];
  const rimRadii: number[] = [];
  const steps = 44;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const upper = Math.sin(a) > 0;
    rimPoints.push(
      new THREE.Vector3(
        Math.cos(a) * w * 1.03,
        Math.sin(a) * h * (upper ? 1.15 : 0.98),
        0.0045 + Math.cos(a) ** 2 * 0.0015,
      ),
    );
    rimRadii.push(upper ? 0.00085 + 0.00055 * Math.max(0, Math.sin(a)) : 0.00045);
  }
  const rim = tube(rimPoints, rimRadii, 6, 96);

  // crease / lid fold above the eye
  const creasePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const a = Math.PI * (0.06 + t * 0.88);
    creasePoints.push(
      new THREE.Vector3(
        Math.cos(a) * w * 1.16,
        Math.sin(a) * h * 1.42 + 0.0032,
        0.005 + Math.cos(a) ** 2 * 0.003,
      ),
    );
  }
  const crease = tube(
    creasePoints,
    creasePoints.map((_, i) => 0.0005 + 0.00035 * Math.sin((i / 18) * Math.PI)),
    5,
    32,
  );

  // eyebrow: tapered arc on the brow ridge
  const browPoints = [
    new THREE.Vector3(-0.0205, 0.0045, 0.0078),
    new THREE.Vector3(-0.0105, 0.0115, 0.0058),
    new THREE.Vector3(0.0015, 0.0148, 0.0048),
    new THREE.Vector3(0.014, 0.0138, 0.0052),
    new THREE.Vector3(0.0235, 0.0075, 0.008),
  ];
  const brow = tube(browPoints, [0.0014, 0.0026, 0.0028, 0.0021, 0.0009], 7, 24);

  return { sclera, iris, pupil, catchlight, rim, crease, brow };
}

/**
 * Eyelid: a skin patch running from the lid margin (the lash line) up to the
 * crease. Modelled as a strip on a sphere around the eye, so it wraps the eyeball
 * and closes the "ping-pong ball" silhouette a bare lens produces.
 */
export function eyelidGeometry(): THREE.BufferGeometry {
  const w = HEAD.eyeHalfWidth;
  const h = HEAD.eyeHalfHeight;
  const steps = 26;
  const rows = 6;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // margin angle runs from the inner canthus (a=0.12) to the outer (a=0.94π)
  for (let r = 0; r <= rows; r++) {
    const s = r / rows;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = Math.PI * (0.1 + t * 0.86);
      const margin = new THREE.Vector3(
        Math.cos(a) * w * 1.02,
        Math.sin(a) * h * 1.12,
        0.0042 + Math.cos(a) ** 2 * 0.0016,
      );
      // crease sits higher, further back, and slightly wider
      const crease = new THREE.Vector3(
        margin.x * 1.12,
        margin.y + h * 1.25,
        0.0085 + Math.cos(a) ** 2 * 0.0015,
      );
      const p = margin.clone().lerp(crease, s);
      // bulge the lid forward a little mid-way so it has thickness
      p.z -= Math.sin(s * Math.PI) * 0.0016;
      positions.push(p.x, p.y, p.z);
      uvs.push(t, s);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < steps; i++) {
      const a = r * (steps + 1) + i;
      const b = a + 1;
      const d = a + steps + 1;
      const e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Lips: two small domes that follow the mouth surface, plus a dark mouth line. */
export function lipGeometries(): {
  upper: THREE.BufferGeometry;
  lower: THREE.BufferGeometry;
  line: THREE.BufferGeometry;
} {
  const upper = new THREE.SphereGeometry(1, 28, 18);
  upper.scale(0.0178, 0.0045, 0.0068);
  sculpt(upper, [
    { at: [0.0072, 0.0012, 0.0035], radius: [0.009, 0.0045, 0.007], amount: 0.0012, falloff: 2.2, mirror: true },
  ]);

  const lower = new THREE.SphereGeometry(1, 28, 18);
  lower.scale(0.0162, 0.005, 0.0068);

  const linePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const x = (t * 2 - 1) * 0.018;
    linePoints.push(
      new THREE.Vector3(x, -Math.cos(t * Math.PI * 0.5) * 0.0006 - 0.0004, 0.0058 - Math.abs(x) * 0.1),
    );
  }
  const line = tube(linePoints, linePoints.map(() => 0.0007), 5, 24);

  return { upper, lower, line };
}

/* -------------------------------------------------------------------------- */
/* Ears                                                                        */
/* -------------------------------------------------------------------------- */

export function earGeometry(): THREE.BufferGeometry {
  const sections: Section[] = [
    { y: 0.027, rx: 0.0055, rz: 0.009, n: 2.2 },
    { y: 0.014, rx: 0.0085, rz: 0.015, n: 2.2 },
    { y: 0.0, rx: 0.009, rz: 0.0175, n: 2.2 },
    { y: -0.016, rx: 0.0075, rz: 0.014, n: 2.2 },
    { y: -0.028, rx: 0.0045, rz: 0.008, n: 2.2 },
  ];
  const geometry = loft(sections, { radial: 22, capStart: 0.005, capEnd: 0.004, domeRows: 2 });
  geometry.scale(0.55, 1, 1);
  sculpt(geometry, [
    { at: [0, 0.002, -0.007], radius: [0.005, 0.014, 0.012], amount: -0.0035, falloff: 2.2 },
    { at: [0.003, -0.006, 0.006], radius: [0.005, 0.011, 0.011], amount: 0.0022, falloff: 2.2 },
  ]);
  // tilt against the skull and sit it just behind the jaw
  geometry.rotateY(-0.36);
  geometry.rotateZ(-0.08);
  geometry.translate(0.0625, 0.012, 0.008);
  return geometry;
}

/* -------------------------------------------------------------------------- */
/* Hair                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Long hair, layered so the silhouette has volume and the face stays clear:
 * a cap whose hairline sits on the forehead, a long back mass with strand
 * grooves, a swept fringe above the brows and two pieces that fall behind the
 * jaw rather than across the cheeks.
 */
export function hairGeometries() {
  const cap = hairCap();

  const backSections: Section[] = [
    { y: 0.086, rx: 0.076, rz: 0.056, cz: 0.028, n: 2.4 },
    { y: 0.05, rx: 0.083, rz: 0.058, cz: 0.032, n: 2.4 },
    { y: 0.0, rx: 0.087, rz: 0.052, cz: 0.04, n: 2.5 },
    { y: -0.06, rx: 0.089, rz: 0.046, cz: 0.048, n: 2.6 },
    { y: -0.12, rx: 0.085, rz: 0.041, cz: 0.054, n: 2.6 },
    { y: -0.175, rx: 0.075, rz: 0.034, cz: 0.057, n: 2.6 },
    { y: -0.225, rx: 0.059, rz: 0.027, cz: 0.056, n: 2.6 },
    { y: -0.262, rx: 0.038, rz: 0.018, cz: 0.052, n: 2.4 },
    { y: -0.286, rx: 0.018, rz: 0.009, cz: 0.047, n: 2.2 },
  ];
  const back = loft(backSections, { radial: 44, capStart: 0.018, capEnd: 0.006, domeRows: 3 });
  groove(back, { count: 32, amplitude: 0.0022 });

  // side pieces: in front of the ear but behind the cheek, falling to the jaw
  const sweepCurve = (side: 1 | -1) => [
    new THREE.Vector3(side * 0.06, 0.082, -0.004),
    new THREE.Vector3(side * 0.076, 0.048, 0.006),
    new THREE.Vector3(side * 0.082, 0.0, 0.014),
    new THREE.Vector3(side * 0.079, -0.048, 0.026),
    new THREE.Vector3(side * 0.068, -0.092, 0.034),
  ];
  const sweepL = tube(sweepCurve(1), [0.012, 0.016, 0.015, 0.012, 0.005], 12, 30);
  const sweepR = mirrorX(sweepL);

  return { cap, back, sweepL, sweepR };
}

/**
 * Hair cap as a polar patch with a real hairline.
 *
 * A sphere sector cannot have a hairline (its edge is a circle at constant
 * latitude), and cutting triangles out of one leaves a stair-stepped edge across
 * the forehead. This builds the shell from the crown outward, stopping each
 * column at its own hairline height: high over the forehead, lower at the temples,
 * down to the nape at the back.
 */
function hairCap(): THREE.BufferGeometry {
  const segments = 96;
  const rings = 22;
  const [cx, cy, cz] = HEAD.centre;
  const rx = HEAD.rx * 1.085;
  const ry = HEAD.ry * 1.08;
  const rz = HEAD.rz * 1.085;

  /** Hairline height for an azimuth where 0 = forehead and π = nape. */
  const hairline = (a: number) => {
    const front = Math.max(0, Math.cos(a));
    const back = Math.max(0, -Math.cos(a));
    return 0.019 + 0.052 * front ** 1.15 - 0.034 * back ** 1.4;
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    for (let c = 0; c <= segments; c++) {
      const a = (c / segments) * Math.PI * 2;
      const h = hairline(a);
      const thetaMax = Math.acos(Math.min(0.995, Math.max(-0.995, (h - cy) / ry)));
      const theta = 0.001 + thetaMax * t;
      const sinT = Math.sin(theta);
      const x = cx + rx * sinT * Math.sin(a);
      const z = cz - rz * sinT * Math.cos(a);
      const y = cy + ry * Math.cos(theta);
      positions.push(x, y, z);
      uvs.push(c / segments, t);
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let c = 0; c < segments; c++) {
      const a = r * (segments + 1) + c;
      const b = a + 1;
      const d = a + segments + 1;
      const e = d + 1;
      // wound so the shell faces outward (checked headlessly by winding test)
      indices.push(a, b, d, b, e, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  sculpt(geometry, [
    // crown volume, swept to her left
    { at: [-0.024, 0.104, 0.012], radius: [0.07, 0.05, 0.07], amount: 0.012, falloff: 2.2 },
    { at: [0.048, 0.066, 0.03], radius: [0.04, 0.05, 0.05], amount: 0.007, falloff: 2.3 },
    // a touch of volume at the temples so the silhouette is not a bowl
    { at: [0.07, 0.03, 0.0], radius: [0.03, 0.05, 0.06], amount: 0.006, falloff: 2.3, mirror: true },
  ]);
  groove(geometry, { count: 30, amplitude: 0.0016 });

  // part line, just off centre on her left
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const angle = Math.atan2(x - 0.012, -z);
    if (Math.abs(angle) < 0.16 && y > 0.06) {
      const k = 1 - Math.abs(angle) / 0.16;
      position.setY(i, y - 0.004 * k);
      position.setX(i, x + (x > 0 ? 0.002 : -0.002) * k);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
