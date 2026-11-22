"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useQuality } from "@/lib/quality";
import type { SectorId } from "@/content/sectors";
import { sectorPlacements } from "@/world/worldLayout";
import { Corridors } from "@/world/environment/Architecture";
import { Atrium } from "@/world/sectors/Atrium";
import { ApplicationLab } from "@/world/sectors/ApplicationLab";
import { SystemsCore } from "@/world/sectors/SystemsCore";
import { Infrastructure } from "@/world/sectors/Infrastructure";
import { NetworkOperations } from "@/world/sectors/NetworkOperations";
import { ProjectArchive } from "@/world/sectors/ProjectArchive";
import { PersonalQuarters } from "@/world/sectors/PersonalQuarters";
import { PlayerController } from "@/world/player/PlayerController";
import { Character } from "@/world/character/Character";
import { InteractionSystem } from "@/world/interactions/InteractionSystem";
import { InteractionMarkers } from "@/world/interactions/InteractionMarkers";
import { PostFX } from "@/world/effects/PostFX";
import { AdaptiveResolution } from "@/world/effects/AdaptiveResolution";
import { playerState } from "@/world/player/playerState";
import { IntroCamera } from "@/world/camera/IntroCamera";
import { useNexusStore } from "@/stores/nexusStore";

const SECTOR_COMPONENTS: Record<Exclude<SectorId, "atrium">, React.ComponentType> = {
  "application-lab": ApplicationLab,
  "systems-core": SystemsCore,
  infrastructure: Infrastructure,
  "network-operations": NetworkOperations,
  "project-archive": ProjectArchive,
  "personal-quarters": PersonalQuarters,
};

const PORTAL_ACCENTS: Record<number, "cyan" | "blue" | "amber" | "white"> = {
  0: "cyan",
  60: "blue",
  120: "amber",
  180: "cyan",
  240: "cyan",
  300: "amber",
};

/**
 * Streams sector geometry in only when the player is nearby.
 * Rooms are constructed procedurally so mounting is cheap, but this keeps the
 * draw-call and light count of the whole facility bounded by locality.
 */
function SectorStreamer() {
  const [mounted, setMounted] = useState<SectorId[]>(["atrium"]);
  const tick = useRef(0);

  useFrame((_, delta) => {
    tick.current += delta;
    if (tick.current < 0.4) return;
    tick.current = 0;
    const px = playerState.position.x;
    const pz = playerState.position.z;
    const next: SectorId[] = ["atrium"];
    for (const id of Object.keys(sectorPlacements) as Exclude<SectorId, "atrium">[]) {
      const p = sectorPlacements[id].position;
      if (Math.hypot(px - p.x, pz - p.z) < 62) next.push(id);
    }
    setMounted((prev) => {
      const same =
        prev.length === next.length && prev.every((id) => next.includes(id));
      return same ? prev : next;
    });
  });

  return (
    <group>
      {mounted
        .filter((id): id is Exclude<SectorId, "atrium"> => id !== "atrium")
        .map((id) => {
          const Component = SECTOR_COMPONENTS[id];
          return <Component key={id} />;
        })}
    </group>
  );
}

function Atmosphere() {
  const quality = useQuality();
  const { scene } = useThree();
  const fog = useMemo(() => new THREE.FogExp2(new THREE.Color("#050a0f"), 0.0135), []);
  const { phase } = useNexusStore();

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  // The intro thickens the fog for the "lighting activation" reveal.
  useFrame((_, delta) => {
    const target = phase === "intro" ? 0.028 : 0.0135;
    fog.density += (target - fog.density) * Math.min(1, delta * 0.9);
    void quality;
  });

  return null;
}

function SceneBackground() {
  return <color attach="background" args={["#04070a"]} />;
}

function IBL() {
  const quality = useQuality();
  return (
    <Environment resolution={quality.envResolution} frames={1} background={false}>
      <color attach="background" args={["#05090c"]} />
      <Lightformer intensity={2.1} color="#7cc6de" position={[0, 12, 0]} scale={[26, 26, 1]} rotation={[-Math.PI / 2, 0, 0]} />
      <Lightformer intensity={1.1} color="#f2a93b" position={[-14, 6, -10]} scale={[12, 12, 1]} rotation={[0, Math.PI / 3, 0]} />
      <Lightformer intensity={1} color="#3f7fa8" position={[16, 5, 12]} scale={[12, 12, 1]} rotation={[0, -Math.PI / 3, 0]} />
      <Lightformer intensity={0.7} color="#dff4ff" position={[0, 5, 15]} scale={[16, 8, 1]} />
      <Lightformer intensity={0.55} color="#2a4d5e" position={[0, -4, 0]} scale={[30, 30, 1]} rotation={[Math.PI / 2, 0, 0]} />
    </Environment>
  );
}

export function WorldManager() {
  return (
    <>
      <SceneBackground />
      <fogExp2 attach="fog" args={["#05090c", 0.0135]} />
      <Atmosphere />
      <IBL />
      <ambientLight intensity={0.12} color="#8aa6b8" />
      <hemisphereLight args={["#24404c", "#040607", 0.22]} />

      <Suspense fallback={null}>
        <Atrium />
        <Corridors accentFor={(angle) => PORTAL_ACCENTS[angle] ?? "cyan"} />
        <SectorStreamer />
      </Suspense>

      <Character />
      <PlayerController />
      <InteractionSystem />
      <InteractionMarkers />
      <IntroCamera />
      <PostFX />
      <AdaptiveResolution />
    </>
  );
}
