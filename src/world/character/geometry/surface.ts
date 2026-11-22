/**
 * Procedural surface toolkit.
 *
 * The character is not assembled from primitives any more: every body part is a
 * lofted surface (`loft`) over a stack of superellipse cross-sections, then
 * sculpted with smooth falloff displacements (`sculpt`). That is what makes the
 * waist, ribcage, hips, bust, calves and deltoids flow into each other instead of
 * reading as stacked cylinders.
 *
 * Everything here is pure three.js: no React, no DOM. `scripts/preview-character.ts`
 * rasterises the exact same geometry, so what is measured headlessly is what ships.
 */
import * as THREE from "three";

export type Section = {
  /** Position along the local axis. */
  y: number;
  /** Half-width (x). */
  rx: number;
  /** Half-depth (z). */
  rz: number;
  /** Centre offset on x, for asymmetric sections such as the calf. */
  cx?: number;
  /** Centre offset on z. */
  cz?: number;
  /** Superellipse exponent: 2 = ellipse, 4 = rounded rectangle. */
  n?: number;
  /** Rotation of the section about the axis, radians. */
  twist?: number;
};

export type LoftOptions = {
  /** Vertices around the circumference. */
  radial?: number;
  /** Dome height at the first section, in metres. 0 keeps it open/flat. */
  capStart?: number;
  /** Dome height at the last section. */
  capEnd?: number;
  /** Rows used to subdivide each dome. */
  domeRows?: number;
  /** Flatten caps with a disc instead of a dome. */
  flatStart?: boolean;
  flatEnd?: boolean;
};

const TAU = Math.PI * 2;

/** A point on a superellipse, rotated by the section twist. */
function sectionPoint(section: Section, angle: number, out: THREE.Vector3) {
  const n = Math.max(1.4, section.n ?? 2);
  const e = 2 / n;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  let x = section.rx * Math.sign(c) * Math.abs(c) ** e;
  let z = section.rz * Math.sign(s) * Math.abs(s) ** e;
  if (section.twist) {
    const ct = Math.cos(section.twist);
    const st = Math.sin(section.twist);
    const nx = x * ct - z * st;
    z = x * st + z * ct;
    x = nx;
  }
  out.set((section.cx ?? 0) + x, section.y, (section.cz ?? 0) + z);
}

/**
 * Lofts a closed tube through a list of sections ordered by ascending `y`.
 *
 * The circumference is wrapped (no duplicated seam vertices) so
 * `computeVertexNormals` produces a smooth surface all the way round. Ends are
 * either domed, capped with a flat disc, or left open.
 */
