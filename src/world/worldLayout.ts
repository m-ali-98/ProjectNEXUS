/**
 * NEXUS — facility layout and collision geometry.
 * ---------------------------------------------------------------------------
 * The facility is one continuous physical space:
 *
 *        sector room  ──  corridor (14 m)  ──  hexagonal atrium  ── ...
 *
 * Six rooms sit on a ring at 60° intervals around a central atrium. Each room
 * is authored in a local frame (front wall at z = -13, back wall at z = +13)
 * and placed with `frameFor()`, so a single set of components can build every
 * sector while their content stays completely distinct.
 *
 * Collision is intentionally analytic: wall segments, circles and oriented
 * boxes resolved against a player capsule projected to the ground plane. Static
 * architecture never needs a full physics simulation.
 */

import * as THREE from "three";
import type { SectorId } from "@/content/sectors";
import { sectorProps, type PropType } from "@/world/sectorData";

export const ATRIUM = {
  apothem: 17,
  get radius() {
    return this.apothem / Math.cos(Math.PI / 6);
  },
  get side() {
    return 2 * this.apothem * Math.tan(Math.PI / 6);
  },
  height: 18,
  doorGap: 5.4,
  wallThickness: 0.55,
} as const;

export const CORRIDOR = {
  width: ATRIUM.doorGap,
  length: 14,
  height: 4.6,
  wallThickness: 0.45,
} as const;

export const ROOM = {
  width: 36,
  depth: 26,
  halfW: 18,
  halfD: 13,
  frontZ: -13,
  backZ: 13,
} as const;

export const ROOM_DISTANCE = ATRIUM.apothem + CORRIDOR.length + ROOM.halfD; // 44
export const ROOM_FRONT_DISTANCE = ROOM_DISTANCE + ROOM.frontZ; // 31

export const PLAYER = {
  radius: 0.42,
  eyeHeight: 1.68,
  walkSpeed: 3.9,
  sprintSpeed: 7.2,
  acceleration: 34,
  damping: 11,
  gravity: 24,
  spawn: new THREE.Vector3(0, 0, 10.5),
  spawnYaw: 0,
  maxPitch: Math.PI / 2 - 0.06,
} as const;

export type SectorPlacement = {
  angle: number; // degrees, 0 = east, 90 = north
  height: number;
  position: THREE.Vector3;
  rotationY: number;
  spawn: THREE.Vector3;
  spawnYaw: number;
  portal: THREE.Vector3;
};

const SECTOR_ANGLES: Record<Exclude<SectorId, "atrium">, number> = {
  "application-lab": 0,
  "systems-core": 60,
  infrastructure: 120,
  "network-operations": 180,
  "project-archive": 240,
  "personal-quarters": 300,
};

const SECTOR_HEIGHTS: Record<Exclude<SectorId, "atrium">, number> = {
  "application-lab": 8.2,
  "systems-core": 10.5,
  infrastructure: 13.5,
  "network-operations": 9.4,
  "project-archive": 11.2,
  "personal-quarters": 6.8,
};

export const DEG = Math.PI / 180;

/** Unit direction from the atrium centre toward a sector. 0° = +X (east). */
export function dir(angleDeg: number, target = new THREE.Vector3()) {
  const a = angleDeg * DEG;
  return target.set(Math.cos(a), 0, -Math.sin(a));
}

/** Unit tangent (counter-clockwise) at an angle. */
export function tangent(angleDeg: number, target = new THREE.Vector3()) {
  const a = angleDeg * DEG;
  return target.set(-Math.sin(a), 0, -Math.cos(a));
}

const placementCache = new Map<SectorId, SectorPlacement>();

export function frameFor(id: SectorId): SectorPlacement {
  const cached = placementCache.get(id);
  if (cached) return cached;

  if (id === "atrium") {
    const p: SectorPlacement = {
      angle: 0,
      height: ATRIUM.height,
      position: new THREE.Vector3(0, 0, 0),
      rotationY: 0,
      spawn: PLAYER.spawn.clone(),
      spawnYaw: PLAYER.spawnYaw,
      portal: new THREE.Vector3(0, 0, ATRIUM.apothem),
    };
    placementCache.set(id, p);
    return p;
  }

  const angle = SECTOR_ANGLES[id];
  const rotationY = angle * DEG + Math.PI / 2;
  const position = dir(angle).multiplyScalar(ROOM_DISTANCE);

  // Local (0, 0, -11) is just inside the room's front wall.
  const spawn = new THREE.Vector3(0, 0, -11).applyMatrix4(localToWorldMatrix(id));
  // Portal trigger sits on the corridor side of the front wall.
  const portal = new THREE.Vector3(0, 0, -13.9).applyMatrix4(localToWorldMatrix(id));

  const p: SectorPlacement = {
    angle,
    height: SECTOR_HEIGHTS[id],
    position,
    rotationY,
    spawn,
    spawnYaw: (angle - 90) * DEG,
    portal,
  };
  placementCache.set(id, p);
  return p;
}

