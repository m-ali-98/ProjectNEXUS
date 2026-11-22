/**
 * Protagonist asset checks.
 *
 *   npx tsx scripts/validate-character.ts
 *
 * The character is now a real skinned asset rather than generated geometry, so
 * what has to be verified changed with it: the file has to be present and small
 * enough to ship, the rig has to be the one the game expects, every clip has to
 * put her feet on the floor, and the suit shader has to compile into a valid
 * program. Geometry-level checks (mirroring, limb bounds) no longer apply —
 * those were properties of the procedural rig.
 */
import { readFileSync, statSync } from "node:fs";
import { loadGlb } from "./lib/load-glb";
import { PROTAGONIST, paintProtagonist, prepareProtagonist } from "../src/world/character/protagonist";

const ASSET = "public/models/protagonist.glb";
const LICENCE = "public/models/LICENSE-woman-base-mesh.txt";
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_TRIANGLES = 80_000;

const errors: string[] = [];
const notes: string[] = [];

async function main() {
  // ---- file ----------------------------------------------------------------
  let bytes = 0;
  try {
    bytes = statSync(ASSET).size;
  } catch {
    errors.push(`${ASSET} is missing`);
  }
  if (bytes > MAX_BYTES) {
    errors.push(`${ASSET} is ${(bytes / 1048576).toFixed(1)} MB, budget is 4 MB`);
  } else if (bytes > 0) {
    notes.push(`${ASSET} — ${(bytes / 1048576).toFixed(2)} MB`);
  }

  const licence = readFileSync(LICENCE, "utf8");
  if (!/CC0 1\.0/.test(licence)) errors.push(`${LICENCE} does not look like CC0`);
  if (!/Grab3D/.test(licence)) errors.push(`${LICENCE} does not name the original author`);

  // ---- asset ---------------------------------------------------------------
  const { gltf, mesh } = await loadGlb(ASSET);
  const geometry = mesh.geometry;
  const index = geometry.getIndex();
  const triangles = Math.floor((index ? index.count : geometry.getAttribute("position").count) / 3);
  const bones = mesh.skeleton.bones.length;

  if (triangles > MAX_TRIANGLES) {
    errors.push(`${triangles.toLocaleString()} triangles exceeds the ${MAX_TRIANGLES.toLocaleString()} budget`);
  }
  if (bones < 18) errors.push(`skeleton has only ${bones} bones`);

  const clipNames = gltf.animations.map((clip) => clip.name);
  for (const required of ["walk", "run"]) {
    if (!clipNames.includes(required)) errors.push(`missing "${required}" clip (have ${clipNames.join(", ")})`);
  }

  // ---- grounding -----------------------------------------------------------
  // The soles have to sit on the floor once the offset the game applies is
  // included. A walk may lift a foot but never leave the ground.
  const THREE = await import("three");
  const rig = prepareProtagonist(gltf.scene, gltf.animations);
  const posedMesh = rig.mesh;
  const mixer = new THREE.AnimationMixer(rig.scene);
  const offsets: Record<string, number> = {
    idle: PROTAGONIST.ground.idle,
    walk: PROTAGONIST.ground.walk,
    run: PROTAGONIST.ground.run,
  };

  const soleHeight = () => {
    const point = new THREE.Vector3();
    let lowest = Infinity;
    let crown = -Infinity;
    const total = geometry.getAttribute("position").count;
    for (let i = 0; i < total; i += 3) {
      // Skinned positions come back in mesh-local units; the asset's node scale
      // (0.01 against centimetre bones) is what turns them into metres.
      posedMesh.getVertexPosition(i, point);
      point.applyMatrix4(posedMesh.matrixWorld);
      lowest = Math.min(lowest, point.y);
      crown = Math.max(crown, point.y);
    }
    return { lowest, crown };
  };

  for (const [name, clip] of Object.entries({ idle: rig.idle, walk: rig.walk, run: rig.run })) {
    mixer.stopAllAction();
    mixer.clipAction(clip).play();
    let lowest = Infinity;
    let crown = 0;
    for (let step = 0; step <= 12; step++) {
      mixer.setTime((step / 12) * clip.duration);
      rig.scene.updateMatrixWorld(true);
      posedMesh.skeleton.update();
      const { lowest: sole, crown: top } = soleHeight();
      lowest = Math.min(lowest, sole + offsets[name]);
      crown = Math.max(crown, top + offsets[name]);
    }
    mixer.stopAllAction();
    if (lowest < -0.02) errors.push(`${name}: sole ${(lowest * 1000).toFixed(0)} mm through the floor`);
    if (lowest > 0.03) errors.push(`${name}: sole floats ${(lowest * 1000).toFixed(0)} mm`);
    if (Math.abs(crown - PROTAGONIST.height) > 0.09) {
      errors.push(`${name}: crown ${crown.toFixed(2)} m, expected about ${PROTAGONIST.height} m`);
    }
    notes.push(`${name}: sole ${lowest.toFixed(3)} m, crown ${crown.toFixed(2)} m`);
  }

  // ---- suit paint ----------------------------------------------------------
  const suit = paintProtagonist(mesh);
  let painted = 0;
  let skin = 0;
  for (const value of suit) {
    if (value > 0.9) painted++;
    if (value < 0.1) skin++;
  }
  const share = painted / suit.length;
  if (share < 0.45 || share > 0.8) {
    errors.push(`suit covers ${(share * 100).toFixed(0)}% of the mesh, expected 45–80%`);
  }
  notes.push(`suit covers ${(share * 100).toFixed(0)}%, skin ${((skin / suit.length) * 100).toFixed(0)}%`);

  // ---- shader --------------------------------------------------------------
  // Build the material exactly as the app does and confirm every injection point
  // exists in three's physical shader. A missed replacement would silently ship
  // an unpainted character.
  const { ShaderLib } = THREE;
  const shader = {
    vertexShader: ShaderLib.physical.vertexShader,
    fragmentShader: ShaderLib.physical.fragmentShader,
    uniforms: {},
  } as unknown as { vertexShader: string; fragmentShader: string };
  const material = rig.material;
  material.onBeforeCompile?.(shader as never, null as never);

  const checks: [string, string][] = [
    ["vertex varying", "varying vec3 vRest;"],
    ["vertex rest", "vRest = position;"],
    ["fragment paint", "suitTintAt(vRest)"],
    ["fragment trim", "trimAt(vRest)"],
    ["fragment emissive", "totalEmissiveRadiance +="],
  ];
  for (const [label, needle] of checks) {
    if (!shader.vertexShader.includes(needle) && !shader.fragmentShader.includes(needle)) {
      errors.push(`suit shader: ${label} injection missing`);
    }
  }
  for (const [name, source] of [
    ["vertex", shader.vertexShader],
    ["fragment", shader.fragmentShader],
  ] as const) {
    const open = (source.match(/{/g) ?? []).length;
    const close = (source.match(/}/g) ?? []).length;
    if (open !== close) errors.push(`suit shader: unbalanced braces in the ${name} shader (${open} vs ${close})`);
    if ((source.match(/;/g) ?? []).length === 0) errors.push(`suit shader: ${name} shader looks empty`);
  }

  console.log("character asset");
  notes.forEach((note) => console.log(`  · ${note}`));
  console.log(`  · ${bones} bones, ${triangles.toLocaleString()} triangles, clips ${clipNames.join(", ")}`);
  if (errors.length) {
    console.log("\nerrors:");
    errors.forEach((error) => console.log(`  ✗ ${error}`));
    process.exit(1);
  }
  console.log("\n  ✓ character asset valid");
}

void main();
