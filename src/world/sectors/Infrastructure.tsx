"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { Sector } from "./Sector";
import { FONT_MONO, ScreenPanel, Signage } from "@/world/environment/Architecture";
import { DustField, EnergyConduit, PipeRun } from "@/world/environment/Effects";
import { PipelinePylon } from "@/world/environment/Fixtures";
import { M } from "@/world/environment/materials";
import { pipelineStages } from "@/content/infrastructure";
import { useQuality } from "@/lib/quality";
import { Text } from "@/world/environment/Text3D";
import { LimitedLights } from "@/world/environment/Lighting";
import { useNexusStore } from "@/stores/nexusStore";

function Beacon() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 1.4;
    const light = ref.current.children[ref.current.children.length - 1] as THREE.PointLight;
    if (light) light.intensity = 4 + Math.sin(state.clock.elapsedTime * 4) * 3;
  });
  return (
    <group ref={ref} position={[0, 10.6, 6]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.4, 18]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.3, 18]} />
        <primitive object={M().ledAmber} attach="material" />
      </mesh>
      <mesh position={[0, -0.1, -0.35]} rotation={[0.6, 0, 0]}>
        <coneGeometry args={[0.3, 3.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#f2a93b"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, -0.4, 0]} color="#f2a93b" intensity={5} distance={10} />
    </group>
  );
}

function CoolingDucts() {
  return (
    <group>
      <PipeRun from={[-15, 12.6, -12]} to={[-15, 12.6, 12]} radius={0.42} color="#2c343a" clamps={5} />
      <PipeRun from={[15, 12.6, -12]} to={[15, 12.6, 12]} radius={0.42} color="#2c343a" clamps={5} />
      <PipeRun from={[-15, 11.8, -12]} to={[-15, 11.8, 12]} radius={0.18} color="#3a444b" clamps={4} />
      <PipeRun from={[15, 11.8, -12]} to={[15, 11.8, 12]} radius={0.18} color="#3a444b" clamps={4} />
      <PipeRun from={[-14, 12.2, -2]} to={[14, 12.2, -2]} radius={0.55} color="#262e33" clamps={3} />
      <PipeRun from={[-14, 12.2, 6]} to={[14, 12.2, 6]} radius={0.55} color="#262e33" clamps={3} />
      {/* cable trays */}
      {[-6.4, 6.4].map((x) => (
        <mesh key={x} position={[x, 11.4, 0]}>
          <boxGeometry args={[0.9, 0.12, 22]} />
          <primitive object={M().grate} attach="material" />
        </mesh>
      ))}
      {/* vents */}
      {[-9, 0, 9].map((z) => (
        <group key={z} position={[0, 12.9, z]}>
          <mesh>
            <boxGeometry args={[3.6, 0.4, 1.2]} />
            <primitive object={M().darkSteel} attach="material" />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <boxGeometry args={[3.2, 0.05, 0.9]} />
            <primitive object={M().grate} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RackRowMarkings() {
  return (
    <group>
      {[-12.6, 12.6].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x + (x < 0 ? 1.5 : -1.5), 0.028, 0]}>
          <planeGeometry args={[0.35, 22]} />
          <primitive object={M().hazard} attach="material" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]}>
        <planeGeometry args={[9.4, 22]} />
        <meshBasicMaterial color="#0b1116" transparent opacity={0.45} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Infrastructure() {
  const quality = useQuality();
  const openStage = useNexusStore((s) => (s.panel?.kind === "pipeline" ? s.panel.id : null));
  const focusedId = useNexusStore((s) => s.focused?.id ?? null);
  const activeStage = openStage ?? (focusedId?.startsWith("inf-stage-") ? focusedId : null);
  const pylonPositions = useMemo(
    () => pipelineStages.map((stage, i) => ({ stage, z: -8 + i * 4 })),
    [],
  );
  const floorY = 0.22;

  return (
    <Sector id="infrastructure">
      <CoolingDucts />
      <RackRowMarkings />
      <Beacon />

      {/* deployment pipeline pylons + floor conduits */}
      {pylonPositions.map(({ stage, z }) => (
        <group key={stage.id} position={[0, 0, z]}>
          <PipelinePylon
            index={stage.index}
            label={stage.label}
            code={stage.code}
            accent="amber"
            active={activeStage === stage.id}
          />
          <Text
            font={FONT_MONO}
            fontSize={0.085}
            color="#7f96a4"
            position={[0, 0.05, 0.9]}
            rotation={[-Math.PI / 2, 0, 0]}
            anchorX="center"
            letterSpacing={0.2}
          >
            {stage.code}
          </Text>
        </group>
      ))}
      {pylonPositions.slice(0, -1).map(({ stage, z }, i) => {
        const next = pylonPositions[i + 1];
        return (
          <group key={`conduit-${stage.id}`}>
            <EnergyConduit
              from={new THREE.Vector3(0, floorY, z + 0.9)}
              to={new THREE.Vector3(0, floorY, next.z - 0.9)}
              accent="amber"
              thickness={activeStage === stage.id || activeStage === next.stage.id ? 0.05 : 0.03}
              pulses={activeStage === stage.id || activeStage === next.stage.id ? 3 : 2}
              speed={activeStage ? 0.5 : 0.32}
              offset={i * 0.2}
            />
          </group>
        );
      })}
      <Text
        font={FONT_MONO}
        fontSize={0.13}
        color="#f2a93b"
        position={[0, 2.3, -8]}
        anchorX="center"
        letterSpacing={0.3}
      >
        DEPLOYMENT PATH
      </Text>

      {/* rear display */}
      <ScreenPanel
        variant="pipeline"
        width={13}
        height={4.8}
        position={[0, 5.4, 12.35]}
        rotation={[0, Math.PI, 0]}
        accent="amber"
      />
      <Signage
        title="INFRASTRUCTURE"
        subtitle="DNS → TLS → Nginx → Node.js → Services — select any stage to inspect it"
        meta="SECTOR 03"
        position={[0, 8.8, 12.1]}
        rotation={[0, Math.PI, 0]}
        width={16}
        size={0.68}
        accent="amber"
      />

      {/* observation glass partition */}
      <group position={[-15.4, 0, 4.4]}>
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[0.08, 4.8, 6]} />
          <primitive object={M().glass} attach="material" />
        </mesh>
        {[-2.9, 2.9].map((z) => (
          <mesh key={z} position={[0, 2.4, z]}>
            <boxGeometry args={[0.14, 4.8, 0.14]} />
            <primitive object={M().aluminum} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 4.82, 0]}>
          <boxGeometry args={[0.16, 0.16, 6]} />
          <primitive object={M().aluminum} attach="material" />
        </mesh>
      </group>

      <DustField
        radius={15}
        height={13}
        count={quality.particles}
        accent="amber"
        opacity={0.3}
      />

      <ambientLight intensity={0.22} color="#a8b7c2" />
      <hemisphereLight args={["#2a2014", "#05070a", 0.35]} />
      <LimitedLights>
      <pointLight position={[0, 4.2, -6]} intensity={30} distance={20} color="#f2a93b" decay={2} />
      <pointLight position={[0, 3.4, 6]} intensity={22} distance={18} color="#ffd7a0" decay={2} />
      <pointLight position={[-11, 3, -4]} intensity={10} distance={14} color="#46e6ff" decay={2} />
      <pointLight position={[11, 3, 4]} intensity={10} distance={14} color="#5aa8ff" decay={2} />
      </LimitedLights>
    </Sector>
  );
}