function localToWorldMatrix(id: SectorId) {
  const angle = id === "atrium" ? 0 : SECTOR_ANGLES[id];
  const rotationY = angle * DEG + Math.PI / 2;
  const center = dir(angle).multiplyScalar(ROOM_DISTANCE);
  const m = new THREE.Matrix4().makeRotationY(rotationY);
  m.setPosition(center);
  return m;
}

const tmpVec = new THREE.Vector3();

/** Convert a room-local coordinate into world space. */
export function localToWorld(id: SectorId, x: number, y: number, z: number) {
  return tmpVec.set(x, y, z).applyMatrix4(localToWorldMatrix(id)).clone();
}

/** World-space yaw that faces a given direction vector. */
export function yawFacing(from: THREE.Vector3, to: THREE.Vector3) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.atan2(-dx, -dz);
}

// ---------------------------------------------------------------------------
// Colliders
// ---------------------------------------------------------------------------

export type SegmentCollider = {
  kind: "segment";
  ax: number;
  az: number;
  bx: number;
  bz: number;
  /** Optional gate: skipped while this portal is open. */
  gate?: Exclude<SectorId, "atrium">;
};
export type CircleCollider = { kind: "circle"; x: number; z: number; r: number };
export type BoxCollider = {
  kind: "box";
  x: number;
  z: number;
  hw: number;
  hd: number;
  rot: number;
  gate?: Exclude<SectorId, "atrium">;
};

export type Collider = SegmentCollider | CircleCollider | BoxCollider;

function seg(ax: number, az: number, bx: number, bz: number, gate?: SegmentCollider["gate"]): SegmentCollider {
  return { kind: "segment", ax, az, bx, bz, gate };
}

/** Build the static collision set once. */
function buildColliders(): Collider[] {
  const out: Collider[] = [];
  const doorHalf = ATRIUM.doorGap / 2;

  // --- Atrium: six wall bays with a doorway in the middle of each ---------
  const halfSide = ATRIUM.side / 2;
  for (const meta of SECTOR_ORDER_ANGLES) {
    const m = dir(meta.angle).multiplyScalar(ATRIUM.apothem);
    const t = tangent(meta.angle);
    const aOuter = m.clone().addScaledVector(t, halfSide);
    const aDoor = m.clone().addScaledVector(t, doorHalf);
    const bDoor = m.clone().addScaledVector(t, -doorHalf);
    const bOuter = m.clone().addScaledVector(t, -halfSide);
    out.push(seg(aOuter.x, aOuter.z, aDoor.x, aDoor.z));
    out.push(seg(bDoor.x, bDoor.z, bOuter.x, bOuter.z));
  }

  // --- Columns on the outer ring (between doors) --------------------------
  for (const angle of [30, 90, 150, 210, 270, 330]) {
    const p = dir(angle).multiplyScalar(12.4);
    out.push({ kind: "circle", x: p.x, z: p.z, r: 1.15 });
  }

  // --- Central holographic plinth ----------------------------------------
  out.push({ kind: "circle", x: 0, z: 0, r: 3.55 });

  // --- Corridors ----------------------------------------------------------
  for (const meta of SECTOR_ORDER_ANGLES) {
    const inner = dir(meta.angle).multiplyScalar(ATRIUM.apothem);
    const outer = dir(meta.angle).multiplyScalar(ROOM_FRONT_DISTANCE);
    const t = tangent(meta.angle);
    const w = CORRIDOR.width / 2;
    for (const side of [-1, 1]) {
      const a = inner.clone().addScaledVector(t, w * side);
      const b = outer.clone().addScaledVector(t, w * side);
      out.push(seg(a.x, a.z, b.x, b.z));
    }
  }

  // --- Rooms --------------------------------------------------------------
  for (const meta of SECTOR_ORDER_ANGLES) {
    const m = localToWorldMatrix(meta.id);
    const pushLocalSeg = (
      ax: number,
      az: number,
      bx: number,
      bz: number,
      gate?: SegmentCollider["gate"],
    ) => {
      const a = new THREE.Vector3(ax, 0, az).applyMatrix4(m);
      const b = new THREE.Vector3(bx, 0, bz).applyMatrix4(m);
      out.push(seg(a.x, a.z, b.x, b.z, gate));
    };
    const W = ROOM.halfW;
    const D = ROOM.halfD;
    const dh = doorHalf;
    // Front wall with doorway (gate fills the doorway while closed).
    pushLocalSeg(-W, -D, -dh, -D);
    pushLocalSeg(dh, -D, W, -D);
    out.push({ ...worldSegFromLocal(meta.id, -dh, -D, dh, -D), gate: meta.id });
    // Back and side walls.
    pushLocalSeg(-W, D, W, D);
    pushLocalSeg(-W, -D, -W, D);
    pushLocalSeg(W, -D, W, D);
  }

  // --- Solid fixtures -----------------------------------------------------
  const defaults: Record<PropType, [number, number]> = {
    rack: [1.9, 1.3],
    console: [2.4, 1.1],
    station: [2.6, 1.3],
    pylon: [1.5, 1.5],
    monolith: [5.6, 1.3],
    pedestal: [3.2, 3.2],
    table: [2.8, 1.6],
    bench: [3.4, 1.3],
    cooler: [2.6, 2.2],
    crate: [1.6, 1.6],
    serverStack: [1.2, 1.0],
  };

  for (const meta of SECTOR_ORDER_ANGLES) {
    const frame = frameFor(meta.id);
    for (const prop of sectorProps[meta.id]) {
      if (!prop.solid) continue;
      const [dw, dd] = defaults[prop.type];
      const center = localToWorld(meta.id, prop.x, 0, prop.z);
      out.push({
        kind: "box",
        x: center.x,
        z: center.z,
        hw: (prop.w ?? dw) / 2,
        hd: (prop.d ?? dd) / 2,
        rot: frame.rotationY + (prop.rotY ?? 0),
      });
    }
  }

  return out;
}

