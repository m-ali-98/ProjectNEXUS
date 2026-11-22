"use client";

import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * The protagonist asset.
 *
 * A CC0 woman base mesh (Grab3D, redistributed as
 * `harikishanbs88/woman-base-character`), decimated from 300 k to 60 k triangles
 * and re-sized to 1 k textures for the web. It arrives in its own 24-bone rig
 * with `walk` and `run` clips; this module prepares it for the facility:
 * engine facing (-Z), a painted flight suit, grounded feet and a set of actions
 * to cross-fade.
 *
 * Every number below was measured from the asset with
 * `scripts/preview-model.ts --scan`, not guessed.
 */

export const PROTAGONIST = {
  url: "/models/protagonist.glb",
  /** metres, sole to crown of the rest pose */
  height: 1.68,
  /** the asset faces +Z; a half turn aligns it with the engine's -Z forward */
  facingOffset: Math.PI,
  /**
   * The clips float the feet slightly; these offsets put the lowest sole on the
   * floor. Measured across the full cycle (walk 0.021–0.033 m, run 0.011 m).
   */
  ground: { idle: -0.025, walk: -0.024, run: -0.013 },
  /** triangles after decimation, used by the asset validator */
  triangles: 60_000,
} as const;

/** Suit palette: graphite body, blue-grey yoke, near-black gloves and boots. */
export const SUIT = {
  body: "#28344b",
  panel: "#3d516f",
  glove: "#161e2c",
  boot: "#1a2433",
  trim: "#4be3ff",
} as const;

/**
 * Per-fragment suit shading, in rest-space metres.
 *
 * The suit is painted in the fragment shader rather than split into material
 * groups: a triangle-level cut through the neck leaves a chewed collar, while an
 * analytic mask is smooth at any distance and costs one `varying`.
 *
 * `restPainterGlsl` is mirrored by `restPaint` below, which the offline preview
 * renderer uses — keep the two in step.
 */
const PAINT_GLSL = /* glsl */ `
  const vec3 SUIT_BODY = vec3(0.153, 0.204, 0.294);
  const vec3 SUIT_PANEL = vec3(0.239, 0.318, 0.435);
  const vec3 SUIT_GLOVE = vec3(0.086, 0.118, 0.173);
  const vec3 SUIT_BOOT = vec3(0.102, 0.141, 0.200);
  const vec3 SUIT_TRIM = vec3(0.294, 0.890, 1.0);

  float band(float value, float centre, float halfWidth) {
    return 1.0 - smoothstep(halfWidth, halfWidth * 1.8, abs(value - centre));
  }

  // Suit colour at a rest-space point.
  vec3 suitTintAt(vec3 rest) {
    float outward = abs(rest.x);
    float boot = 1.0 - smoothstep(0.09, 0.15, rest.y);
    float glove = smoothstep(0.195, 0.235, outward) * (1.0 - smoothstep(1.0, 1.06, rest.y));
    float yoke = smoothstep(1.285, 1.335, rest.y) * (1.0 - smoothstep(1.37, 1.42, rest.y));
    float belt = smoothstep(1.03, 1.05, rest.y) * (1.0 - smoothstep(1.062, 1.082, rest.y));

    vec3 colour = SUIT_BODY;
    colour = mix(colour, SUIT_PANEL, yoke * 0.9);
    colour = mix(colour, SUIT_GLOVE, max(glove, belt * 0.85));
    colour = mix(colour, SUIT_BOOT, boot);
    return colour;
  }

  // Cyan trim: waist line, chest badge, boot welt, collar edge.
  float trimAt(vec3 rest) {
    float outward = abs(rest.x);
    float waist = band(rest.y, 1.05, 0.007) * (1.0 - smoothstep(0.19, 0.235, outward));

    float badge = smoothstep(1.226, 1.230, rest.y) * (1.0 - smoothstep(1.254, 1.258, rest.y))
                * (1.0 - smoothstep(0.025, 0.029, outward))
                * smoothstep(0.093, 0.097, rest.z);
    // A slot cut through the badge reads as an emblem rather than a sticker.
    float slot = smoothstep(1.236, 1.238, rest.y) * (1.0 - smoothstep(1.246, 1.248, rest.y))
               * (1.0 - smoothstep(0.004, 0.006, outward));

    float welt = band(rest.y, 0.128, 0.006) * (1.0 - smoothstep(0.1, 0.13, outward));

    return clamp(max(max(waist * 0.55, badge * (1.0 - slot)), welt * 0.45), 0.0, 1.0);
  }
`;

