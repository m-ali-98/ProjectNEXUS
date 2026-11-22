"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { characterMaterials } from "./characterMaterials";
import { blendPose, computePose, gaitPhase, type Pose, type PoseInputs } from "./characterPose";
import { buildRig, type RigNode } from "./rig";
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

/**
 * The protagonist.
 *
 * Geometry comes from `rig.ts` (lofted, sculpted surfaces), the pose from
 * `characterPose.ts`. This component is the glue: it walks the declarative rig,
 * registers a group per joint, and copies angles onto them every frame.
 *
 * Using the shared rig tree means the offline preview renderer draws exactly the
 * same meshes, so the model can be reviewed headlessly.
 */
export function Character() {
  const root = useRef<THREE.Group>(null);
  const joints = useRef<Record<string, THREE.Group | null>>({});
  const hair = useRef<THREE.Group>(null);

  const mats = characterMaterials();
  const blob = useBlobShadow();
  const quality = useQuality();
  const settings = useNexusStore((s) => s.settings);

  const rig = useMemo(() => buildRig(), []);

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

    // Turn toward travel, or face the camera when standing still.
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

    const inputs: PoseInputs = {
      time: state.clock.elapsedTime,
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

    rootGroup.position.y += blended.root.y;

    const apply = (
      name: string,
      rotation: { rotX: number; rotY?: number; rotZ?: number },
    ) => {
      const group = joints.current[name];
      if (!group) return;
      group.rotation.set(rotation.rotX, rotation.rotY ?? 0, rotation.rotZ ?? 0, "YXZ");
    };

    apply("hips", blended.hips);
    apply("spine", blended.spine);
    apply("chest", blended.chest);
    apply("neck", blended.neck);
    apply("head", blended.head);
    apply("shoulderL", blended.shoulderL);
    apply("shoulderR", blended.shoulderR);
    apply("elbowL", blended.elbowL);
    apply("elbowR", blended.elbowR);
    apply("wristL", blended.wristL);
    apply("wristR", blended.wristR);
    apply("thighL", blended.thighL);
    apply("thighR", blended.thighR);
    apply("kneeL", blended.kneeL);
    apply("kneeR", blended.kneeR);
    apply("ankleL", blended.ankleL);
    apply("ankleR", blended.ankleR);

    if (hair.current) {
      hair.current.rotation.x = blended.hairSwing;
      hair.current.rotation.z = blended.hairSwing * 0.4;
    }
  });

  /** Renders one rig node: a joint group with its meshes, then its children. */
  const renderNode = (node: RigNode) => (
    <group
      key={node.name}
      position={node.position}
      rotation={node.rotation ? [node.rotation[0], node.rotation[1], node.rotation[2]] : undefined}
      scale={node.scale ?? 1}
      ref={(group) => {
        if (!group) return;
        if (node.joint) joints.current[node.joint] = group;
        if (node.name === "hair") hair.current = group;
      }}
    >
      {node.parts.map((part) => (
        <mesh
          key={part.key}
          geometry={part.geometry}
          material={mats[part.material]}
          castShadow={part.shadow ?? false}
          receiveShadow={part.shadow ?? false}
        />
      ))}
      {node.children.map(renderNode)}
    </group>
  );

  return (
    <group ref={root} rotation={[0, playerState.yaw, 0]}>
      {blob && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
          <planeGeometry args={[1.25, 1.05]} />
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

      {rig.children.map(renderNode)}

      {quality.id !== "performance" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[0.42, 0.46, 40]} />
          <meshBasicMaterial color="#46e6ff" transparent opacity={0.05} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