function worldSegFromLocal(id: SectorId, ax: number, az: number, bx: number, bz: number) {
  const m = localToWorldMatrix(id);
  const a = new THREE.Vector3(ax, 0, az).applyMatrix4(m);
  const b = new THREE.Vector3(bx, 0, bz).applyMatrix4(m);
  return { kind: "segment" as const, ax: a.x, az: a.z, bx: b.x, bz: b.z };
}

const SECTOR_ORDER_ANGLES: { id: Exclude<SectorId, "atrium">; angle: number }[] = [
  { id: "application-lab", angle: 0 },
  { id: "systems-core", angle: 60 },
  { id: "infrastructure", angle: 120 },
  { id: "network-operations", angle: 180 },
  { id: "project-archive", angle: 240 },
  { id: "personal-quarters", angle: 300 },
];

export const staticColliders: Collider[] = buildColliders();

/**
 * Resolve a ground-plane circle against the collider set.
 * Mutates `pos` and returns true when a correction was applied.
 */
export function resolveCollisions(
  pos: THREE.Vector3,
  radius: number,
  isPortalOpen: (sector: Exclude<SectorId, "atrium">) => boolean,
) {
  let corrected = false;
  for (let pass = 0; pass < 3; pass++) {
    let hit = false;
    for (const c of staticColliders) {
      if (c.kind === "segment") {
        if (c.gate && isPortalOpen(c.gate)) continue;
        const dx = c.bx - c.ax;
        const dz = c.bz - c.az;
        const lenSq = dx * dx + dz * dz;
        let t = lenSq > 0 ? ((pos.x - c.ax) * dx + (pos.z - c.az) * dz) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        const cx = c.ax + dx * t;
        const cz = c.az + dz * t;
        const px = pos.x - cx;
        const pz = pos.z - cz;
        const distSq = px * px + pz * pz;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const push = (radius - dist) / dist;
          pos.x += px * push;
          pos.z += pz * push;
          hit = true;
        }
      } else if (c.kind === "circle") {
        const px = pos.x - c.x;
        const pz = pos.z - c.z;
        const min = radius + c.r;
        const distSq = px * px + pz * pz;
        if (distSq < min * min) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const push = (min - dist) / dist;
          pos.x += px * push;
          pos.z += pz * push;
          hit = true;
        }
      } else {
        if (c.gate && isPortalOpen(c.gate)) continue;
        const cos = Math.cos(-c.rot);
        const sin = Math.sin(-c.rot);
        const lx = (pos.x - c.x) * cos - (pos.z - c.z) * sin;
        const lz = (pos.x - c.x) * sin + (pos.z - c.z) * cos;
        const qx = Math.max(-c.hw, Math.min(c.hw, lx));
        const qz = Math.max(-c.hd, Math.min(c.hd, lz));
        let nx = lx - qx;
        let nz = lz - qz;
        let dist = Math.hypot(nx, nz);
        if (dist < radius) {
          if (dist < 0.0001) {
            // Inside the box: push out along the shallowest axis.
            const penX = c.hw - Math.abs(lx);
            const penZ = c.hd - Math.abs(lz);
            if (penX < penZ) {
              nx = Math.sign(lx) || 1;
              nz = 0;
              dist = radius + penX;
            } else {
              nx = 0;
              nz = Math.sign(lz) || 1;
              dist = radius + penZ;
            }
          }
          const inv = 1 / (dist || 0.0001);
          const push = (radius - dist) * inv;
          // Rotate the correction back into world space.
          const wx = nx * Math.cos(c.rot) - nz * Math.sin(c.rot);
          const wz = nx * Math.sin(c.rot) + nz * Math.cos(c.rot);
          pos.x += wx * push;
          pos.z += wz * push;
          hit = true;
        }
      }
    }
    if (!hit) break;
    corrected = true;
  }
  return corrected;
}

export const sectorPlacements = Object.fromEntries(
  SECTOR_ORDER_ANGLES.map(({ id }) => [id, frameFor(id)]),
) as Record<Exclude<SectorId, "atrium">, SectorPlacement>;

export const roomColliderBoxes = (id: Exclude<SectorId, "atrium">) => {
  const f = frameFor(id);
  return { center: f.position, rotationY: f.rotationY };
};
