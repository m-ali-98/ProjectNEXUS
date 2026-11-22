"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

import { Sector } from "./Sector";
import { FONT_DISPLAY, FONT_MONO, ScreenPanel, Signage } from "@/world/environment/Architecture";
import { DustField, PipeRun } from "@/world/environment/Effects";
import { M } from "@/world/environment/materials";
import { useQuality } from "@/lib/quality";
import { ChatMockup } from "@/components/interface/ChatMockup";
import { Text } from "@/world/environment/Text3D";

function FloatingPanel({
  position,
  rotation = [0, 0, 0],
  width = 2.4,
  height = 1.5,
  delay = 0,
  label,
  title,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  delay?: number;
  label: string;
  title: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 0.6 + delay) * 0.07;
    ref.current.rotation.y = rotation[1] + Math.sin(t * 0.22 + delay) * 0.04;
  });
  return (
    <group ref={ref} position={position} rotation={rotation as [number, number, number]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color="#46e6ff"
          transparent
          opacity={0.055}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color="#46e6ff" transparent opacity={0.4} toneMapped={false} />
      </lineSegments>
      <Text
        font={FONT_MONO}
        fontSize={0.09}
        color="#8fe8f7"
        position={[-width / 2 + 0.12, height / 2 - 0.14, 0.01]}
        anchorX="left"
        letterSpacing={0.2}
      >
        {label}
      </Text>
      <Text
        font={FONT_DISPLAY}
        fontSize={0.18}
        color="#dff6ff"
        position={[-width / 2 + 0.12, height / 2 - 0.4, 0.01]}
        anchorX="left"
        maxWidth={width - 0.24}
      >
        {title}
      </Text>
      {/* abstract content bars */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-width / 2 + 0.18 + (i % 3) * 0.1, -0.1 - i * 0.16, 0.01]}>
          <planeGeometry args={[width * (0.34 + ((i * 7) % 5) * 0.09), 0.035]} />
          <meshBasicMaterial color="#46e6ff" transparent opacity={0.22} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function DeviceInstallation() {
  const quality = useQuality();
  const bob = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!bob.current) return;
    bob.current.position.y = 2.32 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
  });
  return (
    <group position={[0, 0, 2.4]}>
      {/* device body floating above the pedestal */}
      <group ref={bob} position={[0, 2.32, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.16, 2.32, 0.1]} />
          <primitive object={M().carbon} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.056]}>
          <planeGeometry args={[1.06, 2.2]} />
          <meshBasicMaterial color="#04090d" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.062]}>
          <planeGeometry args={[1.14, 2.3]} />
          <meshBasicMaterial
            color="#46e6ff"
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 1.02, 0.07]}>
          <boxGeometry args={[0.28, 0.02, 0.02]} />
          <primitive object={M().trim} attach="material" />
        </mesh>
        <Html
          transform
          distanceFactor={2.05}
          position={[0, 0, 0.075]}
          style={{ pointerEvents: "none" }}
          zIndexRange={[10, 0]}
        >
          <ChatMockup interactive={false} />
        </Html>
      </group>
      {quality.id !== "performance" && (
        <>
          <mesh position={[0, 2.32, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.86, 0.9, 48]} />
            <meshBasicMaterial color="#46e6ff" transparent opacity={0.4} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.4, 1.46, 56]} />
            <meshBasicMaterial color="#46e6ff" transparent opacity={0.22} toneMapped={false} />
          </mesh>
        </>
      )}
      <Text
        font={FONT_MONO}
        fontSize={0.1}
        color="#7f96a4"
        position={[0, 1.18, 0.62]}
        anchorX="center"
        letterSpacing={0.24}
      >
        ILLUSTRATIVE RECONSTRUCTION
      </Text>
    </group>
  );
}

export function ApplicationLab() {
  const quality = useQuality();
  return (
    <Sector id="application-lab">
      {/* rear wall display */}
      <ScreenPanel
        variant="plot"
        width={13}
        height={4.6}
        position={[0, 4.4, 12.35]}
        rotation={[0, Math.PI, 0]}
        accent="cyan"
      />
      <Signage
        title="APPLICATION DEVELOPMENT LAB"
        subtitle="React · React Native · TypeScript · Redux — interface systems and device capability"
        meta="SECTOR 01"
        position={[0, 7.35, 12.1]}
        rotation={[0, Math.PI, 0]}
        width={16}
        size={0.62}
      />

      <DeviceInstallation />
      <FloatingPanel position={[-4.4, 3.2, -6.4]} rotation={[0, 0.42, 0]} label="UI LAYER" title="Component composition" delay={0.4} />
      <FloatingPanel position={[4.4, 3.5, -6.4]} rotation={[0, -0.42, 0]} label="STATE" title="Redux flow" delay={1.2} />
      <FloatingPanel position={[0, 4.35, -6.6]} rotation={[0, 0, 0]} width={2.8} height={1.3} label="DEVICE" title="Camera · video · voice" delay={2.1} />

      {/* ceiling cable runs */}
      <PipeRun from={[-16, 7.4, -10]} to={[-16, 7.4, 10]} radius={0.07} clamps={6} />
      <PipeRun from={[-15.2, 7.6, -10]} to={[-15.2, 7.6, 10]} radius={0.05} clamps={6} />
      <PipeRun from={[15.2, 7.6, -10]} to={[15.2, 7.6, 10]} radius={0.05} clamps={6} />

      <DustField radius={13} height={7.5} count={Math.floor(quality.particles * 0.7)} opacity={0.35} />

      <ambientLight intensity={0.4} color="#a7cede" />
      <pointLight position={[0, 3.2, 2.4]} intensity={16} distance={12} color="#46e6ff" decay={2} />
      <pointLight position={[-10, 4.4, -4]} intensity={12} distance={16} color="#5aa8ff" decay={2} />
      <pointLight position={[10, 4.4, 4]} intensity={12} distance={16} color="#46e6ff" decay={2} />
      <pointLight position={[0, 4.2, -8]} intensity={9} distance={12} color="#e6f7ff" decay={2} />
    </Sector>
  );
}
