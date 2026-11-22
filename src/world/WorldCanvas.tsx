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
        alpha: false,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
      }}
      camera={{ fov: 75, near: 0.06, far: 240, position: [0, 1.68, 10.5] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <Suspense fallback={null}>
        <WorldManager />
      </Suspense>
    </Canvas>
  );
}
