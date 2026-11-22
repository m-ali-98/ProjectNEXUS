"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { PROTAGONIST, prepareProtagonist, type ProtagonistRig as Rig } from "./protagonist";
import { playerState } from "@/world/player/playerState";
import { useNexusStore } from "@/stores/nexusStore";
import { useQuality } from "@/lib/quality";

const TAU = Math.PI * 2;

const shortestAngle = (from: number, to: number) =>
  (((to - from + Math.PI) % TAU) + TAU) % TAU - Math.PI;

/** Soft blob shadow so she is grounded even where no light casts one. */
function useBlobShadow() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(0,0,0,0.6)");
    gradient.addColorStop(0.45, "rgba(0,0,0,0.32)");
    gradient.addColorStop(0.78, "rgba(0,0,0,0.1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

type Blends = { idle: number; walk: number; run: number };

/**
 * Loads the asset once, in the background.
 *
 * A manual loader rather than a suspending hook: the model is a single 2.7 MB
 * file, and this way a failed load degrades to "no character" with a console
 * warning instead of tearing down the scene — which also keeps the headless
 * render test meaningful, since there is no server to fetch from there.
 */
function useProtagonist() {
  const [rig, setRig] = useState<Rig | null>(null);
  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    try {
      loader.load(
      PROTAGONIST.url,
        (gltf) => {
          if (cancelled) return;
          try {
            setRig(prepareProtagonist(gltf.scene, gltf.animations));
          } catch (error) {
            console.warn("protagonist: could not prepare the asset", error);
          }
        },
        undefined,
        (error) => console.warn("protagonist: could not load", PROTAGONIST.url, error),
      );
    } catch (error) {
      // No document base to resolve against (headless render test), or the
      // request could not be created at all.
      console.warn("protagonist: could not request the asset", error);
    }
    return () => {
      cancelled = true;
    };
  }, []);
  return rig;
}

/**
 * The rig itself.
 *
 * Kept in its own component so the asset can stream in without holding the
 * traveller's lights and contact shadow hostage — and so the headless render
 * test still mounts something real while the GLB is unavailable.
 */
