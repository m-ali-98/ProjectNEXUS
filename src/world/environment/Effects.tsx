"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useQuality } from "@/lib/quality";
import { glowTexture } from "./textures";
import { ACCENT_HEX, M, type Accent } from "./materials";

/** Suspended particulate matter — the facility is never fully still. */
export function DustField({
  radius = 20,
  height = 14,
  count,
  accent = "cyan",
  opacity = 0.5,
}: {
  radius?: number;
  height?: number;
  count?: number;
  accent?: Accent;
  opacity?: number;
}) {
  const quality = useQuality();
  const amount = count ?? quality.dustMotes;
  const points = useRef<THREE.Points>(null);
  const sprite = useMemo(() => glowTexture(ACCENT_HEX[accent]), [accent]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(amount * 3);
    for (let i = 0; i < amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [amount, radius, height]);

  useFrame((state, dt) => {
    if (!points.current) return;
    points.current.rotation.y += dt * 0.012;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < amount; i += 3) {
      arr[i * 3 + 1] += dt * (0.05 + (i % 7) * 0.012);
      if (arr[i * 3 + 1] > height) arr[i * 3 + 1] = 0.2;
    }
    pos.needsUpdate = true;
    void state;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={sprite}
        color={ACCENT_HEX[accent]}
        size={0.12}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/** A glowing conduit with a travelling energy pulse. */
export function EnergyConduit({
  from,
  to,
  accent = "amber",
  thickness = 0.05,
  pulses = 2,
  speed = 0.35,
  offset = 0,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  accent?: Accent;
  thickness?: number;
  pulses?: number;
  speed?: number;
  offset?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const dots = useRef<THREE.Group>(null);
  const { midpoint, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return {
      midpoint: new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5),
      quaternion: quat,
      length: len,
    };
  }, [from, to]);

  useFrame((state) => {
    if (!dots.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    dots.current.children.forEach((child, i) => {
      const f = ((t + i / pulses) % 1 + 1) % 1;
      child.position.y = -length / 2 + f * length;
      const s = 0.6 + Math.sin(f * Math.PI) * 0.7;
      child.scale.setScalar(s);
    });
  });

  return (
    <group position={midpoint} quaternion={quaternion} ref={group}>
      <mesh>
        <cylinderGeometry args={[thickness, thickness, length, 6]} />
        <primitive object={M().accentMat(accent, 0.9)} attach="material" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[thickness * 3.4, thickness * 3.4, length, 8, 1, true]} />
        <meshBasicMaterial
          color={ACCENT_HEX[accent]}
          transparent
          opacity={0.075}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={dots}>
        {Array.from({ length: pulses }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.075, 10, 10]} />
            <meshBasicMaterial color={ACCENT_HEX[accent]} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Slow rotating holo ring used across sectors. */
export function HoloRing({
  radius,
  position,
  rotation = [0, 0, 0],
  accent = "cyan",
  speed = 0.15,
  thickness = 0.02,
  opacity = 0.35,
  segments = 72,
}: {
  radius: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  accent?: Accent;
  speed?: number;
  thickness?: number;
  opacity?: number;
  segments?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * speed;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <torusGeometry args={[radius, thickness, 4, segments]} />
      <meshBasicMaterial
        color={ACCENT_HEX[accent]}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Ceiling cable / pipe run with clamps. */
export function PipeRun({
  from,
  to,
  radius = 0.12,
  color = "#2a3238",
  clamps = 5,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
  clamps?: number;
}) {
  const { mid, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(b, a);
    return {
      mid: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
      len: dir.length(),
    };
  }, [from, to]);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.85 }),
    [color],
  );
  return (
    <group position={mid} quaternion={quat}>
      <mesh>
        <cylinderGeometry args={[radius, radius, len, 10]} />
        <primitive object={material} attach="material" />
      </mesh>
      {Array.from({ length: clamps }).map((_, i) => (
        <mesh key={i} position={[0, -len / 2 + (len / (clamps - 1)) * i, 0]}>
          <cylinderGeometry args={[radius * 1.5, radius * 1.5, 0.06, 8]} />
          <primitive object={M().trim} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
