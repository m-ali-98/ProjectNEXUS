/**
 * Reachability check for the facility.
 *
 *   npx tsx scripts/validate-connectivity.ts
 *
 * Flood-fills the walkable floor from the atrium spawn using the same
 * collision resolver the player uses. Every sector spawn must be reachable
 * with doorways open; the atrium must be sealed with doorways closed.
 */
import * as THREE from "three";
import { PLAYER, frameFor, localToWorld, resolveCollisions } from "../src/world/worldLayout";
import type { SectorId } from "../src/content/sectors";

const STEP = 0.4;
const MIN_X = -72;
const MAX_X = 72;
const MIN_Z = -72;
const MAX_Z = 72;

function walkable(x: number, z: number, gatesOpen: boolean) {
  const probe = new THREE.Vector3(x, 0, z);
  const start = probe.clone();
  resolveCollisions(probe, PLAYER.radius, () => gatesOpen);
  return probe.distanceTo(start) < 0.0001;
}

function flood(gatesOpen: boolean) {
  const cols = Math.floor((MAX_X - MIN_X) / STEP);
  const rows = Math.floor((MAX_Z - MIN_Z) / STEP);
  const visited = new Uint8Array(cols * rows);
  const key = (i: number, j: number) => i * rows + j;
  const toGrid = (v: number, min: number) => Math.round((v - min) / STEP);

  const startI = toGrid(PLAYER.spawn.x, MIN_X);
  const startJ = toGrid(PLAYER.spawn.z, MIN_Z);
  const queue: [number, number][] = [[startI, startJ]];
  visited[key(startI, startJ)] = 1;

  while (queue.length) {
    const [i, j] = queue.pop()!;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      if (visited[key(ni, nj)]) continue;
      const x = MIN_X + ni * STEP;
      const z = MIN_Z + nj * STEP;
      if (!walkable(x, z, gatesOpen)) continue;
      visited[key(ni, nj)] = 1;
      queue.push([ni, nj]);
    }
  }

  return {
    has(x: number, z: number) {
      const i = toGrid(x, MIN_X);
      const j = toGrid(z, MIN_Z);
      if (i < 0 || j < 0 || i >= cols || j >= rows) return false;
      // Allow a half-cell tolerance for spawn offsets landing beside a grid line.
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const ni = i + di;
          const nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
          if (visited[key(ni, nj)]) return true;
        }
      }
      return false;
    },
    count: visited.reduce((a, b) => a + b, 0),
  };
}

const open = flood(true);
const closed = flood(false);

const sectors: SectorId[] = [
  "atrium",
  "application-lab",
  "systems-core",
  "infrastructure",
  "network-operations",
  "project-archive",
  "personal-quarters",
];

const errors: string[] = [];
console.log(`walkable cells (doors open): ${open.count}`);
for (const id of sectors) {
  const pos = id === "atrium" ? PLAYER.spawn : frameFor(id).spawn;
  const ok = open.has(pos.x, pos.z);
  console.log(`  ${ok ? "✓" : "✗"} ${id} reachable at ${pos.x.toFixed(1)}, ${pos.z.toFixed(1)}`);
  if (!ok) errors.push(`${id} is not reachable from the atrium`);
  // Interior coverage: sample a local grid and measure how much of the open
  // floor is reachable (props legitimately occupy part of it).
  if (id !== "atrium") {
    let free = 0;
    let reached = 0;
    for (let x = -16; x <= 16; x += 2) {
      for (let z = -11; z <= 11; z += 2) {
        const p = localToWorld(id, x, 0, z);
        if (!walkable(p.x, p.z, true)) continue;
        free += 1;
        if (open.has(p.x, p.z)) reached += 1;
      }
    }
    const pct = free ? Math.round((reached / free) * 100) : 0;
    console.log(`    interior coverage ${pct}% (${reached}/${free} open samples)`);
    if (pct < 90) errors.push(`${id}: only ${pct}% of its open floor is reachable`);
  }
}

console.log(`walkable cells (doors closed): ${closed.count}`);
if (closed.count > open.count) {
  errors.push("closing the bulkheads increased the walkable area");
}

console.log(`errors: ${errors.length}`);
errors.forEach((e) => console.log(`  ✗ ${e}`));
process.exit(errors.length ? 1 : 0);
