"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useNexusStore } from "@/stores/nexusStore";
import { QUALITY_PROFILES, type QualityProfile } from "@/lib/quality";
import { getAudio } from "@/world/audio/audioEngine";
import { requestPointerLock, isTouchDevice, exitPointerLock } from "@/world/player/pointerLock";
import { startTour } from "@/world/camera/cinematics";
import { profile } from "@/content/profile";
import { discoveries } from "@/content/discoveries";
import { examinedCount, percent, visitedCount } from "@/lib/progress";
import type { Quality } from "@/stores/nexusStore";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="nx-label">{label}</span>
        <span className="font-mono text-[10px] text-accent">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded bg-line accent-[#46e6ff]"
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between border border-line bg-black/25 px-2.5 py-2 text-left transition hover:border-accent/40"
      aria-pressed={value}
    >
      <span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] text-ink-faint">{hint}</span>}
      </span>
      <span
        className={`ml-3 flex h-4 w-8 shrink-0 items-center border px-0.5 ${
          value ? "border-accent/70 bg-accent/20" : "border-line-2 bg-black/40"
        }`}
      >
        <span
          className={`h-2.5 w-2.5 transition-transform ${
            value ? "translate-x-3.5 bg-accent" : "translate-x-0 bg-ink-faint"
          }`}
        />
      </span>
    </button>
  );
}

