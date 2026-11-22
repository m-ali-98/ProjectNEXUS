"use client";

import * as THREE from "three";
import { inspectPose } from "./director";
import { PLAYER, resolveCollisions } from "@/world/worldLayout";

const PROBE_RADIUS = 0.3;

function blocked(position: THREE.Vector3) {
  const probe = position.clone();
  resolveCollisions(probe, PROBE_RADIUS, () => true);
  return probe.distanceTo(position) > 0.001;
}

/**
 * Camera pose for reading an exhibit.
 *
 * Starts from the ideal inspection framing and, if that pose would sit inside a
 * wall, bulkhead or piece of furniture, slides it back toward the player's eyes
 * until it is clear. The look direction is unchanged, so the exhibit stays
 * framed; only the distance is compromised. If nothing is clear, the player's
 * own eye position is used.
 */
export function exhibitPose(target: THREE.Vector3, playerPos: THREE.Vector3) {
  const base = inspectPose(target.clone(), playerPos);
  const eye = new THREE.Vector3(playerPos.x, PLAYER.eyeHeight, playerPos.z);

  if (!blocked(base.position)) return base;

  const candidate = new THREE.Vector3();
  for (let t = 0.15; t <= 1.0001; t += 0.15) {
    candidate.lerpVectors(base.position, eye, t);
    if (!blocked(candidate)) {
      return { position: candidate.clone(), lookAt: base.lookAt };
    }
  }
  return { position: eye, lookAt: base.lookAt };
}
