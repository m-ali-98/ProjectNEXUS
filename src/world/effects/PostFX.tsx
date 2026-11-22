"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useQuality } from "@/lib/quality";

export function PostFX() {
  const quality = useQuality();

  if (!quality.bloom) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={quality.bloomIntensity}
        luminanceThreshold={quality.bloomThreshold}
        luminanceSmoothing={0.22}
        mipmapBlur
        radius={0.72}
      />
      <Vignette offset={0.22} darkness={0.72} eskil={false} />
    </EffectComposer>
  );
}
