"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { PLAYER } from "@/world/worldLayout";
import { director } from "@/world/camera/director";
import { playerState, teleportTo } from "@/world/player/playerState";
import { useNexusStore } from "@/stores/nexusStore";

/**
 * Startup cinematic. The camera is owned by the director from the first frame:
 * a slow reveal of the atrium, then a held inspection pose until the visitor
 * takes control. Entering the facility hands the camera back with a short,
 * non-clipping move to the player's eyes.
 */
export function IntroCamera() {
  const { camera } = useThree();
  const phase = useNexusStore((s) => s.phase);

  useEffect(() => {
    if (phase !== "intro") return;
    const cam = camera as THREE.PerspectiveCamera;
    // Inside the atrium shell (apothem 17 m) so the reveal never frames the
    // exterior of the building.
    const start = new THREE.Vector3(0, 11.6, 13.4);
    const startLook = new THREE.Vector3(0, 5.4, -1.5);
    cam.position.copy(start);
    cam.lookAt(startLook);
    director.snap(start, startLook);
    director.active = true;

    director.shot(cam, {
      position: new THREE.Vector3(0, 6.6, 12.6),
      lookAt: new THREE.Vector3(0, 3.4, 0),
      duration: 7,
      ease: "power1.inOut",
      hold: true,
    });

    const timer = window.setTimeout(() => {
      if (useNexusStore.getState().phase !== "intro") return;
      director.shot(cam, {
        position: new THREE.Vector3(0, 2.35, 10.9),
        lookAt: new THREE.Vector3(0, 2.55, 0),
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
    const eye = new THREE.Vector3(PLAYER.spawn.x, PLAYER.eyeHeight, PLAYER.spawn.z);
    const look = new THREE.Vector3(
      eye.x - Math.sin(PLAYER.spawnYaw) * 4,
      eye.y,
      eye.z - Math.cos(PLAYER.spawnYaw) * 4,
    );
    director.shot(cam, {
      position: eye,
      lookAt: look,
      duration: 1.5,
      ease: "power2.inOut",
      hold: false,
    });
  }, [phase, camera]);

  return null;
}
