"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";

import { M } from "@/world/environment/materials";
import { EnergyConduit } from "@/world/environment/Effects";
import { Pedestal } from "@/world/environment/Fixtures";
import { FONT_MONO } from "@/world/environment/Architecture";
import { useQuality } from "@/lib/quality";
import { Text } from "@/world/environment/Text3D";

const STACK = [
  { label: "SOFTWARE", angle: 0 },
  { label: "BACKEND", angle: 60 },
  { label: "INTEGRATION", angle: 120 },
  { label: "INFRASTRUCTURE", angle: 180 },
  { label: "NETWORKING", angle: 240 },
  { label: "DEPLOYMENT", angle: 300 },
];

const RADIUS = 2.35;

export function HolographicCore() {
  const quality = useQuality();
  const nodes = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);

  const nodePositions = useMemo(
    () =>
      STACK.map((s, i) => {
        const a = (s.angle * Math.PI) / 180;
        const y = 2.6 + Math.sin(i * 1.7) * 0.42;
        return {
          ...s,
          position: new THREE.Vector3(Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS),
        };
      }),
    [],
  );

  const center = useMemo(() => new THREE.Vector3(0, 2.85, 0), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (nodes.current) nodes.current.rotation.y = t * 0.16;
    if (rings.current) {
      rings.current.rotation.y -= dt * 0.12;
      rings.current.children.forEach((c, i) => {
        c.rotation.x = t * (0.06 + i * 0.02) + i;
        c.rotation.z = t * 0.04 * (i + 1);
      });
    }
    if (scan.current) {
      const f = (t * 0.22) % 1;
      scan.current.position.y = 0.9 + f * 4.4;
      (scan.current.material as THREE.MeshBasicMaterial).opacity = 0.22 * Math.sin(f * Math.PI);
    }
    if (shell.current) shell.current.rotation.y = -t * 0.08;
  });

  return (
    <group>
      <Pedestal accent="cyan" w={7.0} d={7.0} h={0.55} />

      {/* central energy column */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.16, 0.34, 4.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#9ff4ff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.42, 0.7, 4.2, 16, 1, true]} />
        <meshBasicMaterial
          color="#46e6ff"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* core crystal */}
      <mesh position={[0, 2.85, 0]}>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#0a2830"
          emissive="#46e6ff"
          emissiveIntensity={2.4}
          roughness={0.2}
          metalness={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* wireframe shell */}
      <mesh ref={shell} position={[0, 2.85, 0]}>
        <icosahedronGeometry args={[1.12, 1]} />
        <meshBasicMaterial
          color="#46e6ff"
          wireframe
          transparent
          opacity={0.16}
          toneMapped={false}
        />
      </mesh>

      {/* rotating rings */}
      <group ref={rings} position={[0, 2.85, 0]}>
        {[1.5, 1.9, 2.35].map((r, i) => (
          <mesh key={r} rotation={[Math.PI / 2 + i * 0.4, i * 0.7, 0]}>
            <torusGeometry args={[r, 0.012, 4, 96]} />
            <meshBasicMaterial
              color="#6cf0ff"
              transparent
              opacity={0.34}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* stack nodes with conduits */}
      <group ref={nodes}>
        {nodePositions.map((node) => (
          <group key={node.label} position={node.position}>
            <mesh>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshBasicMaterial color="#a8f7ff" toneMapped={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial
                color="#46e6ff"
                transparent
                opacity={0.14}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <Billboard>
              <Text
                font={FONT_MONO}
                fontSize={0.115}
                color="#9fe8f5"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.2}
                position={[0, 0.42, 0]}
              >
                {node.label}
              </Text>
            </Billboard>
          </group>
        ))}
        {nodePositions.map((node) => (
          <EnergyConduit
            key={`c-${node.label}`}
            from={center}
            to={node.position}
            accent="cyan"
            thickness={0.012}
            pulses={1}
            speed={0.3}
            offset={node.angle / 360}
          />
        ))}
      </group>

      {/* ground hologram disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
        <ringGeometry args={[3.05, 3.35, 64]} />
        <meshBasicMaterial color="#46e6ff" transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
        <ringGeometry args={[2.2, 2.24, 64]} />
        <meshBasicMaterial color="#46e6ff" transparent opacity={0.18} toneMapped={false} />
      </mesh>

      {quality.id !== "performance" && (
        <mesh ref={scan} position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 3.2, 48]} />
          <meshBasicMaterial
            color="#8ff0ff"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* structural support pylons around the plinth */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 3.2, 0.42, Math.sin(a) * 3.2]}>
            <boxGeometry args={[0.18, 0.84, 0.18]} />
            <primitive object={M().darkSteel} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}
