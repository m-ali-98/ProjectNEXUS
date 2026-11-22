import { useNexusStore, type Quality } from "@/stores/nexusStore";

export type QualityProfile = {
  id: Quality;
  label: string;
  description: string;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  bloom: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  vignette: boolean;
  reflections: boolean;
  volumetric: boolean;
  particles: number;
  dustMotes: number;
  envResolution: number;
  htmlScreens: boolean;
  anisotropy: number;
  lightCount: number;
};

export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
  ultra: {
    id: "ultra",
    label: "ULTRA",
    description: "Cinematic lighting, full shadows, bloom and volumetric shafts.",
    dpr: [1, 1.85],
    shadows: true,
    shadowMapSize: 2048,
    bloom: true,
    bloomIntensity: 0.85,
    bloomThreshold: 0.62,
    vignette: true,
    reflections: true,
    volumetric: true,
    particles: 900,
    dustMotes: 1100,
    envResolution: 256,
    htmlScreens: true,
    anisotropy: 8,
    lightCount: 4,
  },
  high: {
    id: "high",
    label: "HIGH",
    description: "Balanced: selective shadows, moderate post-processing.",
    dpr: [0.85, 1.5],
    shadows: true,
    shadowMapSize: 1024,
    bloom: true,
    bloomIntensity: 0.6,
    bloomThreshold: 0.7,
    vignette: true,
    reflections: false,
    volumetric: true,
    particles: 520,
    dustMotes: 560,
    envResolution: 128,
    htmlScreens: true,
    anisotropy: 4,
    lightCount: 3,
  },
  performance: {
    id: "performance",
    label: "PERFORMANCE",
    description: "Reduced effects and resolution for integrated graphics.",
    dpr: [0.7, 1],
    shadows: false,
    shadowMapSize: 512,
    bloom: false,
    bloomIntensity: 0,
    bloomThreshold: 1,
    vignette: false,
    reflections: false,
    volumetric: false,
    particles: 180,
    dustMotes: 140,
    envResolution: 64,
    htmlScreens: true,
    anisotropy: 2,
    lightCount: 2,
  },
};

export function useQuality(): QualityProfile {
  const quality = useNexusStore((s) => s.settings.quality);
  return QUALITY_PROFILES[quality] ?? QUALITY_PROFILES.high;
}

/** Heuristic first-run quality detection. Settings always win afterwards. */
export function detectQuality(): Quality {
  if (typeof window === "undefined") return "high";
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return "performance";
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : "";
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const weak = /Intel|Mali|Adreno|PowerVR|SwiftShader|Microsoft Basic|HD Graphics/i.test(
      renderer,
    );
    const cores = navigator.hardwareConcurrency || 4;
    if (mobile || weak || cores <= 4) return "performance";
    if (/RTX|Radeon RX|Apple M[1-9]|Arc A|GeForce GTX 16|Radeon Pro/i.test(renderer)) {
      return "ultra";
    }
    return "high";
  } catch {
    return "high";
  }
}