function ProtagonistRig({ rig }: { rig: Rig }) {
  const mixer = useMemo(() => new THREE.AnimationMixer(rig.scene), [rig]);
  const actions = useMemo(
    () => ({
      idle: mixer.clipAction(rig.idle),
      walk: mixer.clipAction(rig.walk),
      run: mixer.clipAction(rig.run),
    }),
    [mixer, rig],
  );
  useMemo(() => {
    // All three run continuously; the frame loop owns the weights so a blend
    // never restarts a clip mid-stride.
    for (const action of Object.values(actions)) {
      action.play();
      action.setEffectiveWeight(0);
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    actions.idle.setEffectiveWeight(1);
  }, [actions]);

  const ground = useRef(PROTAGONIST.ground.idle);
  const lean = useRef(0);
  const blends = useRef<Blends>({ idle: 1, walk: 0, run: 0 });
  const settings = useNexusStore((s) => s.settings);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.045);
    const motion = settings.motion === "reduced" ? 0.25 : 1;
    const speed = playerState.speed;
    const airborne = !playerState.onGround;

    const runBlend = THREE.MathUtils.smoothstep(speed, 3.0, 5.2);
    const moveBlend = THREE.MathUtils.clamp(speed / 1.1, 0, 1);
    const target: Blends = airborne
      ? { idle: 0.8, walk: 0.2, run: 0 }
      : {
          idle: 1 - moveBlend,
          walk: moveBlend * (1 - runBlend),
          run: moveBlend * runBlend,
        };

    const follow = Math.min(1, delta * 9);
    blends.current.idle += (target.idle - blends.current.idle) * follow;
    blends.current.walk += (target.walk - blends.current.walk) * follow;
    blends.current.run += (target.run - blends.current.run) * follow;

    actions.idle.setEffectiveWeight(blends.current.idle);
    actions.walk.setEffectiveWeight(blends.current.walk);
    actions.run.setEffectiveWeight(blends.current.run);

    // Stride length is fixed per clip, so playback speed follows ground speed.
    actions.walk.setEffectiveTimeScale(THREE.MathUtils.clamp(speed / 2.1, 0.65, 2.1) * motion);
    actions.run.setEffectiveTimeScale(THREE.MathUtils.clamp(speed / 5.0, 0.8, 1.6) * motion);
    actions.idle.setEffectiveTimeScale((airborne ? 0.1 : 0.12 + 0.36) * motion);

    mixer.update(airborne ? delta * 0.15 : delta);

    // Grounding: measured per clip, blended with the same weights as the clips.
    const weight =
      blends.current.idle + blends.current.walk + blends.current.run || 1;
    const targetGround =
      (blends.current.idle * PROTAGONIST.ground.idle +
        blends.current.walk * PROTAGONIST.ground.walk +
        blends.current.run * PROTAGONIST.ground.run) /
      weight;
    ground.current += (targetGround - ground.current) * Math.min(1, delta * 10);

    const targetLean = airborne ? -0.12 : -0.05 * moveBlend;
    lean.current += (targetLean - lean.current) * Math.min(1, delta * 5);

    rig.scene.position.y = ground.current;
    rig.scene.rotation.x = lean.current;
    rig.scene.rotation.y = 0;

    // Breathing: a small additive offset applied after the mixer writes the pose.
    const spine = rig.mesh.skeleton.bones.find((bone) => /^spine01$/i.test(bone.name));
    if (spine) {
      spine.rotation.x += Math.sin(state.clock.elapsedTime * 1.6) * 0.012 * motion;
    }
  });

  return (
    <group rotation={[0, PROTAGONIST.facingOffset, 0]}>
      <primitive object={rig.scene} />
    </group>
  );
}

/**
 * The protagonist.
 *
 * A real skinned character asset (see `protagonist.ts` for source and licence)
 * driven by the player state: walk and run clips cross-fade by speed, an idle
 * pose is sampled from the walk cycle, and the suit is shaded inside the asset's
 * own material. Foot contact is held by per-clip grounding offsets measured from
 * the asset, so her soles stay on the floor through the cycle.
 */
export function Character() {
  const root = useRef<THREE.Group>(null);
  const blob = useBlobShadow();
  const quality = useQuality();
  const facing = useRef(playerState.yaw);
  const settings = useNexusStore((s) => s.settings);
  const rig = useProtagonist();

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const group = root.current;
    if (!group) return;

    const moving = playerState.moving;
    const targetFacing = moving
      ? Math.atan2(-playerState.velocity.x, -playerState.velocity.z)
      : playerState.yaw;
    const difference = shortestAngle(facing.current, targetFacing);
    const turn = difference * Math.min(1, delta * (moving ? 9 : 6));
    facing.current += turn * (settings.motion === "reduced" ? 0.6 : 1);

    group.position.set(playerState.position.x, playerState.position.y, playerState.position.z);
    group.rotation.y = facing.current;
  });

  return (
    <group ref={root} rotation={[0, playerState.yaw, 0]}>
      {blob && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
          <planeGeometry args={[0.95, 0.8]} />
          <meshBasicMaterial
            map={blob}
            transparent
            depthWrite={false}
            opacity={0.82}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* practical key + rim that travel with her, so the silhouette reads in
          the darkest sectors */}
      <pointLight position={[0.6, 1.9, -0.9]} intensity={2.4} distance={4.5} color="#d9f2ff" decay={2} />
      <pointLight position={[-0.5, 1.5, 1.1]} intensity={1.4} distance={3.6} color="#ffd9b8" decay={2} />

      {rig && <ProtagonistRig rig={rig} />}

      {quality.id !== "performance" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[0.4, 0.44, 40]} />
          <meshBasicMaterial color="#46e6ff" transparent opacity={0.05} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

