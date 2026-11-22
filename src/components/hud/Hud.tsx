"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useNexusStore } from "@/stores/nexusStore";
import { getSector, sectors } from "@/content/sectors";
import { discoveries } from "@/content/discoveries";
import { projects } from "@/content/projects";
import { useQuality } from "@/lib/quality";
import { requestPointerLock, isTouchDevice } from "@/world/player/pointerLock";
import { startTour, stopTour } from "@/world/camera/cinematics";
import { getAudio } from "@/world/audio/audioEngine";
import { exitPointerLock } from "@/world/player/pointerLock";

function Fps() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last > 700) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span className="tabular-nums">{fps}</span>;
}

/** Global hotkeys that must work even when pointer lock is not held. */
export function useHudHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const store = useNexusStore.getState();
      if (e.code === "Escape") {
        if (store.panel) {
          e.preventDefault();
          import("@/world/camera/cinematics").then((m) => {
            import("@/world/camera/director").then((d) => m.closePanelAndResume(d.cameraRef.camera));
          });
        } else if (store.overlay !== "none") {
          e.preventDefault();
          store.setOverlay("none");
          store.setPaused(false);
        } else if (store.phase === "ready") {
          store.setOverlay("pause");
          store.setPaused(true);
          exitPointerLock();
        }
        return;
      }
      if (typing) return;
      if (store.phase !== "ready") return;
      if (e.code === "KeyM") {
        e.preventDefault();
        store.setOverlay(store.overlay === "map" ? "none" : "map");
        store.setPaused(store.overlay !== "map" ? true : false);
        if (store.overlay !== "map") exitPointerLock();
        getAudio().play("open");
      }
      if (e.code === "KeyH") {
        e.preventDefault();
        store.setOverlay(store.overlay === "help" ? "none" : "help");
      }
      if (e.code === "KeyF") {
        e.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      }
      if (e.code === "KeyQ") {
        if (store.tourActive) stopTour();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function Hud() {
  useHudHotkeys();
  const sector = useNexusStore((s) => s.sector);
  const focused = useNexusStore((s) => s.focused);
  const phase = useNexusStore((s) => s.phase);
  const paused = useNexusStore((s) => s.paused);
  const panel = useNexusStore((s) => s.panel);
  const overlay = useNexusStore((s) => s.overlay);
  const pointerLocked = useNexusStore((s) => s.pointerLocked);
  const discovered = useNexusStore((s) => s.discovered);
  const visited = useNexusStore((s) => s.visited);
  const settings = useNexusStore((s) => s.settings);
  const tourActive = useNexusStore((s) => s.tourActive);
  const quality = useQuality();

  const meta = getSector(sector);
  const engaged = phase === "ready" && !paused && !panel && overlay === "none";
  const hidden = phase !== "ready" || !!panel;

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-300 ${
          hidden ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={hidden}
      >
        {/* vignette / frame */}
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.75)]" />

        {/* top left: sector identity */}
        <div className="absolute left-4 top-4 max-w-[320px] sm:left-6 sm:top-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rotate-45 border border-accent/80" />
            <span className="nx-label text-accent/90">NEXUS // FACILITY</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-ink-faint">{meta.number}</span>
            <h1 className="font-display text-[22px] font-semibold uppercase leading-none tracking-[0.1em] text-ink">
              {meta.name}
            </h1>
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
            {meta.classification}
          </p>
          <div className="mt-3 space-y-1">
            <div className="nx-label">Sectors discovered {visited.length}/7</div>
            <div className="h-[2px] w-[180px] bg-line">
              <div
                className="h-full bg-accent/70 transition-all duration-500"
                style={{ width: `${(visited.length / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* top right: status cluster */}
        <div className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
          <div className="flex items-center gap-1.5">
            <span className="nx-hud-panel px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim">
              {quality.label}
            </span>
            {settings.showFps && (
              <span className="nx-hud-panel px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                <Fps /> FPS
              </span>
            )}
            <button
              onClick={() => {
                const store = useNexusStore.getState();
                store.updateSettings({ muted: !settings.muted });
                getAudio().setVolumes({ muted: !settings.muted });
              }}
              className="nx-hud-panel px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim transition hover:text-accent"
              aria-label={settings.muted ? "Unmute audio" : "Mute audio"}
            >
              {settings.muted ? "MUTED" : "AUDIO"}
            </button>
            <button
              onClick={() => {
                useNexusStore.getState().setOverlay("settings");
                useNexusStore.getState().setPaused(true);
                exitPointerLock();
              }}
              className="nx-hud-panel px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim transition hover:text-accent"
            >
              SET
            </button>
            <button
              onClick={() => {
                useNexusStore.getState().setOverlay("pause");
                useNexusStore.getState().setPaused(true);
                exitPointerLock();
              }}
              className="nx-hud-panel px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim transition hover:text-accent"
            >
              MENU
            </button>
          </div>
          <div className="nx-hud-panel px-2.5 py-1.5 text-right">
            <div className="nx-label">Discoveries</div>
            <div className="font-mono text-[11px] text-accent">
              {String(discovered.length).padStart(2, "0")} / {String(discoveries.length).padStart(2, "0")}
            </div>
          </div>
          {settings.motion === "reduced" && (
            <div className="nx-hud-panel px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
              REDUCED MOTION
            </div>
          )}
        </div>

        {/* crosshair */}
        {engaged && !isTouchDevice() && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative h-6 w-6">
              <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/90" />
              <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-accent/35" />
              <span className="absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2 bg-accent/35" />
              <span className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-accent/35" />
              <span className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-accent/35" />
            </div>
          </div>
        )}

        {/* interaction prompt */}
        <AnimatePresence>
          {focused && engaged && (
            <motion.div
              key={focused.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.16 }}
              className="absolute bottom-[16%] left-1/2 w-[min(560px,90vw)] -translate-x-1/2"
            >
              <div className="nx-hud-panel nx-corner flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-accent/60 font-mono text-[12px] text-accent">
                  E
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[17px] uppercase leading-tight tracking-[0.08em] text-ink">
                    {focused.label}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent/80">
                    {focused.verb} · {focused.kind}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* click to engage */}
        {phase === "ready" && !pointerLocked && engaged && !isTouchDevice() && !focused && (
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2">
            <button
              onClick={requestPointerLock}
              className="nx-btn nx-btn-primary pointer-events-auto"
            >
              Click to engage · mouse look
            </button>
          </div>
        )}

        {/* controls */}
        <div className="absolute bottom-4 left-4 hidden sm:bottom-6 sm:left-6 md:block">
          <div className="nx-hud-panel px-3 py-2">
            <div className="nx-label mb-1.5">Controls</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">
              <span><kbd className="text-ink">WASD</kbd> move</span>
              <span><kbd className="text-ink">SHIFT</kbd> sprint</span>
              <span><kbd className="text-ink">E</kbd> interact</span>
              <span><kbd className="text-ink">M</kbd> map</span>
              <span><kbd className="text-ink">ESC</kbd> menu</span>
              <span><kbd className="text-ink">F</kbd> fullscreen</span>
            </div>
          </div>
        </div>

        {/* right action rail */}
        <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col items-end gap-1.5 sm:bottom-6 sm:right-6">
          <button
            onClick={() => {
              useNexusStore.getState().setOverlay("map");
              useNexusStore.getState().setPaused(true);
              exitPointerLock();
            }}
            className="nx-hud-panel px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-dim transition hover:text-accent"
          >
            Facility map [M]
          </button>
          <button
            onClick={() => (tourActive ? stopTour() : void startTour())}
            className="nx-hud-panel px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-dim transition hover:text-accent"
          >
            {tourActive ? "Stop guided tour" : "Guided tour"}
          </button>
          <Link
            href="/"
            className="nx-hud-panel px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint transition hover:text-accent"
          >
            Conventional site ↗
          </Link>
        </div>

        {tourActive && (
          <div className="absolute bottom-[26%] left-1/2 -translate-x-1/2">
            <div className="nx-hud-panel px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber">
              Guided tour · Q to interrupt
            </div>
          </div>
        )}

        {/* project shortcut rail (top centre) */}
        <div className="pointer-events-auto absolute left-1/2 top-4 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                useNexusStore.getState().openPanel({ kind: "project", id: p.id });
                exitPointerLock();
              }}
              className="nx-hud-panel px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint transition hover:text-accent"
            >
              M-{p.missionNo}
            </button>
          ))}
          <span className="ml-1 font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-faint/60">
            archived missions
          </span>
        </div>
      </div>

      {/* sector library rail (always visible when playing) */}
      {!hidden && (
        <div className="pointer-events-auto fixed left-1/2 top-1/2 z-20 hidden -translate-y-1/2 xl:block">
          <div className="flex flex-col gap-1">
            {sectors.map((s) => (
              <div
                key={s.id}
                className={`h-1 w-10 transition-all duration-300 ${
                  s.id === sector ? "w-14 bg-accent" : visited.includes(s.id) ? "bg-accent/40" : "bg-line-2"
                }`}
                title={s.name}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