/** TS mirror of `suitTintAt`, used by the offline preview renderer. */
export function suitTintAt(x: number, y: number, target = new THREE.Color()) {
  const outward = Math.abs(x);
  const smoothstep = (edge0: number, edge1: number, value: number) => {
    const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const boot = 1 - smoothstep(0.09, 0.15, y);
  const glove = smoothstep(0.195, 0.235, outward) * (1 - smoothstep(1.0, 1.06, y));
  const yoke = smoothstep(1.285, 1.335, y) * (1 - smoothstep(1.37, 1.42, y));
  const belt = smoothstep(1.03, 1.05, y) * (1 - smoothstep(1.062, 1.082, y));
  target.set(SUIT.body);
  target.lerp(new THREE.Color(SUIT.panel), yoke * 0.9);
  target.lerp(new THREE.Color(SUIT.glove), Math.max(glove, belt * 0.85));
  target.lerp(new THREE.Color(SUIT.boot), boot);
  return target;
}

/** TS mirror of `trimAt`, used by the offline preview renderer. */
export function trimAt(x: number, y: number, z: number) {
  const smoothstep = (edge0: number, edge1: number, value: number) => {
    const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const band = (value: number, centre: number, halfWidth: number) =>
    1 - smoothstep(halfWidth, halfWidth * 1.8, Math.abs(value - centre));
  const outward = Math.abs(x);
  const waist = band(y, 1.05, 0.007) * (1 - smoothstep(0.19, 0.235, outward));
  const badge =
    smoothstep(1.226, 1.23, y) *
    (1 - smoothstep(1.254, 1.258, y)) *
    (1 - smoothstep(0.025, 0.029, outward)) *
    smoothstep(0.093, 0.097, z);
  const slot =
    smoothstep(1.236, 1.238, y) *
    (1 - smoothstep(1.246, 1.248, y)) *
    (1 - smoothstep(0.004, 0.006, outward));
  const welt = band(y, 0.128, 0.006) * (1 - smoothstep(0.1, 0.13, outward));
  return Math.max(0, Math.min(1, Math.max(Math.max(waist * 0.55, badge * (1 - slot)), welt * 0.45)));
}

/**
 * Suit mask.
 *
 * Skin is whatever the head and neck bones drive, so the collar follows the
 * anatomy and bends with the neck instead of cutting a plane through it. Raw
 * scanned weights are noisy, hence the smoothing passes in `paintProtagonist`.
 */
function suitAmounts(mesh: THREE.SkinnedMesh): Float32Array {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const skinIndex = geometry.getAttribute("skinIndex") as THREE.BufferAttribute | undefined;
  const skinWeight = geometry.getAttribute("skinWeight") as THREE.BufferAttribute | undefined;
  const bones = mesh.skeleton?.bones ?? [];
  const headBone = bones.findIndex((bone) => /^head$/i.test(bone.name));
  const neckBone = bones.findIndex((bone) => /^neck$/i.test(bone.name));
  if (headBone === -1) throw new Error("protagonist rig has no head bone");

  const amounts = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    let head = 0;
    let neck = 0;
    if (skinIndex && skinWeight) {
      for (let slot = 0; slot < 4; slot++) {
        const weight = skinWeight.getComponent(i, slot);
        if (weight === 0) continue;
        const bone = skinIndex.getComponent(i, slot);
        if (bone === headBone) head += weight;
        else if (bone === neckBone) neck += weight;
      }
    }
    // The neck bone also drives the base of the throat; half of its weight reads
    // as skin, which puts the collar just under the jaw.
    amounts[i] = 1 - THREE.MathUtils.clamp(head + neck * 0.42, 0, 1);
  }
  return amounts;
}

/** Laplacian smoothing over the mesh graph, so the collar gradient is even. */
function smoothMask(mesh: THREE.SkinnedMesh, values: Float32Array, passes = 3) {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const index = geometry.getIndex();
  const count = values.length;
  const triangles = Math.floor((index ? index.count : count) / 3);
  const adjacency: number[][] = Array.from({ length: count }, () => []);
  const corner = (triangle: number, vertex: number) =>
    index ? index.getX(triangle * 3 + vertex) : triangle * 3 + vertex;
  for (let triangle = 0; triangle < triangles; triangle++) {
    const a = corner(triangle, 0);
    const b = corner(triangle, 1);
    const c = corner(triangle, 2);
    adjacency[a].push(b, c);
    adjacency[b].push(a, c);
    adjacency[c].push(a, b);
  }

  let current = values;
  for (let pass = 0; pass < passes; pass++) {
    const next = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const list = adjacency[i];
      let sum = current[i];
      for (const neighbour of list) sum += current[neighbour];
      next[i] = sum / (list.length + 1);
    }
    current = next;
  }
  values.set(current);
}

