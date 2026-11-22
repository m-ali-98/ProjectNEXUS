import * as THREE from "three";
import type { SectorId } from "@/content/sectors";
import { PLAYER, frameFor } from "@/world/worldLayout";

/**
 * Mutable player state.
 *
 * Deliberately outside React: the player integrates at frame rate and must not
 * trigger a re-render per frame. Only coarse events (sector change, focus
 * change, panel open) go through the Zustand store.
 */
export const playerState = {
  position: new THREE.Vector3().copy(PLAYER.spawn),
  velocity: new THREE.Vector3(),
  yaw: PLAYER.spawnYaw as number,
  pitch: 0,
  bobPhase: 0,
  bobAmount: 0,
  verticalVelocity: 0,
  onGround: true,
  sprinting: false,
  moving: false,
  speed: 0,
  sector: "atrium" as SectorId,
};

export const input = {
  forward: 0,
  right: 0,
  sprint: false,
  lookX: 0,
  lookY: 0,
  jump: false,
};

export function consumeLook() {
  const x = input.lookX;
  const y = input.lookY;
  input.lookX = 0;
  input.lookY = 0;
  return { x, y };
}

export function teleportTo(
  position: THREE.Vector3,
  yaw: number,
  pitch: number = 0,
) {
  playerState.position.copy(position);
  playerState.position.y = 0;
  playerState.velocity.set(0, 0, 0);
  playerState.verticalVelocity = 0;
  playerState.yaw = yaw;
  playerState.pitch = pitch;
  playerState.bobAmount = 0;
}

export function spawnInSector(sector: SectorId) {
  if (sector === "atrium") {
    teleportTo(PLAYER.spawn.clone(), PLAYER.spawnYaw);
    playerState.sector = "atrium";
    return;
  }
  const frame = frameFor(sector);
  teleportTo(frame.spawn.clone(), frame.spawnYaw);
  playerState.sector = sector;
}

export function exitSectorToAtrium(sector: Exclude<SectorId, "atrium">) {
  const frame = frameFor(sector);
  // Stand a few metres inside the atrium on the side of the sector we left,
  // looking back toward the holographic core.
  const a = frame.angle * (Math.PI / 180);
  const pos = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)).multiplyScalar(13.4);
  teleportTo(pos, frame.spawnYaw + Math.PI);
  playerState.sector = "atrium";
}

/** Eye pose used by the camera focus system. */
export function eyePosition(target = new THREE.Vector3()) {
  return target.set(
    playerState.position.x,
    PLAYER.eyeHeight + playerState.bobAmount,
    playerState.position.z,
  );
}
