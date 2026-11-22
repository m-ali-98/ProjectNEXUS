"use client";

import { Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { WorldManager } from "@/world/WorldManager";
import { useQuality } from "@/lib/quality";

export default function WorldCanvas() {
  const quality = useQuality();

  return (
    <Canvas
      dpr={quality.dpr}
      frameloop="always"
      shadows={quality.shadows ? "soft" : false}
      gl={{
        antialias: quality.id !== "performance",
        powerPreference: "high-performance",
        precision: "highp",
        alpha: false,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
      }}
      camera={{ fov: 72, near: 0.08, far: 240, position: [0.32, 1.75, 13.6] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.shadowMap.enabled = quality.shadows;
      }}
    >
      <Suspense fallback={null}>
        <WorldManager />
      </Suspense>
    </Canvas>
  );
}