function QualityOption({ profile: p, active }: { profile: QualityProfile; active: boolean }) {
  const update = useNexusStore((s) => s.updateSettings);
  return (
    <button
      onClick={() => update({ quality: p.id as Quality })}
      className={`border p-2.5 text-left transition ${
        active ? "border-accent/70 bg-[#0d2630]" : "border-line bg-black/25 hover:border-accent/40"
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-[14px] uppercase tracking-[0.1em] text-ink">{p.label}</span>
        {active && <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">active</span>}
      </div>
      <p className="mt-1 text-[10.5px] leading-relaxed text-ink-faint">{p.description}</p>
    </button>
  );
}

export function SettingsPanel({ onBack }: { onBack?: () => void }) {
  const settings = useNexusStore((s) => s.settings);
  const update = useNexusStore((s) => s.updateSettings);
  const reset = useNexusStore((s) => s.resetSettings);

  const setVolume = (key: "master" | "music" | "sfx", value: number) => {
    update({ [key]: value } as never);
    const next = { ...useNexusStore.getState().settings };
    getAudio().setVolumes({ master: next.master, music: next.music, sfx: next.sfx });
  };

  return (
    <div className="space-y-4">
      <section>
        <div className="nx-label mb-2">Graphics quality</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.values(QUALITY_PROFILES).map((p) => (
            <QualityOption key={p.id} profile={p} active={settings.quality === p.id} />
          ))}
        </div>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
          changes apply immediately — shadows, post-processing and particle density scale with profile
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Slider
          label="Mouse sensitivity"
          value={settings.sensitivity}
          min={0.25}
          max={2.5}
          step={0.05}
          onChange={(v) => update({ sensitivity: v })}
        />
        <Slider
          label="Field of view"
          value={settings.fov}
          min={65}
          max={100}
          step={1}
          onChange={(v) => update({ fov: v })}
          format={(v) => `${v}°`}
        />
        <Toggle
          label="Invert Y axis"
          value={settings.invertY}
          onChange={(v) => update({ invertY: v })}
        />
        <Toggle
          label="Reduced motion"
          value={settings.motion === "reduced"}
          onChange={(v) => update({ motion: v ? "reduced" : "full" })}
          hint="Disables head bob and ambient oscillation cues"
        />
        <Toggle
          label="Adaptive resolution"
          value={settings.adaptive}
          onChange={(v) => update({ adaptive: v })}
          hint="Trades pixel ratio for frame rate to hold 60 FPS"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Slider
          label="Master"
          value={settings.master}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setVolume("master", v)}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="Ambience"
          value={settings.music}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setVolume("music", v)}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="Effects"
          value={settings.sfx}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setVolume("sfx", v)}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </section>

      <section className="grid gap-2 sm:grid-cols-2">
        <Toggle
          label="Mute all audio"
          value={settings.muted}
          onChange={(v) => {
            update({ muted: v });
            getAudio().setVolumes({ muted: v });
          }}
        />
        <Toggle
          label="Show frame rate"
          value={settings.showFps}
          onChange={(v) => update({ showFps: v })}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen?.();
          }}
          className="nx-btn px-3 py-1.5 text-[9.5px]"
        >
          Toggle fullscreen [F]
        </button>
        <button onClick={reset} className="nx-btn px-3 py-1.5 text-[9.5px]">
          Reset defaults
        </button>
        {onBack && (
          <button onClick={onBack} className="nx-btn px-3 py-1.5 text-[9.5px]">
            Back
          </button>
        )}
      </div>

      <p className="font-mono text-[9px] leading-relaxed text-ink-faint">
        Audio starts only after you enter the facility. Every environment has its own synthesised
        ambience — no external audio assets, no autoplay.
      </p>
    </div>
  );
}

export function PauseMenu() {
  const overlay = useNexusStore((s) => s.overlay);
  const discovered = useNexusStore((s) => s.discovered);
  const visited = useNexusStore((s) => s.visited);
  const examined = useNexusStore((s) => s.examined);
  const open = overlay === "pause" || overlay === "settings" || overlay === "help";

  const resume = () => {
    useNexusStore.getState().setOverlay("none");
    useNexusStore.getState().setPaused(false);
    if (!isTouchDevice()) requestPointerLock();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/72 p-3 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="nx-hud-panel nx-corner relative max-h-[94vh] w-full max-w-[980px] overflow-y-auto nx-scroll"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line/80 px-5 py-4">
              <div>
                <div className="nx-label">NEXUS / SYSTEM MENU</div>
                <h2 className="font-display text-[26px] font-semibold uppercase tracking-[0.1em] text-ink">
                  {overlay === "settings" ? "Settings" : overlay === "help" ? "Controls & Access" : "Paused"}
                </h2>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  {profile.name} · {profile.title}
                </p>
              </div>
              <button onClick={resume} className="nx-btn px-3 py-1.5 text-[10px]">
                Resume [ESC]
              </button>
            </header>

            <div className="px-5 py-4">
              {overlay === "pause" && (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button onClick={resume} className="nx-btn nx-btn-primary justify-start">
                        Resume exploration
                      </button>
                      <button
                        onClick={() => useNexusStore.getState().setOverlay("map")}
                        className="nx-btn justify-start"
                      >
                        Facility map
                      </button>
                      <button
                        onClick={() => {
                          useNexusStore.getState().setOverlay("none");
                          useNexusStore.getState().setPaused(false);
                          void startTour();
                          exitPointerLock();
                        }}
                        className="nx-btn justify-start"
                      >
                        Guided tour
                      </button>
                      <button
                        onClick={() => useNexusStore.getState().setOverlay("settings")}
                        className="nx-btn justify-start"
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          useNexusStore.getState().setOverlay("none");
                          useNexusStore.getState().openPanel({ kind: "bio" });
                        }}
                        className="nx-btn justify-start"
                      >
                        Professional profile
                      </button>
                      <button
                        onClick={() => {
                          useNexusStore.getState().setOverlay("none");
                          useNexusStore.getState().openPanel({ kind: "missionIndex" });
                        }}
                        className="nx-btn justify-start"
                      >
                        Project archive
                      </button>
                      <button
                        onClick={() => {
                          useNexusStore.getState().setOverlay("none");
                          useNexusStore.getState().openPanel({ kind: "contact" });
                        }}
                        className="nx-btn justify-start"
                      >
                        Contact terminal
                      </button>
                      <button
                        onClick={() => useNexusStore.getState().setOverlay("help")}
                        className="nx-btn justify-start"
                      >
                        Controls & access
                      </button>
                    </div>

                    <div className="grid gap-2 pt-2 sm:grid-cols-2">
                      <Link
                        href="/portfolio"
                        className="nx-btn justify-start border-line-2 text-ink-dim"
                        onClick={resume}
                      >
                        Conventional portfolio ↗
                      </Link>
                      <Link
                        href="/projects"
                        className="nx-btn justify-start border-line-2 text-ink-dim"
                        onClick={resume}
                      >
                        Projects (text view) ↗
                      </Link>
                      <Link
                        href="/about"
                        className="nx-btn justify-start border-line-2 text-ink-dim"
                        onClick={resume}
                      >
                        About ↗
                      </Link>
                      <Link
                        href="/contact"
                        className="nx-btn justify-start border-line-2 text-ink-dim"
                        onClick={resume}
                      >
                        Contact page ↗
                      </Link>
                    </div>
                  </div>

                  <aside className="space-y-3">
                    <div className="border border-line bg-black/30 p-3">
                      <div className="nx-label mb-2">Session progress</div>
                      <div className="space-y-2 font-mono text-[10px] text-ink-dim">
                        <div className="flex items-center justify-between">
                          <span>Sectors</span>
                          <span className="text-accent">{visitedCount(visited)}/7</span>
                        </div>
                        <div className="h-1 bg-line">
                          <div
                            className="h-full bg-accent/70"
                            style={{ width: `${percent(visitedCount(visited), 7)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Discoveries</span>
                          <span className="text-accent">
                            {discovered.length}/{discoveries.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Exhibits examined</span>
                          <span className="text-accent">{examinedCount(examined)}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
                        Progress is session-based. No professional information is ever locked behind a
                        discovery.
                      </p>
                    </div>
                    <div className="border border-line bg-black/30 p-3">
                      <div className="nx-label mb-1">Availability</div>
                      <p className="text-[11.5px] leading-relaxed text-ink-dim">{profile.availability.note}</p>
                    </div>
                  </aside>
                </div>
              )}

              {overlay === "settings" && (
                <SettingsPanel onBack={() => useNexusStore.getState().setOverlay("pause")} />
              )}

              {overlay === "help" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border border-line bg-black/25 p-3">
                      <div className="nx-label mb-2">Movement</div>
                      <ul className="space-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-dim">
                        <li><span className="text-accent">W A S D</span> — move</li>
                        <li><span className="text-accent">Mouse</span> — look</li>
                        <li><span className="text-accent">Shift</span> — sprint</li>
                        <li><span className="text-accent">E</span> — interact</li>
                        <li><span className="text-accent">M</span> — facility map</li>
                        <li><span className="text-accent">H</span> — this panel</li>
                        <li><span className="text-accent">Esc</span> — pause / close</li>
                        <li><span className="text-accent">F</span> — fullscreen</li>
                      </ul>
                    </div>
                    <div className="border border-line bg-black/25 p-3">
                      <div className="nx-label mb-2">Accessibility</div>
                      <ul className="space-y-1.5 text-[11.5px] leading-relaxed text-ink-dim">
                        <li>Reduced-motion mode removes head bob and ambient oscillation.</li>
                        <li>Every exhibit has an equivalent indexed page under /projects and /expertise.</li>
                        <li>Mouse sensitivity and field of view are adjustable.</li>
                        <li>Audio starts only on explicit activation and can be muted at any time.</li>
                        <li>Escaping the environment is always available from the system menu.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="border border-line bg-black/25 p-3">
                    <div className="nx-label mb-1">If pointer lock is unavailable</div>
                    <p className="text-[11.5px] leading-relaxed text-ink-dim">
                      Some embedded browsers block pointer lock. The facility then falls back to
                      click-drag look on desktop, and the on-screen stick on touch devices. All
                      interactions remain reachable through the map and the conventional pages.
                    </p>
                  </div>
                  <button
                    onClick={() => useNexusStore.getState().setOverlay("pause")}
                    className="nx-btn px-3 py-1.5 text-[9.5px]"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
