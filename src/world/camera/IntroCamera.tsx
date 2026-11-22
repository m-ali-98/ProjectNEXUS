"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { PLAYER } from "@/world/worldLayout";
import { director } from "@/world/camera/director";
import { thirdPersonPose } from "@/world/camera/thirdPerson";
import { playerState, teleportTo } from "@/world/player/playerState";
import { useNexusStore } from "@/stores/nexusStore";

/**
 * Arrival cinematic (third person).
 *
 * Shot 1 frames the protagonist from the front, slightly above eye level, and
 * drifts in while the identity hologram sits behind her. Shot 2 swings behind
 * her shoulder for the reveal of the core, then hands the camera to the player
 * with a short move that ends on the normal boom position.
 */
export function IntroCamera() {
  const { camera } = useThree();
  const phase = useNexusStore((s) => s.phase);

  useEffect(() => {
    if (phase !== "intro") return;
    const cam = camera as THREE.PerspectiveCamera;

    // Player stands at (0, 0, 10.5) facing the core (−z).
    const start = new THREE.Vector3(1.75, 1.95, 7.6);
    const startLook = new THREE.Vector3(0, 1.28, 10.4);
    cam.position.copy(start);
    cam.lookAt(startLook);
    director.snap(start, startLook);
    director.active = true;

    director.shot(cam, {
      position: new THREE.Vector3(0.85, 1.62, 8.45),
      lookAt: new THREE.Vector3(0, 1.42, 10.4),
      duration: 7,
      ease: "power1.inOut",
      hold: true,
    });

    const timer = window.setTimeout(() => {
      if (useNexusStore.getState().phase !== "intro") return;
      director.shot(cam, {
        position: new THREE.Vector3(0.55, 1.95, 14.1),
        lookAt: new THREE.Vector3(0, 1.35, 8.6),
        duration: 9,
        ease: "sine.inOut",
        hold: true,
      });
    }, 6800);

    return () => {
      window.clearTimeout(timer);
      director.cancel();
    };
  }, [phase, camera]);

  useEffect(() => {
    if (phase !== "ready") return;
    const cam = camera as THREE.PerspectiveCamera;
    teleportTo(PLAYER.spawn.clone(), PLAYER.spawnYaw);
    playerState.bobAmount = 0;

    const pose = thirdPersonPose();
    director.shot(cam, {
      position: pose.position.clone(),
      lookAt: pose.lookAt.clone(),
      duration: 1.5,
      ease: "power2.inOut",
      hold: false,
    });
  }, [phase, camera]);

  return null;
}