/** Adds the `aSuit` attribute the suit shader reads. */
export function paintProtagonist(mesh: THREE.SkinnedMesh) {
  const suit = suitAmounts(mesh);
  smoothMask(mesh, suit, 6);
  mesh.geometry.setAttribute("aSuit", new THREE.BufferAttribute(suit, 1));
  return suit;
}

/**
 * The asset's material, taught to paint a flight suit over the body while
 * keeping the scanned face, hair and atlas detail.
 */
export function createSuitMaterial(source: THREE.MeshStandardMaterial) {
  const material = new THREE.MeshPhysicalMaterial({
    map: source.map,
    normalMap: source.normalMap,
    roughnessMap: source.roughnessMap,
    metalnessMap: source.metalnessMap,
    roughness: 0.55,
    metalness: 0.2,
    clearcoat: 0.3,
    clearcoatRoughness: 0.42,
    envMapIntensity: 1.2,
    side: THREE.FrontSide,
    name: "protagonist-suit",
  });
  if (material.normalMap) material.normalScale.set(0.6, 0.6);

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float aSuit;
        varying float vSuit;
        varying vec3 vRest;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vSuit = aSuit;
        vRest = position;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vSuit;
        varying vec3 vRest;
        ${PAINT_GLSL}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        #ifdef USE_MAP
          float suit = smoothstep(0.26, 0.74, vSuit);
          float detail = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 suitColour = suitTintAt(vRest) * mix(1.0, clamp(detail / 0.32, 0.6, 1.35), 0.3);
          // The collar seam is a shadowed band: it hides the mask gradient's
          // triangle stair-step and reads as a stitched edge.
          float seam = smoothstep(0.18, 0.42, vSuit) * (1.0 - smoothstep(0.58, 0.82, vSuit));
          suitColour *= 1.0 - 0.45 * seam;
          diffuseColor.rgb = mix(diffuseColor.rgb, suitColour, suit);
        #endif`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        float suitMask = smoothstep(0.26, 0.74, vSuit);
        float trim = trimAt(vRest);
        roughnessFactor = mix(roughnessFactor, mix(0.62, 0.34, trim), suitMask);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(0.294, 0.890, 1.0) * trimAt(vRest) * 1.6;`,
      );
  };
  material.customProgramCacheKey = () => "protagonist-suit-v1";

  return material;
}

export type ProtagonistRig = {
  scene: THREE.Group;
  mesh: THREE.SkinnedMesh;
  material: THREE.MeshPhysicalMaterial;
  walk: THREE.AnimationClip;
  run: THREE.AnimationClip;
  idle: THREE.AnimationClip;
};

/**
 * Clones the loaded scene, paints it, and derives the idle pose.
 *
 * The idle is the opening frames of the walk cycle played very slowly: a
 * standing pose sampled from real animation beats a hand-built T-pose, and those
 * frames start with the feet together.
 */
export function prepareProtagonist(
  source: THREE.Object3D,
  animations: THREE.AnimationClip[],
): ProtagonistRig {
  const scene = cloneSkinned(source) as THREE.Group;
  const mesh = scene.getObjectByProperty("isSkinnedMesh", true) as THREE.SkinnedMesh | undefined;
  if (!mesh) throw new Error("protagonist asset has no skinned mesh");

  paintProtagonist(mesh);
  const original = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
    | THREE.MeshStandardMaterial
    | undefined;
  const material = createSuitMaterial(original ?? new THREE.MeshStandardMaterial());
  mesh.material = material;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  const walk = animations.find((clip) => /walk/i.test(clip.name));
  const run = animations.find((clip) => /run/i.test(clip.name));
  if (!walk || !run) throw new Error("protagonist asset is missing walk/run clips");

  const idle = THREE.AnimationUtils.subclip(walk, "idle", 0, 2, 30);
  idle.duration = 1;

  return { scene, mesh, material, walk, run, idle };
}
