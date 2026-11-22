"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";

import { useNexusStore } from "@/stores/nexusStore";
import { interactionsBySector, type Interaction } from "@/world/interactions/registry";
import { markerTexture } from "@/world/environment/proceduralUI";
import { glowTexture } from "@/world/environment/textures";
import { FONT_MONO } from "@/world/environment/Architecture";
import { Text } from "@/world/environment/Text3D";

function Marker({
  interaction,
  focused,
  glyph,
  glow,
  lightColor,
}: {
  interaction: Interaction;
  focused: boolean;
  glyph: THREE.Texture;
  glow: THREE.Texture;
  lightColor: string;
}) {
  const group = useRef<THREE.Group>(null);
  const seed = useMemo(() => Math.random() * 10, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const pulse = focused ? 1.12 + Math.sin(t * 3.2) * 0.07 : 1 + Math.sin(t * 1.6 + seed) * 0.045;
    group.current.scale.setScalar(pulse);
    group.current.rotation.y = focused ? t * 0.9 : 0;
  });

  return (
    <group position={[interaction.marker.x, interaction.marker.y, interaction.marker.z]}>
      <group ref={group}>
        <Billboard>
          <mesh>
            <planeGeometry args={[focused ? 0.46 : 0.3, focused ? 0.46 : 0.3]} />
            <meshBasicMaterial
              map={glyph}
              color={lightColor}
              transparent
              opacity={focused ? 1 : 0.34}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {focused && (
            <>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[1.5, 1.5]} />
                <meshBasicMaterial
                  map={glow}
                  color={lightColor}
                  transparent
                  opacity={0.32}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[0, 0, 0]}>
                <ringGeometry args={[0.34, 0.37, 40]} />
                <meshBasicMaterial color={lightColor} transparent opacity={0.85} toneMapped={false} />
              </mesh>
              <Text
                font={FONT_MONO}
                fontSize={0.115}
                color={lightColor}
                anchorX="center"
                anchorY="bottom"
                letterSpacing={0.18}
                position={[0, 0.36, 0]}
                maxWidth={3.2}
                textAlign="center"
              >
                {interaction.label.toUpperCase()}
              </Text>
            </>
          )}
        </Billboard>
      </group>
      {/* thin tether down to the fixture */}
      <mesh position={[0, -0.36, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.55, 4]} />
        <meshBasicMaterial color={lightColor} transparent opacity={focused ? 0.5 : 0.14} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function InteractionMarkers() {
  const sector = useNexusStore((s) => s.sector);
  const focusedId = useNexusStore((s) => s.focused?.id ?? null);
  const glyph = useMemo(() => markerTexture("#8fe8f7"), []);
  const glow = useMemo(() => glowTexture("#46e6ff"), []);
  const items = interactionsBySector[sector] ?? [];

  return (
    <group>
      {items
        .filter((item) => item.kind !== "portal" || item.sector === sector)
        .map((item) => (
          <Marker
            key={item.id}
            interaction={item}
            focused={focusedId === item.id}
            glyph={glyph}
            glow={glow}
            lightColor={item.kind === "portal" ? "#f2a93b" : "#8fe8f7"}
          />
        ))}
    </group>
  );
}
