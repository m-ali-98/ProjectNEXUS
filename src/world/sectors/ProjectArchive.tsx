"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { Sector } from "./Sector";
import { FONT_DISPLAY, FONT_MONO, ScreenPanel, Signage } from "@/world/environment/Architecture";
import { DustField, HoloRing } from "@/world/environment/Effects";
import { M } from "@/world/environment/materials";
import { projects } from "@/content/projects";
import { useQuality } from "@/lib/quality";
import { Text } from "@/world/environment/Text3D";
import { LimitedLights } from "@/world/environment/Lighting";

const POSITIONS: Record<string, [number, number]> = {
  "mission-001": [-9, -6],
  "mission-002": [9, -6],
  "mission-003": [-9, 6],
  "mission-004": [9, 6],
};

function ExhibitLight({ position, phase }: { position: [number, number]; phase: number }) {
  const cone = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!cone.current) return;
    const m = cone.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.04 + Math.sin(state.clock.elapsedTime * 0.7 + phase) * 0.012;
  });
  return (
    <group position={[position[0], 0, position[1]]}>
      <pointLight
        position={[0, 6.6, 0]}
        intensity={16}
        distance={11}
        color="#cfe9ff"
        decay={2}
      />
      <mesh ref={cone} position={[0, 7.2, 0]}>
        <cylinderGeometry args={[2.6, 0.4, 4.6, 24, 1, true]} />
        <meshBasicMaterial
          color="#bfe9ff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 9.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.3, 14]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      <mesh position={[0, 9.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <primitive object={M().ledWhite} attach="material" />
      </mesh>
    </group>
  );
}

export function ProjectArchive() {
  const quality = useQuality();

  return (
    <Sector id="project-archive">
      {projects.map((project, i) => {
        const pos = POSITIONS[project.id];
        if (!pos) return null;
        return (
          <group key={project.id}>
            <ExhibitLight position={pos} phase={i * 1.7} />
            <group position={[pos[0], 0.02, pos[1]]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.5, 3.58, 64]} />
                <meshBasicMaterial color="#46e6ff" transparent opacity={0.2} toneMapped={false} />
              </mesh>
              <HoloRing
                radius={3.54}
                position={[0, 0.08, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                accent="cyan"
                speed={0.03}
                opacity={0.18}
              />
            </group>
          </group>
        );
      })}

      {/* rear index display */}
      <ScreenPanel
        variant="archive"
        width={13}
        height={4.4}
        position={[0, 4.4, 12.35]}
        rotation={[0, Math.PI, 0]}
        accent="cyan"
      />
      <Signage
        title="PROJECT ARCHIVE"
        subtitle="Four engineering missions — architecture, decisions, limitations"
        meta="SECTOR 05"
        position={[0, 8.4, 12.1]}
        rotation={[0, Math.PI, 0]}
        width={16}
        size={0.66}
      />

      {/* mission index legend on the wall */}
      <group position={[-16.8, 2.4, 4]} rotation={[0, Math.PI / 2, 0]}>
        {projects.map((p, i) => (
          <group key={p.id} position={[0, -i * 0.62 + 0.93, 0]}>
            <Text
              font={FONT_MONO}
              fontSize={0.11}
              color="#46e6ff"
              anchorX="left"
              letterSpacing={0.16}
              position={[-1.9, 0, 0]}
            >
              {`M-${p.missionNo}`}
            </Text>
            <Text
              font={FONT_MONO}
              fontSize={0.1}
              color="#9db4c2"
              anchorX="left"
              letterSpacing={0.06}
              position={[-1.2, 0, 0]}
              maxWidth={4.2}
            >
              {p.code}
            </Text>
          </group>
        ))}
      </group>

      {/* drafting table with the discarded-approach note (discovery) */}
      <group position={[12.4, 0, 9.6]}>
        <mesh position={[0.2, 0.955, 0.1]} rotation={[-Math.PI / 2, 0, -0.18]}>
          <planeGeometry args={[0.8, 0.55]} />
          <meshStandardMaterial color="#c9d6dd" roughness={0.9} />
        </mesh>
        <mesh position={[-0.4, 0.955, -0.2]} rotation={[-Math.PI / 2, 0, 0.4]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshStandardMaterial color="#8fa2ad" roughness={0.95} />
        </mesh>
        <mesh position={[-1.3, 1.12, 0.35]}>
          <cylinderGeometry args={[0.06, 0.04, 0.32, 8]} />
          <primitive object={M().steel} attach="material" />
        </mesh>
      </group>

      <Text
        font={FONT_DISPLAY}
        fontSize={0.32}
        color="#7f96a4"
        position={[0, 3.0, 8.4]}
        rotation={[0, Math.PI, 0]}
        anchorX="center"
        letterSpacing={0.24}
      >
        MISSION INDEX
      </Text>

      <DustField radius={16} height={11} count={Math.floor(quality.particles * 0.9)} opacity={0.32} />

      <ambientLight intensity={0.3} color="#b8ccd8" />
      <LimitedLights>
      <pointLight position={[0, 4.4, -8]} intensity={10} distance={16} color="#46e6ff" decay={2} />
      <pointLight position={[0, 4.4, 9]} intensity={12} distance={16} color="#d8ecff" decay={2} />
      <pointLight position={[-12, 4, 0]} intensity={8} distance={14} color="#f2a93b" decay={2} />
      </LimitedLights>
    </Sector>
  );
}
