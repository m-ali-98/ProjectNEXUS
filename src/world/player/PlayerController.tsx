"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useNexusStore } from "@/stores/nexusStore";
import { PLAYER, resolveCollisions } from "@/world/worldLayout";
import {
  consumeLook,
  eyePosition,
  input,
  playerState,
} from "@/world/player/playerState";
import { cameraRef, director as directorRef } from "@/world/camera/director";
import { getAudio } from "@/world/audio/audioEngine";
import { isTouchDevice } from "@/world/player/pointerLock";
import { sectorPlacements } from "@/world/worldLayout";
import type { SectorId } from "@/content/sectors";


const roomCentres: { id: Exclude<SectorId, "atrium">; x: number; z: number }[] = (
  Object.keys(sectorPlacements) as Exclude<SectorId, "atrium">[]
).map((id) => ({ id, x: sectorPlacements[id].position.x, z: sectorPlacements[id].position.z }));

function detectSector(x: number, z: number): SectorId {
  let best: SectorId = "atrium";
  let bestDist = Infinity;
  for (const room of roomCentres) {
    const d = Math.hypot(x - room.x, z - room.z);
    if (d < 26 && d < bestDist) {
      bestDist = d;
      best = room.id;
    }
  }
  return best;
}

export function PlayerController() {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const stepAccumulator = useRef(0);
  const lastSector = useRef<SectorId>("atrium");

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.rotation.order = "YXZ";
    cameraRef.camera = cam;
    return () => {
      if (cameraRef.camera === cam) cameraRef.camera = null;
    };
  }, [camera]);

  // --- keyboard -----------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      keys.current[e.code] = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.sprint = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") input.sprint = false;
    };
    const onBlur = () => {
      keys.current = {};
      input.sprint = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // --- mouse look (pointer lock) -----------------------------------------
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      input.lookX += e.movementX;
      input.lookY += e.movementY;
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  // --- pointer lock lifecycle --------------------------------------------
  useEffect(() => {
    const onLockChange = () => {
      const locked = !!document.pointerLockElement;
      const store = useNexusStore.getState();
      store.setPointerLocked(locked);
      if (!locked && store.phase === "ready" && !store.paused && !store.transitioning) {
        store.setPaused(true);
        store.setOverlay("pause");
      }
    };
    document.addEventListener("pointerlockchange", onLockChange);
    const canvas = gl.domElement;
    canvas.setAttribute("data-nexus-canvas", "true");
    const onClick = () => {
      const store = useNexusStore.getState();
      if (store.phase !== "ready" || store.paused || store.panel || store.transitioning) return;
      if (!isTouchDevice()) canvas.requestPointerLock();
    };
    canvas.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      canvas.removeEventListener("click", onClick);
    };
  }, [gl]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const store = useNexusStore.getState();
    const { settings } = store;
    const cam = camera as THREE.PerspectiveCamera;

    const touch = isTouchDevice();
    const canMove =
      store.phase === "ready" &&
      !store.paused &&
      !store.panel &&
      store.overlay === "none" &&
      !store.transitioning &&
      !directorRef.active &&
      (touch || !!document.pointerLockElement);

    // look
    if (canMove) {
      const look = consumeLook();
      const sens = 0.0021 * settings.sensitivity;
      playerState.yaw -= look.x * sens;
      playerState.pitch -= look.y * sens * (settings.invertY ? -1 : 1);
      playerState.pitch = Math.max(-PLAYER.maxPitch, Math.min(PLAYER.maxPitch, playerState.pitch));
    } else {
      consumeLook();
    }

    // keyboard axes
    let forwardAxis = 0;
    let rightAxis = 0;
    if (canMove) {
      const k = keys.current;
      if (k.KeyW || k.ArrowUp) forwardAxis += 1;
      if (k.KeyS || k.ArrowDown) forwardAxis -= 1;
      if (k.KeyD || k.ArrowRight) rightAxis += 1;
      if (k.KeyA || k.ArrowLeft) rightAxis -= 1;
      if (Math.abs(input.forward) > 0.05) forwardAxis = input.forward;
      if (Math.abs(input.right) > 0.05) rightAxis = input.right;
    }

    const wish = new THREE.Vector3(rightAxis, 0, -forwardAxis);
    const maxSpeed = input.sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    if (wish.lengthSq() > 0.0001) {
      wish.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), playerState.yaw);
      const target = wish.multiplyScalar(maxSpeed);
      const approach = Math.min(1, PLAYER.acceleration * delta / maxSpeed);
      playerState.velocity.x += (target.x - playerState.velocity.x) * approach;
      playerState.velocity.z += (target.z - playerState.velocity.z) * approach;
    } else {
      const damp = Math.max(0, 1 - PLAYER.damping * delta);
      playerState.velocity.x *= damp;
      playerState.velocity.z *= damp;
      if (Math.abs(playerState.velocity.x) < 0.001) playerState.velocity.x = 0;
      if (Math.abs(playerState.velocity.z) < 0.001) playerState.velocity.z = 0;
    }

    // integrate + collide
    playerState.position.x += playerState.velocity.x * delta;
    playerState.position.z += playerState.velocity.z * delta;
    resolveCollisions(playerState.position, PLAYER.radius, (sector) =>
      !!store.openedPortals[sector],
    );

    // gravity (single ground plane at y = 0)
    playerState.verticalVelocity -= PLAYER.gravity * delta;
    playerState.position.y += playerState.verticalVelocity * delta;
    if (playerState.position.y <= 0) {
      playerState.position.y = 0;
      playerState.verticalVelocity = 0;
      playerState.onGround = true;
    }
    playerState.position.y = 0;

    const horizontalSpeed = Math.hypot(playerState.velocity.x, playerState.velocity.z);
    playerState.speed = horizontalSpeed;
    playerState.moving = horizontalSpeed > 0.25;
    playerState.sprinting = input.sprint && horizontalSpeed > 1;

    // head bob (suppressed in reduced-motion mode)
    const motionScale = settings.motion === "reduced" ? 0 : 1;
    if (horizontalSpeed > 0.2) {
      playerState.bobPhase += delta * (7.4 + horizontalSpeed * 0.55);
      const target = Math.sin(playerState.bobPhase) * 0.028 * Math.min(1, horizontalSpeed / 4) * motionScale;
      playerState.bobAmount += (target - playerState.bobAmount) * Math.min(1, delta * 12);
      stepAccumulator.current += delta * horizontalSpeed;
      if (stepAccumulator.current > 2.4) {
        stepAccumulator.current = 0;
        getAudio().play("step");
      }
    } else {
      playerState.bobAmount *= Math.max(0, 1 - delta * 6);
    }

    // sector tracking
    const detected = detectSector(playerState.position.x, playerState.position.z);
    if (detected !== lastSector.current) {
      lastSector.current = detected;
      if (detected !== store.sector) store.setSector(detected);
      getAudio().setSector(detected);
    }

    // fov
    const targetFov = settings.fov;
    if (Math.abs(cam.fov - targetFov) > 0.1) {
      cam.fov += (targetFov - cam.fov) * Math.min(1, delta * 6);
      cam.updateProjectionMatrix();
    }

    // camera write
    if (directorRef.active) {
      cam.position.copy(directorRef.position);
      cam.quaternion.copy(directorRef.quaternion);
      cam.updateProjectionMatrix();
      return;
    }

    const eye = eyePosition(new THREE.Vector3());
    cam.position.set(eye.x, eye.y, eye.z);
    cam.rotation.set(playerState.pitch, playerState.yaw, 0, "YXZ");
    void state;
  });

  return null;
}
