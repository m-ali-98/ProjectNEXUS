/**
 * Headless validation of the facility's spatial model.
 *
 *   npx tsx scripts/validate-world.ts
 *
 * Checks that:
 *  · every sector spawn point is walkable
 *  · every interaction anchor is reachable (not embedded in a collider)
 *  · no interaction overlaps another so strongly that focus is ambiguous
 *  · every interaction panel resolves to real content
 *  · rooms and corridors do not intersect each other or the atrium
 */
import * as THREE from "three";
import {
  ATRIUM,
  ROOM,
  PLAYER,
  frameFor,
  resolveCollisions,
  staticColliders,
  sectorPlacements,
} from "../src/world/worldLayout";
import { interactions, interactionsBySector } from "../src/world/interactions/registry";
import { exhibitPose } from "../src/world/camera/framing";
import { inspectPose } from "../src/world/camera/director";
import { getProject } from "../src/content/projects";
import { getSystemNode } from "../src/content/systems";
import { pipelineStages, infraTerminals } from "../src/content/infrastructure";
import { labStations } from "../src/content/lab";
import { dnsRecordTypes, mailAuth } from "../src/content/network";
import { discoveries } from "../src/content/discoveries";
import type { SectorId } from "../src/content/sectors";

const errors: string[] = [];
const warnings: string[] = [];
const note = (msg: string) => console.log(`  · ${msg}`);

function penetrates(x: number, z: number, radius: number = PLAYER.radius) {
  const probe = new THREE.Vector3(x, 0, z);
  const before = probe.clone();
  resolveCollisions(probe, radius, () => false);
  return probe.distanceTo(before) > 0.001;
}

// --- 1. spawn points --------------------------------------------------------
console.log("spawn points");
const spawns: { name: SectorId; pos: THREE.Vector3 }[] = [
  { name: "atrium", pos: PLAYER.spawn.clone() },
];
for (const id of Object.keys(sectorPlacements) as Exclude<SectorId, "atrium">[]) {
  spawns.push({ name: id, pos: frameFor(id).spawn.clone() });
}
for (const spawn of spawns) {
  if (penetrates(spawn.pos.x, spawn.pos.z)) {
    errors.push(`spawn for ${spawn.name} intersects collision geometry (${spawn.pos.x.toFixed(1)}, ${spawn.pos.z.toFixed(1)})`);
  } else {
    note(`${spawn.name}: spawn clear at ${spawn.pos.x.toFixed(1)}, ${spawn.pos.z.toFixed(1)}`);
  }
}

// --- 2. interaction reachability -------------------------------------------
// Anchors sit ON the exhibit. The usable criterion is that a standing position
// exists inside the interaction radius from which the exhibit can be faced.
console.log("interaction reachability");
const OPEN = () => true;
for (const item of interactions) {
  let reachable = false;
  for (let step = 0; step < 16 && !reachable; step++) {
    const angle = (step / 16) * Math.PI * 2;
    for (const dist of [1.3, 1.7, 2.1]) {
      if (dist > item.radius + 0.6) continue;
      const x = item.position.x + Math.cos(angle) * dist;
      const z = item.position.z + Math.sin(angle) * dist;
      const probe = new THREE.Vector3(x, 0, z);
      const before = probe.clone();
      resolveCollisions(probe, PLAYER.radius, OPEN);
      if (probe.distanceTo(before) < 0.001) {
        reachable = true;
        break;
      }
    }
  }
  if (!reachable) errors.push(`interaction ${item.id} has no standing position within ${item.radius} m`);
}
note(`${interactions.length} interactions checked for usable standing positions`);

// --- 3. focus ambiguity ----------------------------------------------------
console.log("focus separation");
for (const [sector, list] of Object.entries(interactionsBySector)) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      // Exclude door/bulkhead/exit pairs which are intentionally colocated.
      if (a.kind === "portal" || b.kind === "portal") continue;
      const d = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
      if (d < 1.2) {
        warnings.push(`${sector}: ${a.id} and ${b.id} are only ${d.toFixed(2)} m apart`);
      }
    }
  }
}