export function loft(sections: Section[], options: LoftOptions = {}): THREE.BufferGeometry {
  if (sections.length < 2) throw new Error("loft needs at least two sections");
  const radial = Math.max(8, options.radial ?? 28);
  const rows = Math.max(2, options.domeRows ?? 5);

  const stack: Section[] = [];

  const dome = (section: Section, direction: 1 | -1, height: number) => {
    for (let i = 1; i <= rows; i++) {
      const phi = (i / (rows + 1)) * (Math.PI / 2);
      const k = Math.cos(phi);
      stack.push({
        ...section,
        y: section.y + direction * height * Math.sin(phi),
        rx: section.rx * k,
        rz: section.rz * k,
        cx: section.cx,
        cz: section.cz,
      });
    }
  };

  const start = sections[0];
  if (options.capStart && options.capStart > 0) {
    dome(start, -1, options.capStart);
  }
  stack.push(...sections);
  const end = sections[sections.length - 1];
  if (options.capEnd && options.capEnd > 0) {
    dome(end, 1, options.capEnd);
  }

  const rowsCount = stack.length;
  const positions = new Float32Array(rowsCount * radial * 3);
  const uvs = new Float32Array(rowsCount * radial * 2);
  const point = new THREE.Vector3();

  for (let r = 0; r < rowsCount; r++) {
    const section = stack[r];
    for (let c = 0; c < radial; c++) {
      const angle = (c / radial) * TAU;
      sectionPoint(section, angle, point);
      const i = (r * radial + c) * 3;
      positions[i] = point.x;
      positions[i + 1] = point.y;
      positions[i + 2] = point.z;
      const j = (r * radial + c) * 2;
      uvs[j] = c / radial;
      uvs[j + 1] = r / (rowsCount - 1);
    }
  }

  const indices: number[] = [];
  for (let r = 0; r < rowsCount - 1; r++) {
    for (let c = 0; c < radial; c++) {
      const next = (c + 1) % radial;
      const a = r * radial + c;
      const b = r * radial + next;
      const d = (r + 1) * radial + c;
      const e = (r + 1) * radial + next;
      indices.push(a, d, b, b, d, e);
    }
  }

  const flatStart = options.flatStart ?? false;
  const flatEnd = options.flatEnd ?? false;
  const hasStartCap = (options.capStart ?? 0) > 0 || flatStart;
  const hasEndCap = (options.capEnd ?? 0) > 0 || flatEnd;

  // Caps are a fan to a single apex vertex: a dome apex, or the centre of a disc.
  const totalVertices = rowsCount * radial + (hasStartCap ? 1 : 0) + (hasEndCap ? 1 : 0);
  const pos = new Float32Array(totalVertices * 3);
  const uv = new Float32Array(totalVertices * 2);
  pos.set(positions);
  uv.set(uvs);

  let cursor = rowsCount * radial;
  /**
   * Apex placement matters: the dome rows already taper the ring toward the cap
   * height, so the apex belongs at `end.y ± height` — offsetting it from the
   * *last dome row* instead leaves a spike poking out of every joint.
   */
  const addApex = (
    section: Section,
    fromRow: Section,
    direction: 1 | -1,
    height: number,
    flat: boolean,
  ) => {
    const i = cursor++;
    pos[i * 3] = fromRow.cx ?? section.cx ?? 0;
    pos[i * 3 + 1] = flat ? fromRow.y : section.y + direction * height;
    pos[i * 3 + 2] = fromRow.cz ?? section.cz ?? 0;
    uv[i * 2] = 0.5;
    uv[i * 2 + 1] = direction > 0 ? 1 : 0;
    return i;
  };

  if (hasStartCap) {
    const apex = addApex(start, stack[0], -1, options.capStart ?? 0, flatStart);
    for (let c = 0; c < radial; c++) {
      const next = (c + 1) % radial;
      indices.push(c, next, apex);
    }
  }
  if (hasEndCap) {
    const last = rowsCount - 1;
    const apex = addApex(end, stack[last], 1, options.capEnd ?? 0, flatEnd);
    for (let c = 0; c < radial; c++) {
      const next = (c + 1) % radial;
      indices.push(last * radial + c, apex, last * radial + next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Lofts cross-sections stacked along z, with each ring an ellipse in x/y.
 * Shoe lasts and other fore-aft forms need this: a y-loft cannot express a heel
 * counter tapering into a pointed toe.
 */
export function loftZ(
  sections: {
    z: number;
    rx: number;
    ry: number;
    cx?: number;
    cy?: number;
    n?: number;
  }[],
  { radial = 28, capStart = 0, capEnd = 0, domeRows = 3 }: {
    radial?: number;
    capStart?: number;
    capEnd?: number;
    domeRows?: number;
  } = {},
): THREE.BufferGeometry {
  const rows = sections.length;
  const stack: typeof sections = [];

  const dome = (section: (typeof sections)[number], direction: 1 | -1, depth: number) => {
    for (let i = 1; i <= domeRows; i++) {
      const phi = (i / (domeRows + 1)) * (Math.PI / 2);
      const k = Math.cos(phi);
      stack.push({
        ...section,
        z: section.z + direction * depth * Math.sin(phi),
        rx: section.rx * k,
        ry: section.ry * k,
      });
    }
  };

  if (capStart > 0) dome(sections[0], -1, capStart);
  stack.push(...sections);
  if (capEnd > 0) dome(sections[rows - 1], 1, capEnd);

  const total = stack.length;
  const positions = new Float32Array(total * radial * 3);
  const uvs = new Float32Array(total * radial * 2);

  for (let r = 0; r < total; r++) {
    const section = stack[r];
    const n = Math.max(1.6, section.n ?? 2.2);
    const e = 2 / n;
    for (let c = 0; c < radial; c++) {
      const angle = (c / radial) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = (section.cx ?? 0) + section.rx * Math.sign(cos) * Math.abs(cos) ** e;
      const y = (section.cy ?? 0) + section.ry * Math.sign(sin) * Math.abs(sin) ** e;
      const i = (r * radial + c) * 3;
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = section.z;
      const j = (r * radial + c) * 2;
      uvs[j] = c / radial;
      uvs[j + 1] = r / (total - 1);
    }
  }

  const indices: number[] = [];
  for (let r = 0; r < total - 1; r++) {
    for (let c = 0; c < radial; c++) {
      const next = (c + 1) % radial;
      const a = r * radial + c;
      const b = r * radial + next;
      const d = (r + 1) * radial + c;
      const e2 = (r + 1) * radial + next;
      indices.push(a, b, d, b, e2, d);
    }
  }

  const hasStart = capStart > 0;
  const hasEnd = capEnd > 0;
  const pos = new Float32Array((total * radial + (hasStart ? 1 : 0) + (hasEnd ? 1 : 0)) * 3);
  const uv = new Float32Array((total * radial + (hasStart ? 1 : 0) + (hasEnd ? 1 : 0)) * 2);
  pos.set(positions);
  uv.set(uvs);
  let cursor = total * radial;

  if (hasStart) {
    const s0 = sections[0];
    const i = cursor++;
    pos[i * 3] = s0.cx ?? 0;
    pos[i * 3 + 1] = s0.cy ?? 0;
    pos[i * 3 + 2] = s0.z - capStart;
    for (let c = 0; c < radial; c++) indices.push(c, (c + 1) % radial, i);
  }
  if (hasEnd) {
    const s1 = sections[rows - 1];
    const base = (total - 1) * radial;
    const i = cursor++;
    pos[i * 3] = s1.cx ?? 0;
    pos[i * 3 + 1] = s1.cy ?? 0;
    pos[i * 3 + 2] = s1.z + capEnd;
    for (let c = 0; c < radial; c++) indices.push(base + c, i, base + ((c + 1) % radial));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export type Sculpt = {
  /** Centre of the falloff, in the geometry's local space. */
  at: [number, number, number];
  /** Falloff radii per axis. */
  radius: number | [number, number, number];
  /** Peak displacement in metres, along the surface normal by default. */
  amount: number;
  /** Fixed displacement direction instead of the vertex normal. */
  dir?: [number, number, number];
  /** Falloff sharpness; higher is tighter. */
  falloff?: number;
  /** Mirror the falloff across x = 0 (two bumps). */
  mirror?: boolean;
};

/**
 * Pushes vertices along their normals with a smooth Gaussian falloff.
 *
 * This is how the bust, glutes, deltoids, calf bellies and the face's brow /
 * cheekbones / nose / lips are formed: one continuous skin, locally inflated.
 */
export function sculpt(geometry: THREE.BufferGeometry, sculpts: Sculpt[]) {
  geometry.computeVertexNormals();
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normal = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const point = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const expand = (s: Sculpt, mirrored: boolean) => {
    const radius = Array.isArray(s.radius) ? s.radius : [s.radius, s.radius, s.radius];
    const at: [number, number, number] = [mirrored ? -s.at[0] : s.at[0], s.at[1], s.at[2]];
    return { ...s, radius, at };
  };

  const list = sculpts.flatMap((s) => (s.mirror ? [expand(s, false), expand(s, true)] : [expand(s, false)]));

  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i);
    nrm.fromBufferAttribute(normal, i);
    let dx = 0;
    let dy = 0;
    let dz = 0;
    for (const s of list) {
      const ex = (point.x - s.at[0]) / s.radius[0];
      const ey = (point.y - s.at[1]) / s.radius[1];
      const ez = (point.z - s.at[2]) / s.radius[2];
      const q = ex * ex + ey * ey + ez * ez;
      const weight = Math.exp(-q * (s.falloff ?? 2.4));
      if (weight < 1e-4) continue;
      if (s.dir) {
        dir.set(s.dir[0], s.dir[1], s.dir[2]).normalize();
        dx += dir.x * s.amount * weight;
        dy += dir.y * s.amount * weight;
        dz += dir.z * s.amount * weight;
      } else {
        dx += nrm.x * s.amount * weight;
        dy += nrm.y * s.amount * weight;
        dz += nrm.z * s.amount * weight;
      }
    }
    if (dx || dy || dz) {
      position.setXYZ(i, point.x + dx, point.y + dy, point.z + dz);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Smoothly scales x/z per height, e.g. to taper a limb toward the wrist. */
export function taper(
  geometry: THREE.BufferGeometry,
  fn: (y: number, x: number, z: number) => number,
) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const k = fn(y, position.getX(i), position.getZ(i));
    position.setX(i, position.getX(i) * k);
    position.setZ(i, position.getZ(i) * k);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Bends a geometry along its local y axis (a simple circular arc). */
export function bend(
  geometry: THREE.BufferGeometry,
  { from, to, amount }: { from: number; to: number; amount: number },
) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const span = to - from || 1;
  for (let i = 0; i < position.count; i++) {
    const t = Math.min(1, Math.max(0, (position.getY(i) - from) / span));
    const k = t * t * (3 - 2 * t);
    position.setZ(i, position.getZ(i) + amount * k);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Rounded, slightly flattened shape used for palms, shoe parts and pads. */
export function roundedBox(
  width: number,
  height: number,
  depth: number,
  radius = 0.01,
  segments = 10,
): THREE.BufferGeometry {
  const sections: Section[] = [];
  const rows = 9;
  const r = Math.min(radius, height / 2 - 0.0005, width / 2 - 0.0005);
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    const y = -height / 2 + t * height;
    const edge = Math.min(1, Math.min(t, 1 - t) * 3.4);
    const k = Math.sin((edge * Math.PI) / 2);
    sections.push({
      y,
      rx: (width / 2) * (0.45 + 0.55 * k),
      rz: (depth / 2) * (0.55 + 0.45 * k),
      n: 3.4,
    });
  }
  const geometry = loft(sections, {
    radial: segments * 2,
    capStart: r,
    capEnd: r,
    domeRows: 3,
  });
  return geometry;
}

/**
 * Variable-radius tube along a Catmull-Rom curve — hair strands, brows, lashes,
 * lash lines. Uses Frenet frames so it does not pinch on tight curves.
 */
export function tube(
  points: THREE.Vector3[],
  radii: number[],
  radial = 8,
  samples?: number,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  const steps = Math.max(4, samples ?? Math.max(8, points.length * 4));
  const frames = curve.computeFrenetFrames(steps, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const radiusAt = (t: number) => {
    if (radii.length === 1) return radii[0];
    const x = t * (radii.length - 1);
    const i = Math.min(radii.length - 2, Math.floor(x));
    const f = x - i;
    return radii[i] * (1 - f) + radii[i + 1] * f;
  };

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curve.getPoint(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusAt(t);
    for (let c = 0; c < radial; c++) {
      const a = (c / radial) * TAU;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      positions.push(
        p.x + (N.x * nx + B.x * ny) * r,
        p.y + (N.y * nx + B.y * ny) * r,
        p.z + (N.z * nx + B.z * ny) * r,
      );
      uvs.push(c / radial, t);
    }
  }

  for (let i = 0; i < steps; i++) {
    for (let c = 0; c < radial; c++) {
      const next = (c + 1) % radial;
      const a = i * radial + c;
      const b = i * radial + next;
      const d = (i + 1) * radial + c;
      const e = (i + 1) * radial + next;
      indices.push(a, d, b, b, d, e);
    }
  }

  // Close both ends with a fan to the curve endpoints.
  const start = curve.getPoint(0);
  const end = curve.getPoint(1);
  const startIndex = positions.length / 3;
  positions.push(start.x, start.y, start.z);
  uvs.push(0.5, 0);
  const endIndex = startIndex + 1;
  positions.push(end.x, end.y, end.z);
  uvs.push(0.5, 1);
  for (let c = 0; c < radial; c++) {
    const next = (c + 1) % radial;
    indices.push(c, next, startIndex);
    const base = steps * radial;
    indices.push(base + c, endIndex, base + next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Radially grooves a surface around the local y axis (hair, fabric ribs). */
export function groove(
  geometry: THREE.BufferGeometry,
  { count, amplitude, phase = 0 }: { count: number; amplitude: number; phase?: number },
) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-5) continue;
    const angle = Math.atan2(z, x);
    const delta = Math.sin(angle * count + phase) * amplitude;
    const k = (r + delta) / r;
    position.setX(i, x * k);
    position.setZ(i, z * k);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Deletes triangles whose centroid satisfies `cut`. Used to open the hair shell
 * over the face: a spherical cap cannot have a hairline, a cut shell can.
 */
export function cutFaces(
  geometry: THREE.BufferGeometry,
  cut: (centroid: THREE.Vector3) => boolean,
): THREE.BufferGeometry {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const index = geometry.getIndex();
  if (!index) return geometry;

  const kept: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i);
    const ib = index.getX(i + 1);
    const ic = index.getX(i + 2);
    a.fromBufferAttribute(position, ia);
    b.fromBufferAttribute(position, ib);
    c.fromBufferAttribute(position, ic);
    centroid.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    if (cut(centroid)) continue;
    kept.push(ia, ib, ic);
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute("position", position.clone());
  const uv = geometry.getAttribute("uv");
  if (uv) result.setAttribute("uv", uv.clone());
  result.setIndex(kept);
  result.computeVertexNormals();
  result.computeBoundingSphere();
  return result;
}

/** Mirrors a geometry across x = 0, fixing the reversed triangle winding. */
export function mirrorX(input: THREE.BufferGeometry): THREE.BufferGeometry {
  const geometry = input.clone();
  geometry.scale(-1, 1, 1);
  const index = geometry.getIndex();
  if (index) {
    const array = index.array as unknown as number[];
    for (let i = 0; i < array.length; i += 3) {
      const a = array[i];
      array[i] = array[i + 2];
      array[i + 2] = a;
    }
    index.needsUpdate = true;
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Convenience: merge a list of geometries that share attribute layout. */
export function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const geometry of list) {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const uv = geometry.getAttribute("uv") as THREE.BufferAttribute | undefined;
    const index = geometry.getIndex();
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      uvs.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
    }
    if (index) {
      for (let i = 0; i < index.count; i++) indices.push(index.getX(i) + offset);
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(i + offset);
    }
    offset += pos.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex(indices);
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}
