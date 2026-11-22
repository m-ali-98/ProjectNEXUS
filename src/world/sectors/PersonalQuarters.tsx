"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { Sector } from "./Sector";
import { FONT_DISPLAY, FONT_MONO, ScreenPanel, Signage } from "@/world/environment/Architecture";
import { DustField, HoloRing } from "@/world/environment/Effects";
import { M } from "@/world/environment/materials";
import { useQuality } from "@/lib/quality";
import { profile } from "@/content/profile";
import { Text } from "@/world/environment/Text3D";

function TimelineWall() {
  const entries = profile.timeline;
  const spacing = 5.3;
  const startX = -((entries.length - 1) * spacing) / 2;

  return (
    <group>
      {entries.map((entry, i) => (
        <group key={entry.id} position={[startX + i * spacing, 0, 12.34]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 2.5, -0.06]}>
            <boxGeometry args={[4.7, 2.7, 0.08]} />
            <primitive object={M().carbon} attach="material" />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <planeGeometry args={[4.5, 2.5]} />
            <meshBasicMaterial color="#07100f" toneMapped={false} />
          </mesh>
          <mesh position={[0, 3.86, 0.02]}>
            <boxGeometry args={[4.5, 0.02, 0.02]} />
            <primitive object={M().ledAmber} attach="material" />
          </mesh>
          <mesh position={[0, 1.14, 0.02]}>
            <boxGeometry args={[4.5, 0.01, 0.01]} />
            <primitive object={M().wireAmber} attach="material" />
          </mesh>
          <Text
            font={FONT_MONO}
            fontSize={0.1}
            color="#f2a93b"
            position={[-2.1, 3.62, 0.03]}
            anchorX="left"
            letterSpacing={0.22}
          >
            {`${String(i + 1).padStart(2, "0")} / ${entry.era.toUpperCase()}`}
          </Text>
          <Text
            font={FONT_MONO}
            fontSize={0.075}
            color="#6f8794"
            position={[2.1, 3.62, 0.03]}
            anchorX="right"
            letterSpacing={0.14}
          >
            {entry.marker.toUpperCase()}
          </Text>
          <Text
            font={FONT_DISPLAY}
            fontSize={0.26}
            color="#edf6fb"
            position={[-2.1, 3.16, 0.03]}
            anchorX="left"
            anchorY="top"
            maxWidth={4.2}
            lineHeight={1.1}
          >
            {entry.title}
          </Text>
          <Text
            font={FONT_MONO}
            fontSize={0.068}
            color="#93a6b4"
            position={[-2.1, 2.28, 0.03]}
            anchorX="left"
            anchorY="top"
            maxWidth={4.2}
            lineHeight={1.45}
          >
            {entry.tags.join("  ·  ").toUpperCase()}
          </Text>
          <Text
            font={FONT_MONO}
            fontSize={0.062}
            color="#5f7784"
            position={[-2.1, 1.34, 0.03]}
            anchorX="left"
            anchorY="top"
            maxWidth={4.2}
            lineHeight={1.4}
          >
            {"READ AT TERMINAL · PRS-01"}
          </Text>
        </group>
      ))}
    </group>
  );
}

