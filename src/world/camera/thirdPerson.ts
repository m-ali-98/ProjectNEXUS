"use client";

import * as THREE from "three";
import { playerState } from "@/world/player/playerState";
import { PLAYER, resolveCollisions } from "@/world/worldLayout";

/**
 * Third-person camera rig.
 *
 * An orbit camera anchored to the player's chest, offset toward the right
 * shoulder, that shortens its boom when geometry would come between the camera
 * and the character (a spring arm). The look direction is the same direction the
 * player's input is expressed in, so movement stays camera-relative and the
 * interaction probe keeps working unchanged.
 */

export const THIRD_PERSON = {
  distance: 3.25,
  minDistance: 0.85,
  height: 1.5,
  shoulder: 0.32,
  pitchMin: -0.62,
  pitchMax: 0.98,
  cameraRadius: 0.28,
  floorClearance: 0.32,
} as const;

const forwardFrom = (yaw: number, pitch: number, target = new THREE.Vector3()) =>
  target.set(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );

const rightFrom = (yaw: number, target = new THREE.Vector3()) =>
  target.set(Math.cos(yaw), 0, -Math.sin(yaw));

export type ThirdPersonPose = {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  distance: number;
  forward: THREE.Vector3;
};

/** True when the camera sphere at this point would intersect world geometry. */
function blocked(point: THREE.Vector3, gates: (sector: string) => boolean) {
  const probe = point.clone();
  resolveCollisions(probe, THIRD_PERSON.cameraRadius, gates);
  return probe.distanceTo(point) > 0.002;
}

export function thirdPersonPose(
  gates: (sector: string) => boolean = () => true,
  out: ThirdPersonPose = {
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    distance: THIRD_PERSON.distance,
    forward: new THREE.Vector3(),
  },
): ThirdPersonPose {
  const yaw = playerState.yaw;
  const pitch = THREE.MathUtils.clamp(
    playerState.pitch,
    THIRD_PERSON.pitchMin,
    THIRD_PERSON.pitchMax,
  );

  const forward = forwardFrom(yaw, pitch, out.forward);
  const right = rightFrom(yaw);

  const pivot = new THREE.Vector3(
    playerState.position.x,
    playerState.position.y + THIRD_PERSON.height,
    playerState.position.z,
  ).addScaledVector(right, THIRD_PERSON.shoulder);

  // Push the aim point forward so the character sits low-centre in frame.
  const aim = pivot.clone().addScaledVector(forward, 9).setY(pivot.y + forward.y * 9 + 0.12);

  // Spring arm: shorten the boom until the camera sphere is clear.
  const desired = THIRD_PERSON.distance as number;
  let distance: number = desired;
  const probe = new THREE.Vector3();
  for (let step = 0; step <= 12; step++) {
    const d = desired * (1 - step / 12);
    probe.copy(pivot).addScaledVector(forward, -d);
    if (probe.y < THIRD_PERSON.floorClearance) {
      probe.y = THIRD_PERSON.floorClearance;
    }
    if (!blocked(probe, gates)) {
      distance = d;
      break;
    }
    distance = THIRD_PERSON.minDistance;
  }

  const position = pivot.clone().addScaledVector(forward, -distance);
  // Never dip below the floor, and never rise above head height in tight rooms.
  position.y = Math.max(THIRD_PERSON.floorClearance, position.y);

  out.position.copy(position);
  out.lookAt.copy(aim);
  out.distance = distance;
  return out;
}

/** Eye-level fallback used by cinematic shots that need the player's head. */
export function playerEye(target = new THREE.Vector3()) {
  return target.set(
    playerState.position.x,
    PLAYER.eyeHeight,
    playerState.position.z,
  );
}
