"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, type ReactNode } from "react";
import { useNexusStore } from "@/stores/nexusStore";
import { Hud } from "@/components/hud/Hud";
import { BootOverlay } from "@/components/overlays/BootOverlay";
import { PanelHost } from "@/components/overlays/PanelHost";
import { FacilityMap } from "@/components/overlays/FacilityMap";
import { PauseMenu } from "@/components/overlays/PauseMenu";
import {
  SectorBanner,
  ToastHost,
  TourCaption,
  TransitionOverlay,
} from "@/components/overlays/GameOverlays";
import { MobileControls } from "@/components/MobileControls";
import { WebGLFallback } from "@/components/WebGLFallback";
import { getAudio } from "@/world/audio/audioEngine";
import { detectQuality } from "@/lib/quality";

const WorldCanvas = dynamic(() => import("@/world/WorldCanvas"), {
  ssr: false,
  loading: () => null,
});

function supportsWebGL() {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

class WorldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[NEXUS] world render failure", error);
    useNexusStore.getState().setWebglFailed(true);
  }
  render() {
    if (this.state.failed) return <WebGLFallback />;
    return this.props.children;
  }
}

export function GameShell() {
  const webglFailed = useNexusStore((s) => s.webglFailed);
  const setWebglFailed = useNexusStore((s) => s.setWebglFailed);
  const settings = useNexusStore((s) => s.settings);
  const updateSettings = useNexusStore((s) => s.updateSettings);

  // WebGL availability + first-run quality detection
  useEffect(() => {
    if (!supportsWebGL()) {
      setWebglFailed(true);
      return;
    }
    const store = useNexusStore.getState();
    let detected = false;
    try {
      detected = localStorage.getItem("nexus-quality-set") === "1";
    } catch {
      detected = true;
    }
    if (!detected) {
      const quality = detectQuality();
      updateSettings({ quality });
      try {
        localStorage.setItem("nexus-quality-set", "1");
      } catch {
        /* storage may be blocked */
      }
    }
    void store;
  }, [setWebglFailed, updateSettings]);

  // motion preference
  useEffect(() => {
    document.documentElement.dataset.motion = settings.motion === "reduced" ? "reduced" : "full";
  }, [settings.motion]);

  // audio volume sync
  useEffect(() => {
    getAudio().setVolumes({
      master: settings.master,
      music: settings.music,
      sfx: settings.sfx,
      muted: settings.muted,
    });
  }, [settings.master, settings.music, settings.sfx, settings.muted]);

  // release audio graph on unmount
  useEffect(() => () => getAudio().dispose(), []);

  return (
    <div id="facility" className="fixed inset-0 overflow-hidden bg-void">
      <a href="#accessible-content" className="nx-skip">
        Skip to text version
      </a>
      {webglFailed ? (
        <WebGLFallback />
      ) : (
        <WorldBoundary>
          <div className="absolute inset-0">
            <WorldCanvas />
          </div>
        </WorldBoundary>
      )}

      <Hud />
      <MobileControls />
      <TransitionOverlay />
      <SectorBanner />
      <TourCaption />
      <ToastHost />
      <PanelHost />
      <FacilityMap />
      <PauseMenu />
      <BootOverlay />
    </div>
  );
}
