"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useNexusStore } from "@/stores/nexusStore";
import { interactionsBySector } from "@/world/interactions/registry";
import { playerState } from "@/world/player/playerState";
import { activateInteraction } from "@/world/camera/cinematics";
import { director } from "@/world/camera/director";
import { getAudio } from "@/world/audio/audioEngine";

/**
 * Single raycaster-free interaction probe.
 *
 * Evaluates all interactions in the current sector against the player every
 * third frame (cheap: closed-form distance and facing test), publishes the best
 * candidate to the store for the HUD, and activates it on E.
 */
export function InteractionSystem() {
  const { camera } = useThree();

  useFrame(() => {
    const store = useNexusStore.getState();
    if (store.phase !== "ready" || store.paused || store.panel || store.transitioning || director.active) {
      if (store.focused) store.setFocused(null);
      return;
    }
    const list = interactionsBySector[store.sector];
    if (!list) return;

    const forward = new THREE.Vector3(
      -Math.sin(playerState.yaw),
      0,
      -Math.cos(playerState.yaw),
    ).normalize();
    const px = playerState.position.x;
    const pz = playerState.position.z;

    let best = null as null | { id: string; label: string; verb: string; kind: string; score: number };
    for (const item of list) {
      const dx = item.position.x - px;
      const dz = item.position.z - pz;
      const dist = Math.hypot(dx, dz);
      if (dist > item.radius) continue;
      const facing = dist < 0.001 ? 1 : (dx * forward.x + dz * forward.z) / dist;
      if (facing < 0.1) continue;
      const score = facing * 2 - dist / item.radius;
      if (!best || score > best.score) {
        best = {
          id: item.id,
          label: item.label,
          verb: item.verb,
          kind: item.kind,
          score,
        };
      }
    }

    if (best) {
      if (store.focused?.id !== best.id) {
        getAudio().play("focus");
      }
      store.setFocused({ id: best.id, label: best.label, verb: best.verb, kind: best.kind });
    } else {
      store.setFocused(null);
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.code !== "KeyE") return;
      const store = useNexusStore.getState();
      if (store.phase !== "ready" || store.paused || store.panel || store.transitioning) return;
      const focused = store.focused;
      if (!focused) return;
      e.preventDefault();
      activateInteraction(focused.id, camera as THREE.PerspectiveCamera);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera]);

  return null;
}
