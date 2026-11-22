"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";

import { AtriumShell, FONT_DISPLAY, FONT_MONO } from "@/world/environment/Architecture";
import { DustField } from "@/world/environment/Effects";
import { Console } from "@/world/environment/Fixtures";
import { M } from "@/world/environment/materials";
import { HolographicCore } from "./HolographicCore";
import { useQuality } from "@/lib/quality";
import { useNexusStore } from "@/stores/nexusStore";
import { Text } from "@/world/environment/Text3D";
import { LimitedLights } from "@/world/environment/Lighting";
import { profile } from "@/content/profile";

function IdentityDisplay() {
  const scan = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!scan.current) return;
    const t = (state.clock.elapsedTime * 0.35) % 1;
    scan.current.position.y = -1.4 + t * 2.8;
    (scan.current.material as THREE.MeshBasicMaterial).opacity = 0.12 * Math.sin(t * Math.PI);
  });

  return (
    <group position={[0, 6.6, -5.2]}>
      {/* holographic plate */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[11.4, 3.9]} />
        <meshBasicMaterial
          color="#46e6ff"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {[
        [0, 1.86, 11.5],
        [0, -1.86, 11.5],
      ].map(([x, y, w], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <boxGeometry args={[w, 0.02, 0.02]} />
          <primitive object={M().accentMat("cyan", 1.8)} attach="material" />
        </mesh>
      ))}
      {[-5.7, 5.7].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.02, 3.7, 0.02]} />
          <primitive object={M().accentMat("cyan", 1.3)} attach="material" />
        </mesh>
      ))}
      <Billboard>
        <Text
          font={FONT_DISPLAY}
          fontSize={0.94}
          color="#f2fdff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
          position={[0, 0.62, 0.05]}
          maxWidth={10.4}
          textAlign="center"
        >
          {profile.name.toUpperCase()}
        </Text>
        <Text
          font={FONT_MONO}
          fontSize={0.26}
          color="#46e6ff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.42}
          position={[0, -0.14, 0.05]}
        >
          {profile.title.toUpperCase()}
        </Text>
        <Text
          font={FONT_MONO}
          fontSize={0.17}
          color="#9db4c2"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.3}
          position={[0, -0.66, 0.05]}
        >
          {profile.specialisation.toUpperCase()}
        </Text>
        <Text
          font={FONT_MONO}
          fontSize={0.12}
          color="#5f7d8c"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.42}
          position={[0, -1.2, 0.05]}
        >
          {`NEXUS / ${profile.shortName.toUpperCase()}`}
        </Text>
      </Billboard>
      <mesh ref={scan} position={[0, 0, 0.06]}>
        <planeGeometry args={[11.2, 0.1]} />
        <meshBasicMaterial
          color="#a6f4ff"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function MaintenancePanel() {
  const focused = useNexusStore((s) => s.focused?.id === "atrium-maintenance-panel");
  const angle = Math.atan2(13.9, -7.4);
  return (
    <group position={[13.9, 0, -7.4]} rotation={[0, angle, 0]}>
      <mesh position={[0, 1.5, 0.12]} castShadow>
        <boxGeometry args={[1.5, 2.4, 0.3]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, 1.55, 0.28]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.24, 1.5]} />
        <primitive object={M().grate} attach="material" />
      </mesh>
      <mesh position={[0, 0.55, 0.3]}>
        <planeGeometry args={[1.24, 0.3]} />
        <primitive object={M().hazard} attach="material" />
      </mesh>
      {[0.9, 1.2, 2.1].map((y) => (
        <mesh key={y} position={[0.48, y, 0.3]}>
          <circleGeometry args={[0.045, 12]} />
          <primitive
            object={M().accentMat(y === 2.1 ? "red" : focused ? "cyan" : "amber", 1.7)}
            attach="material"
          />
        </mesh>
      ))}
      <Text
        font={FONT_MONO}
        fontSize={0.085}
        color="#7f96a4"
        position={[0, 2.35, 0.3]}
        anchorX="center"
        letterSpacing={0.2}
      >
        MAINT-04
      </Text>
    </group>
  );
}

export function Atrium() {
  const quality = useQuality();
  const mapRot = Math.atan2(-7.4, -7.6);
  const tourRot = Math.atan2(7.4, -7.6);

  return (
    <group>
      <AtriumShell />
      <HolographicCore />
      <IdentityDisplay />
      <MaintenancePanel />
      <DustField radius={19} height={16} count={quality.dustMotes} />

      {/* facility map console */}
      <group position={[7.4, 0, 7.6]} rotation={[0, mapRot, 0]}>
        <Console accent="cyan" variant="network" label="FACILITY MAP" width={2.6} />
      </group>
      {/* guided orientation console */}
      <group position={[-7.4, 0, 7.6]} rotation={[0, tourRot, 0]}>
        <Console accent="amber" variant="plot" label="GUIDED ORIENTATION" width={2.6} />
      </group>

      {/* floor guidance ring toward the core */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[6.4, 6.48, 96]} />
        <meshBasicMaterial color="#46e6ff" transparent opacity={0.16} toneMapped={false} />
      </mesh>

      {/* architectural lighting */}
      <ambientLight intensity={0.22} color="#8fb6c8" />
      <hemisphereLight args={["#35606f", "#05070a", 0.38]} />
      {quality.shadows && (
        <spotLight
          position={[0, 17.2, 0]}
          angle={0.62}
          penumbra={0.85}
          intensity={130}
          distance={42}
          color="#c8ecff"
          castShadow
          shadow-mapSize={[quality.shadowMapSize, quality.shadowMapSize]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.022}
          shadow-camera-near={4}
          shadow-camera-far={30}
        />
      )}
      {/* cool rim from the opposite side: separates silhouettes from the fog */}
      {quality.id !== "performance" && (
        <spotLight
          position={[-11, 9.5, -9]}
          angle={0.78}
          penumbra={1}
          intensity={38}
          distance={34}
          color="#5fb6e8"
          decay={2}
        />
      )}
      <LimitedLights>
      <pointLight position={[0, 4.2, 0]} intensity={26} distance={16} color="#46e6ff" decay={2} />
      <pointLight position={[-9, 7, 6]} intensity={12} distance={20} color="#f2a93b" decay={2} />
      <pointLight position={[9, 7, -6]} intensity={10} distance={20} color="#5aa8ff" decay={2} />
      </LimitedLights>
    </group>
  );
}
