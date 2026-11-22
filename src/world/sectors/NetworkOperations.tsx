"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { Sector } from "./Sector";
import { FONT_MONO, ScreenPanel, Signage } from "@/world/environment/Architecture";
import { DustField, HoloRing } from "@/world/environment/Effects";
import { M } from "@/world/environment/materials";
import { useQuality } from "@/lib/quality";
import { Text } from "@/world/environment/Text3D";
import { LimitedLights } from "@/world/environment/Lighting";

function Globe() {
  const quality = useQuality();
  const globe = useRef<THREE.Group>(null);
  const orbits = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);

  const markers = useMemo(() => {
    const seed = [0.4, 1.7, 3.1, 4.4, 5.6, 2.3, 0.9, 5.1];
    return seed.map((a, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 8);
      return new THREE.Vector3(
        Math.sin(phi) * Math.cos(a) * 3.02,
        Math.cos(phi) * 3.02,
        Math.sin(phi) * Math.sin(a) * 3.02,
      );
    });
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (globe.current) globe.current.rotation.y += dt * 0.06;
    if (orbits.current) {
      orbits.current.rotation.y -= dt * 0.14;
      orbits.current.children.forEach((c, i) => {
        c.rotation.z = Math.sin(t * 0.3 + i) * 0.2;
      });
    }
    if (scan.current) {
      const f = (t * 0.18) % 1;
      scan.current.position.y = -3 + f * 6;
      (scan.current.material as THREE.MeshBasicMaterial).opacity = 0.18 * Math.sin(f * Math.PI);
    }
  });

  return (
    <group position={[0, 4.3, 0]}>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[2.95, 28, 20]} />
          <meshStandardMaterial
            color="#03141a"
            metalness={0.75}
            roughness={0.35}
            emissive="#0a3440"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[3.02, 32, 22]} />
          <meshBasicMaterial color="#46e6ff" wireframe transparent opacity={0.13} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[3.0, 16, 10]} />
          <meshBasicMaterial color="#46e6ff" wireframe transparent opacity={0.06} toneMapped={false} />
        </mesh>
        {markers.map((m, i) => (
          <group key={i} position={m}>
            <mesh>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color="#a8f7ff" toneMapped={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshBasicMaterial
                color="#46e6ff"
                transparent
                opacity={0.16}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* orbital rings */}
      <group ref={orbits}>
        {[
          { r: 3.8, tilt: 0.9, accent: "cyan" as const },
          { r: 4.3, tilt: 1.7, accent: "blue" as const },
          { r: 4.8, tilt: 0.3, accent: "cyan" as const },
        ].map((o, i) => (
          <group key={i} rotation={[o.tilt, i * 0.7, 0]}>
            <HoloRing radius={o.r} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} accent={o.accent} speed={0.02 * (i + 1)} opacity={0.28} />
            <mesh position={[o.r, 0, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#dffaff" toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {quality.id !== "performance" && (
        <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 3.1, 48]} />
          <meshBasicMaterial
            color="#8ff0ff"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* projector base and light column */}
      <mesh position={[0, -3.3, 0]}>
        <cylinderGeometry args={[0.9, 1.35, 0.4, 24]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, -1.6, 0]}>
        <cylinderGeometry args={[0.4, 1.0, 3.0, 24, 1, true]} />
        <meshBasicMaterial
          color="#46e6ff"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={9} distance={9} color="#46e6ff" decay={2} />
    </group>
  );
}

export function NetworkOperations() {
  const quality = useQuality();
  return (
    <Sector id="network-operations">
      <Globe />

      <ScreenPanel
        variant="network"
        width={12}
        height={4.2}
        position={[0, 4.6, 12.35]}
        rotation={[0, Math.PI, 0]}
        accent="cyan"
      />
      <Signage
        title="NETWORK OPERATIONS"
        subtitle="Resolution, transport and mail policy — conceptual models, reserved documentation ranges only"
        meta="SECTOR 04"
        position={[0, 7.3, 12.1]}
        rotation={[0, Math.PI, 0]}
        width={16}
        size={0.6}
      />

      <ScreenPanel variant="plot" width={4.6} height={2.4} position={[-17.65, 3.4, -1]} rotation={[0, Math.PI / 2, 0]} accent="cyan" />
      <ScreenPanel variant="terminal" width={4.6} height={2.4} position={[17.65, 3.4, 1]} rotation={[0, -Math.PI / 2, 0]} accent="cyan" />

      {/* perimeter deck line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[9.6, 9.68, 96]} />
        <meshBasicMaterial color="#46e6ff" transparent opacity={0.16} toneMapped={false} />
      </mesh>

      <Text
        font={FONT_MONO}
        fontSize={0.11}
        color="#7f96a4"
        position={[0, 0.72, 3.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        letterSpacing={0.28}
      >
        RESOLUTION MODEL · ILLUSTRATIVE RECORDS
      </Text>

      <DustField radius={14} height={9} count={Math.floor(quality.particles * 0.8)} opacity={0.3} />

      <ambientLight intensity={0.3} color="#a3c8da" />
      <LimitedLights>
      <pointLight position={[0, 0.6, 0]} intensity={18} distance={12} color="#46e6ff" decay={2} />
      <pointLight position={[-10, 4.4, -7]} intensity={11} distance={16} color="#5aa8ff" decay={2} />
      <pointLight position={[10, 4.4, 7]} intensity={11} distance={16} color="#46e6ff" decay={2} />
      </LimitedLights>
    </Sector>
  );
}