// --- 3b. panel framing -----------------------------------------------------
// The camera parks 2.2 m in front of an exhibit while its panel is open. That
// pose must stay inside the room and out of the furniture.
console.log("panel framing");
let framingAdjusted = 0;
for (const item of interactions) {
  if (!item.panel) continue;
  // Approach from the room entry, i.e. the worst case a player can create.
  const pose = exhibitPose(item.position.clone(), frameFor(item.sector).spawn);
  if (pose.position.y < 0.5 || pose.position.y > 6.4) {
    errors.push(`${item.id}: inspect camera at y=${pose.position.y.toFixed(2)} is outside head height range`);
  }
  if (penetrates(pose.position.x, pose.position.z, 0.25)) {
    errors.push(`${item.id}: inspect camera is inside geometry at ${pose.position.x.toFixed(1)}, ${pose.position.z.toFixed(1)}`);
  }
  const ideal = inspectPose(item.position.clone(), frameFor(item.sector).spawn);
  if (ideal.position.distanceTo(pose.position) > 0.2) framingAdjusted += 1;
}
note(`${framingAdjusted} exhibit poses were pulled back to stay clear of geometry`);

// --- 4. panel payloads -----------------------------------------------------
console.log("panel payloads");
for (const item of interactions) {
  const panel = item.panel;
  if (!panel) continue;
  switch (panel.kind) {
    case "project":
      if (!getProject(panel.id)) errors.push(`${item.id}: unknown project ${panel.id}`);
      break;
    case "systemNode":
      if (!getSystemNode(panel.id)) errors.push(`${item.id}: unknown system node ${panel.id}`);
      break;
    case "pipeline":
      if (!pipelineStages.some((s) => s.id === panel.id)) errors.push(`${item.id}: unknown pipeline stage ${panel.id}`);
      break;
    case "infraTerminal":
      if (!infraTerminals.some((t) => t.id === panel.id)) errors.push(`${item.id}: unknown terminal ${panel.id}`);
      break;
    case "labStation":
      if (!labStations.some((s) => s.id === panel.id)) errors.push(`${item.id}: unknown lab station ${panel.id}`);
      break;
    case "dnsRecord":
      if (!dnsRecordTypes.some((r) => r.id === panel.id)) errors.push(`${item.id}: unknown dns record ${panel.id}`);
      break;
    case "mailAuth":
      if (!mailAuth.some((m) => m.id === panel.id)) errors.push(`${item.id}: unknown mail record ${panel.id}`);
      break;
    case "discovery":
      if (!discoveries.some((d) => d.id === panel.id)) errors.push(`${item.id}: unknown discovery ${panel.id}`);
      break;
    default:
      break;
  }
  if (item.discoveryId && !discoveries.some((d) => d.id === item.discoveryId)) {
    errors.push(`${item.id}: unknown discovery ${item.discoveryId}`);
  }
}

// --- 5. room separation ----------------------------------------------------
console.log("room separation");
const rooms = Object.keys(sectorPlacements) as Exclude<SectorId, "atrium">[];
for (let i = 0; i < rooms.length; i++) {
  for (let j = i + 1; j < rooms.length; j++) {
    const a = frameFor(rooms[i]);
    const b = frameFor(rooms[j]);
    const d = a.position.distanceTo(b.position);
    const diagonal = Math.hypot(ROOM.halfW, ROOM.halfD);
    if (d < Math.hypot(ROOM.halfW, ROOM.halfD) * 1.2) {
      warnings.push(`${rooms[i]} and ${rooms[j]} centres are ${d.toFixed(1)} m apart (diagonal ${diagonal.toFixed(1)})`);
    }
  }
  const p = frameFor(rooms[i]).position;
  if (p.length() - Math.hypot(ROOM.halfW, ROOM.halfD) < ATRIUM.radius) {
    warnings.push(`${rooms[i]} is close to the atrium shell`);
  }
}

// --- report ---------------------------------------------------------------
console.log(`\ncolliders: ${staticColliders.length}`);
console.log(`interactions: ${interactions.length}`);
console.log(`warnings: ${warnings.length}`);
warnings.forEach((w) => console.log(`  ! ${w}`));
console.log(`errors: ${errors.length}`);
errors.forEach((e) => console.log(`  ✗ ${e}`));
process.exit(errors.length > 0 ? 1 : 0);