function DevWorkstation() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const flicker = Math.sin(state.clock.elapsedTime * 7.1) * 0.02 + 1;
    ref.current.scale.y = flicker;
  });
  return (
    <group position={[15, 0, -9.8]}>
      {[-0.9, 0, 0.9].map((x, i) => (
        <group key={x} position={[x, 1.35, -0.25]} rotation={[0, i === 1 ? 0 : i === 0 ? 0.22 : -0.22, 0]}>
          <mesh>
            <boxGeometry args={[0.86, 0.56, 0.05]} />
            <primitive object={M().trim} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.8, 0.5]} />
            <meshBasicMaterial color={i === 1 ? "#123039" : "#0a1a22"} toneMapped={false} />
          </mesh>
          {Array.from({ length: 5 }).map((_, k) => (
            <mesh key={k} position={[-0.32 + (k % 2) * 0.05, 0.14 - k * 0.07, 0.035]}>
              <planeGeometry args={[0.24 + ((k * 13) % 5) * 0.07, 0.018]} />
              <meshBasicMaterial color="#46e6ff" transparent opacity={0.5} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 1.1, -0.25]}>
        <boxGeometry args={[2.6, 0.05, 0.08]} />
        <primitive object={M().steel} attach="material" />
      </mesh>
      {/* notes pinned above the desk */}
      <group ref={ref} position={[1.5, 2.5, -0.4]}>
        <mesh>
          <planeGeometry args={[0.5, 0.36]} />
          <meshStandardMaterial color="#d8cfa8" roughness={1} />
        </mesh>
      </group>
      <Text
        font={FONT_MONO}
        fontSize={0.06}
        color="#6f8794"
        position={[0, 0.9, 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        letterSpacing={0.14}
      >
        UNMARKED WORKSTATION
      </Text>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => ({
        angle: (i / 9) * Math.PI * 2,
        tilt: 0.5 + ((i * 37) % 10) / 22,
        len: 0.55 + ((i * 17) % 7) / 18,
      })),
    [],
  );
  return (
    <group position={position}>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.32, 0.24, 0.52, 16]} />
        <meshStandardMaterial color="#3a3029" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.53, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
        <meshStandardMaterial color="#14100c" roughness={1} />
      </mesh>
      {leaves.map((leaf, i) => (
        <mesh
          key={i}
          position={[Math.cos(leaf.angle) * 0.2, 0.72 + leaf.tilt * 0.3, Math.sin(leaf.angle) * 0.2]}
          rotation={[leaf.tilt, -leaf.angle, 0.3]}
          scale={[1, 1, 1]}
        >
          <coneGeometry args={[0.1, leaf.len, 5]} />
          <meshStandardMaterial color={i % 2 ? "#2c4634" : "#345239"} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function PersonalQuarters() {
  const quality = useQuality();

  return (
    <Sector id="personal-quarters">
      <TimelineWall />
      <DevWorkstation />
      <Plant position={[-16.4, 0, 3.2]} />
      <Plant position={[16.4, 0, -3.4]} />

      {/* philosophy slab spotlight + halo */}
      <pointLight position={[0, 3.2, -1.4]} intensity={10} distance={8} color="#f7c98a" decay={2} />
      <HoloRing radius={2.4} position={[0, 0.04, -3.4]} rotation={[Math.PI / 2, 0, 0]} accent="amber" speed={0.02} opacity={0.12} />

      {/* contact alcove */}
      <group position={[12.6, 0, 6.4]}>
        <mesh position={[-1.4, 2.2, -1.2]} rotation={[0, 0.7, 0]}>
          <planeGeometry args={[4.2, 4.4]} />
          <meshBasicMaterial
            color="#f2a93b"
            transparent
            opacity={0.035}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <Text
          font={FONT_MONO}
          fontSize={0.12}
          color="#f2a93b"
          position={[0, 2.2, 0.05]}
          rotation={[0, 0, 0]}
          anchorX="center"
          letterSpacing={0.26}
        >
          CONTACT CHANNEL
        </Text>
      </group>

      {/* bio / interests readable wall plates */}
      <group position={[-17.7, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[4.6, 1.9, 0.08]} />
          <primitive object={M().carbon} attach="material" />
        </mesh>
        <mesh position={[0, 2.6, 0.05]}>
          <planeGeometry args={[4.4, 1.7]} />
          <primitive object={M().panelAmber} attach="material" />
        </mesh>
      </group>
      <ScreenPanel variant="identity" width={4.4} height={1.8} position={[17.7, 2.6, 0]} rotation={[0, -Math.PI / 2, 0]} accent="amber" />

      {/* signage + quote */}
      <Signage
        title="PERSONAL QUARTERS"
        subtitle="Background, philosophy, interests and an open channel"
        meta="SECTOR 06"
        position={[0, 5.5, 11.9]}
        rotation={[0, Math.PI, 0]}
        width={14}
        size={0.52}
        accent="amber"
      />
      <Text
        font={FONT_DISPLAY}
        fontSize={0.46}
        color="#cbb999"
        position={[0, 0.035, -7.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        anchorY="middle"
        maxWidth={16}
        textAlign="center"
        fillOpacity={0.5}
      >
        {`"${profile.philosophy}"`}
      </Text>

      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, -7.2]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#171310" roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.024, -7.2]}>
        <ringGeometry args={[3.2, 3.28, 4]} />
        <meshBasicMaterial color="#f2a93b" transparent opacity={0.18} toneMapped={false} />
      </mesh>

      {/* warm ceiling panel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6.7, -4]}>
        <planeGeometry args={[9, 8]} />
        <meshBasicMaterial color="#f6d5a3" transparent opacity={0.055} toneMapped={false} />
      </mesh>

      <DustField radius={13} height={6.6} count={Math.floor(quality.particles * 0.5)} accent="amber" opacity={0.22} />

      <ambientLight intensity={0.42} color="#d6c8b4" />
      <hemisphereLight args={["#3a2c1e", "#080706", 0.4]} />
      <pointLight position={[0, 4.2, -6]} intensity={16} distance={14} color="#f7c98a" decay={2} />
      <pointLight position={[-10, 3.4, 4]} intensity={10} distance={12} color="#ffd7a0" decay={2} />
      <pointLight position={[11, 3.4, 6]} intensity={10} distance={12} color="#f2a93b" decay={2} />
    </Sector>
  );
}
