"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BODY } from "./characterData";
import {
  blendPose,
  computePose,
  gaitPhase,
  type Pose,
  type PoseInputs,
} from "./characterPose";
import { characterMaterials } from "./characterMaterials";
import { HeadModel, Hair } from "./Head";
import {
  Forearm,
  Hand,
  Heel,
  Shin,
  ShoulderCap,
  Thigh,
  Torso,
  UpperArm,
} from "./Body";
import { playerState } from "@/world/player/playerState";
import { useNexusStore } from "@/stores/nexusStore";
import { useQuality } from "@/lib/quality";

const TAU = Math.PI * 2;

const shortestAngle = (from: number, to: number) =>
  ((to - from + Math.PI) % TAU + TAU) % TAU - Math.PI;

/** Soft blob shadow so the character is grounded where no shadow-casting light exists. */
function useBlobShadow() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(0,0,0,0.62)");
    gradient.addColorStop(0.45, "rgba(0,0,0,0.34)");
    gradient.addColorStop(0.78, "rgba(0,0,0,0.1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

type Joints = {
  hips: THREE.Group | null;
  spine: THREE.Group | null;
  chest: THREE.Group | null;
  neck: THREE.Group | null;
  head: THREE.Group | null;
  shoulderL: THREE.Group | null;
  shoulderR: THREE.Group | null;
  elbowL: THREE.Group | null;
  elbowR: THREE.Group | null;
  wristL: THREE.Group | null;
  wristR: THREE.Group | null;
  thighL: THREE.Group | null;
  thighR: THREE.Group | null;
  kneeL: THREE.Group | null;
  kneeR: THREE.Group | null;
  ankleL: THREE.Group | null;
  ankleR: THREE.Group | null;
};

function applyJoint(
  group: THREE.Group | null,
  rotation: { rotX: number; rotY?: number; rotZ?: number },
) {
  if (!group) return;
  group.rotation.set(rotation.rotX, rotation.rotY ?? 0, rotation.rotZ ?? 0, "YXZ");
}

/**
 * The protagonist.
 *
 * A procedural humanoid (no external assets): lathed bodysuit, sculpted head and
 * face, layered hair, articulated hands and stiletto heels. Movement comes from
 * `characterPose.ts`; this component only copies angles onto the joint groups
 * and follows the authoritative player position.
 */
export function Character() {
  const root = useRef<THREE.Group>(null);
  const joints = useRef<Joints>({
    hips: null,
    spine: null,
    chest: null,
    neck: null,
    head: null,
    shoulderL: null,
    shoulderR: null,
    elbowL: null,
    elbowR: null,
    wristL: null,
    wristR: null,
    thighL: null,
    thighR: null,
    kneeL: null,
    kneeR: null,
    ankleL: null,
    ankleR: null,
  });

  const mats = characterMaterials();
  const blob = useBlobShadow();
  const quality = useQuality();
  const settings = useNexusStore((s) => s.settings);

  const phase = useRef(0);
  const facing = useRef(playerState.yaw);
  const turnRate = useRef(0);
  const poseRef = useRef<Pose | null>(null);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const rootGroup = root.current;
    if (!rootGroup) return;

    const speed = playerState.speed;
    const moving = playerState.moving;
    const motion = settings.motion === "reduced" ? 0.2 : 1;

    // The body turns toward travel, but keeps facing the camera when idle.
    const targetFacing = moving
      ? Math.atan2(-playerState.velocity.x, -playerState.velocity.z)
      : playerState.yaw;
    const difference = shortestAngle(facing.current, targetFacing);
    const turnStep = difference * Math.min(1, delta * (moving ? 9 : 6));
    facing.current += turnStep;
    turnRate.current = turnStep / Math.max(delta, 0.0001);

    rootGroup.position.set(
      playerState.position.x,
      playerState.position.y,
      playerState.position.z,
    );
    rootGroup.rotation.y = facing.current;

    phase.current = gaitPhase(phase.current, speed, delta, playerState.sprinting);
    const idleTime = state.clock.elapsedTime;

    const inputs: PoseInputs = {
      time: idleTime,
      speed,
      sprinting: playerState.sprinting,
      moving,
      turnRate: turnRate.current,
      motion,
      lookYaw: shortestAngle(facing.current, playerState.yaw),
      lookPitch: playerState.pitch,
    };

    const target = computePose(inputs, phase.current);
    const previous = poseRef.current ?? target;
    const blended = blendPose(previous, target, 14, delta);
    poseRef.current = blended;

    const j = joints.current;
    rootGroup.position.y += blended.root.y;

    applyJoint(j.hips, blended.hips);
    applyJoint(j.spine, blended.spine);
    applyJoint(j.chest, blended.chest);
    applyJoint(j.neck, blended.neck);
    applyJoint(j.head, blended.head);
    applyJoint(j.shoulderL, blended.shoulderL);
    applyJoint(j.shoulderR, blended.shoulderR);
    applyJoint(j.elbowL, blended.elbowL);
    applyJoint(j.elbowR, blended.elbowR);
    applyJoint(j.wristL, blended.wristL);
    applyJoint(j.wristR, blended.wristR);
    applyJoint(j.thighL, blended.thighL);
    applyJoint(j.thighR, blended.thighR);
    applyJoint(j.kneeL, blended.kneeL);
    applyJoint(j.kneeR, blended.kneeR);
    applyJoint(j.ankleL, blended.ankleL);
    applyJoint(j.ankleR, blended.ankleR);
  });

  return (
    <group ref={root} rotation={[0, playerState.yaw, 0]}>
      {/* grounding shadow */}
      {blob && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
          <planeGeometry args={[1.35, 1.15]} />
          <meshBasicMaterial
            map={blob}
            transparent
            depthWrite={false}
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* practical key + rim light that travels with her, so the silhouette reads
          even in the darkest sectors */}
      <pointLight position={[0.6, 1.9, -0.9]} intensity={2.6} distance={4.5} color="#d9f2ff" decay={2} />
      <pointLight position={[-0.5, 1.5, 1.1]} intensity={1.5} distance={3.6} color="#ffd9b8" decay={2} />

      <group
        ref={(node) => {
          joints.current.hips = node;
        }}
        position={[0, BODY.hip, 0]}
      >
        <group
          ref={(node) => {
            joints.current.spine = node;
          }}
          position={[0, 0.12, 0]}
        >
          {/* the torso shell spans the hip profile; shift it back to the hip plane */}
          <group position={[0, -0.12, 0]}>
            <Torso />
          </group>

          <group
            ref={(node) => {
              joints.current.chest = node;
            }}
            position={[0, 0.2, 0]}
          >
            <group
              ref={(node) => {
                joints.current.neck = node;
              }}
              position={[0, 0.245, 0]}
            >
              <mesh material={mats.skin} position={[0, 0.035, 0]}>
                <cylinderGeometry args={[0.034, 0.041, 0.1, 18]} />
              </mesh>
              <group
                ref={(node) => {
                  joints.current.head = node;
                }}
                position={[0, 0.175, 0]}
              >
                <HeadModel />
                <Hair />
              </group>
            </group>

            {/* shoulders */}
            {([1, -1] as const).map((side) => (
              <group
                key={side}
                ref={(node) => {
                  if (side === 1) joints.current.shoulderL = node;
                  else joints.current.shoulderR = node;
                }}
                position={[side * 0.168, 0.185, 0]}
                rotation={[0, 0, side * 0.16]}
              >
                <ShoulderCap />
                <UpperArm />
                <group
                  ref={(node) => {
                    if (side === 1) joints.current.elbowL = node;
                    else joints.current.elbowR = node;
                  }}
                  position={[0, -0.29, 0]}
                >
                  <Forearm />
                  <group
                    ref={(node) => {
                      if (side === 1) joints.current.wristL = node;
                      else joints.current.wristR = node;
                    }}
                    position={[0, -0.26, 0]}
                  >
                    <Hand side={side} />
                  </group>
                </group>
              </group>
            ))}
          </group>
        </group>

        {/* legs */}
        {([1, -1] as const).map((side) => (
          <group
            key={`leg-${side}`}
            ref={(node) => {
              if (side === 1) joints.current.thighL = node;
              else joints.current.thighR = node;
            }}
            position={[side * BODY.hipHalfWidth, 0, 0]}
            rotation={[0, 0, side * 0.015]}
          >
            <Thigh />
            <group
              ref={(node) => {
                if (side === 1) joints.current.kneeL = node;
                else joints.current.kneeR = node;
              }}
              position={[0, -0.4, 0]}
            >
              <Shin />
              <group
                ref={(node) => {
                  if (side === 1) joints.current.ankleL = node;
                  else joints.current.ankleR = node;
                }}
                position={[0, -0.39, 0]}
              >
                <Heel side={side} />
              </group>
            </group>
          </group>
        ))}
      </group>

      {/* faint floor contact ring, quality-gated */}
      {quality.id !== "performance" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[0.42, 0.46, 40]} />
          <meshBasicMaterial color="#46e6ff" transparent opacity={0.05} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
