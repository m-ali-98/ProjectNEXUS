"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useQuality } from "@/lib/quality";
import { useNexusStore } from "@/stores/nexusStore";

const SAMPLE_WINDOW = 1.5; // seconds
const LOW_FPS = 50;
const HIGH_FPS = 58;
const COOLDOWN = 1.8; // seconds between changes
const STEP_DOWN = 0.15;
const STEP_UP = 0.08;

/**
 * Adaptive resolution.
 *
 * Samples frame rate over 1.5 s windows and moves the renderer's pixel ratio
 * inside the active quality profile's range: down when the frame rate drops
 * below 50, slowly back up when there is headroom. The canvas keeps its CSS
 * size, so only the drawing buffer changes. Disabled by the "Adaptive
 * resolution" setting.
 */
export function AdaptiveResolution() {
  const gl = useThree((s) => s.gl);
  const quality = useQuality();
  const adaptive = useNexusStore((s) => s.settings.adaptive);

  const [minDpr, maxDpr] = quality.dpr;
  const acc = useRef(0);
  const frames = useRef(0);
  const cooldown = useRef(COOLDOWN);
  const ratio = useRef<number | null>(null);

  useEffect(() => {
    ratio.current = Math.min(Math.max(gl.getPixelRatio(), minDpr), maxDpr);
    acc.current = 0;
    frames.current = 0;
    cooldown.current = COOLDOWN;
  }, [gl, minDpr, maxDpr]);

  useFrame((_, delta) => {
    if (!adaptive) return;
    // Ignore tab-switch stalls and paused frames.
    const step = Math.min(delta, 0.1);
    acc.current += step;
    frames.current += 1;
    if (acc.current < SAMPLE_WINDOW) return;

    const fps = frames.current / acc.current;
    acc.current = 0;
    frames.current = 0;
    cooldown.current -= SAMPLE_WINDOW;
    if (cooldown.current > 0) return;

    const current = ratio.current ?? gl.getPixelRatio();
    let next = current;
    if (fps < LOW_FPS) next = Math.max(minDpr, current - STEP_DOWN);
    else if (fps > HIGH_FPS && current < maxDpr) next = Math.min(maxDpr, current + STEP_UP);

    if (Math.abs(next - current) < 0.005) return;
    ratio.current = next;
    cooldown.current = COOLDOWN;
    gl.setPixelRatio(next);
  });

  return null;
}
