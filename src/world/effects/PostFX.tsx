"use client";

import { useMemo } from "react";
import { BlendFunction, KernelSize } from "postprocessing";
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Noise,
  SSAO,
  Vignette,
} from "@react-three/postprocessing";
import { useQuality } from "@/lib/quality";

/**
 * Post-processing chain.
 *
 * Physical passes first (ambient occlusion, bloom), then a restrained grade:
 * a little saturation and contrast so the cyan/amber palette does not read
 * washed out, edge-only chromatic aberration on ULTRA, vignette for framing and
 * a whisper of grain to hide gradient banding in the fog.
 *
 * MSAA on the composer's render target restores the edge quality that is lost
 * when the scene is resolved through a post chain. PERFORMANCE renders straight
 * to the canvas, so the composer is skipped entirely.
 */
export function PostFX() {
  const quality = useQuality();

  const aberration = useMemo(() => (quality.ssao ? 0.0006 : 0.00028), [quality.ssao]);

  if (quality.id === "performance") return null;

  return (
    <EffectComposer multisampling={quality.msaa} enableNormalPass={quality.ssao}>
      {quality.ssao ? (
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={16}
          rings={5}
          radius={0.18}
          intensity={1.65}
          luminanceInfluence={0.35}
          distanceThreshold={1.2}
          distanceFalloff={0.35}
          rangeThreshold={0.0006}
          rangeFalloff={0.0005}
          bias={0.035}
          fade={0.02}
          resolutionScale={0.7}
          color="#04070a"
        />
      ) : (
        <></>
      )}
      <Bloom
        intensity={quality.bloomIntensity}
        luminanceThreshold={quality.bloomThreshold}
        luminanceSmoothing={0.26}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
        radius={0.78}
      />
      <HueSaturation saturation={0.08} hue={0} />
      <BrightnessContrast brightness={0.004} contrast={0.08} />
      <ChromaticAberration
        offset={[aberration, aberration]}
        radialModulation
        modulationOffset={0.4}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette offset={0.22} darkness={0.68} eskil={false} />
      {quality.grain > 0 ? (
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={quality.grain} />
      ) : (
        <></>
      )}
    </EffectComposer>
  );
}
