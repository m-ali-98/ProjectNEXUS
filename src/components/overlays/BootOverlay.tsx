"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNexusStore } from "@/stores/nexusStore";
import { profile } from "@/content/profile";
import { getAudio } from "@/world/audio/audioEngine";
import { requestPointerLock } from "@/world/player/pointerLock";

const SESSION_KEY = "nexus-intro-seen-v1";

const BOOT_STEPS = [
  "INITIALIZING NEXUS",
  "LOADING PERSONAL ENGINEERING PROFILE",
  "ESTABLISHING ENVIRONMENT CONNECTION",
  "LOADING SYSTEM ARCHITECTURE",
  "FACILITY READY",
];

export function BootOverlay() {
  const phase = useNexusStore((s) => s.phase);
  const setPhase = useNexusStore((s) => s.setPhase);
  const enterFacility = useNexusStore((s) => s.enterFacility);
  const webglFailed = useNexusStore((s) => s.webglFailed);

  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [introLine, setIntroLine] = useState(0);
  const [identityVisible, setIdentityVisible] = useState(false);
  const [canEnter, setCanEnter] = useState(false);

  const enter = useCallback(() => {
    const store = useNexusStore.getState();
    if (store.phase !== "intro") return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* storage may be blocked */
    }
    getAudio()
      .start()
      .then(() => {
        store.armAudio();
      })
      .catch(() => {});
    enterFacility();
    requestPointerLock();
  }, [enterFacility]);

  // ---- boot sequence ------------------------------------------------------
  useEffect(() => {
    if (phase !== "boot") return;
    let cancelled = false;
    const seen = (() => {
      try {
        return sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        return false;
      }
    })();

    const run = async () => {
      const steps = seen ? 3 : BOOT_STEPS.length;
      for (let i = 0; i < steps; i++) {
        if (cancelled) return;
        setStep(i);
        setProgress(Math.round(((i + 1) / (steps + 1)) * 100));
        await new Promise((r) => setTimeout(r, 260));
      }
      try {
        await document.fonts.ready;
      } catch {
        /* fonts may be unavailable */
      }
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 320));
      setProgress(100);
      setStep(BOOT_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 420));
      if (cancelled) return;
      if (seen) {
        setPhase("ready");
        enterFacility();
      } else {
        setPhase("intro");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [phase, setPhase, enterFacility]);

  // ---- intro cinematics overlay timing ------------------------------------
  useEffect(() => {
    if (phase !== "intro") return;
    const timers: number[] = [];
    BOOT_STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setIntroLine(i), 420 * i));
    });
    timers.push(window.setTimeout(() => setIdentityVisible(true), 8200));
    timers.push(window.setTimeout(() => setCanEnter(true), 8600));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase]);

  // ---- keyboard entry -----------------------------------------------------
  useEffect(() => {
    if (phase !== "intro" || !canEnter) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, canEnter, enter]);

  return (
    <AnimatePresence>
      {phase === "boot" && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="nx-grid-bg absolute inset-0 opacity-40" />
          <div className="relative w-[min(560px,88vw)]">
            <div className="mb-6 flex items-baseline justify-between">
              <div className="font-display text-[34px] font-semibold uppercase tracking-[0.34em] text-ink">
                NEXUS
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-ink-faint">
                v1.0 / facility
              </div>
            </div>
            <div className="h-[2px] w-full bg-line">
              <motion.div
                className="h-full bg-accent shadow-[0_0_12px_rgba(70,230,255,0.7)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
            <div className="mt-4 space-y-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
              {BOOT_STEPS.slice(0, step + 1).map((line, i) => (
                <div key={line} className="flex items-center gap-2">
                  <span className={i === step ? "text-accent" : "text-accent/40"}>
                    {i === step ? "▸" : "✓"}
                  </span>
                  <span className={i === step ? "text-ink" : "text-ink-faint"}>{line}…</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
              <span>{webglFailed ? "WEBGL UNAVAILABLE — FALLBACK READY" : "GPU CONTEXT ACTIVE"}</span>
              <span>{String(progress).padStart(3, "0")}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {phase === "intro" && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
        >
          {/* dark veil that lifts to reveal the atrium */}
          <motion.div
            className="absolute inset-0 bg-void"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0.45 }}
            transition={{ duration: 7, delay: 1.2, ease: "easeInOut" }}
          />
          <div className="nx-scanlines pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_220px_rgba(0,0,0,0.9)]" />

          {/* top bar */}
          <div className="absolute left-4 top-4 right-4 flex items-start justify-between sm:left-6 sm:top-6 sm:right-6">
            <div>
              <div className="font-display text-[22px] font-semibold uppercase tracking-[0.3em] text-ink">
                NEXUS
              </div>
              <div className="font-mono text-[8.5px] uppercase tracking-[0.28em] text-accent/80">
                interactive engineering environment
              </div>
            </div>
            <button onClick={enter} className="nx-btn px-3 py-1.5 text-[9.5px]">
              Skip intro
            </button>
          </div>

          {/* boot lines */}
          <div className="absolute bottom-24 left-4 space-y-1.5 font-mono text-[10px] uppercase tracking-[0.2em] sm:bottom-28 sm:left-6">
            {BOOT_STEPS.map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0 }}
                animate={{ opacity: i <= introLine ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className={i === BOOT_STEPS.length - 1 ? "text-accent" : "text-ink-faint"}
              >
                {i <= introLine ? "▸ " : "  "}
                {line}
                {i === BOOT_STEPS.length - 1 ? "" : "…"}
              </motion.div>
            ))}
          </div>

          {/* identity block */}
          <AnimatePresence>
            {identityVisible && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-0 bottom-[18%] flex flex-col items-center px-5 text-center"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent/80">
                  identity confirmed
                </div>
                <h1 className="mt-2 font-display text-[clamp(28px,5.2vw,52px)] font-semibold uppercase leading-none tracking-[0.12em] text-ink">
                  {profile.name}
                </h1>
                <div className="mt-2 font-mono text-[clamp(10px,1.4vw,13px)] uppercase tracking-[0.34em] text-accent">
                  {profile.title}
                </div>
                <div className="mt-1 font-mono text-[clamp(8px,1vw,10px)] uppercase tracking-[0.3em] text-ink-faint">
                  applications / systems / infrastructure
                </div>
                <button
                  onClick={enter}
                  disabled={!canEnter}
                  className="nx-btn nx-btn-primary mt-7 px-8 py-3 text-[11px] disabled:opacity-30"
                >
                  Enter facility
                </button>
                <div className="mt-3 font-mono text-[8.5px] uppercase tracking-[0.24em] text-ink-faint">
                  press enter · WASD to move · E to interact · ESC for menu
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {webglFailed && (
            <div className="absolute inset-x-0 top-1/2 mx-auto w-[min(520px,90vw)] border border-amber/50 bg-black/80 p-4 text-center">
              <div className="nx-label text-amber">WebGL unavailable</div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-dim">
                The 3D facility cannot start on this device. All professional content is available on
                the conventional portfolio pages.
              </p>
              <a href="/about" className="nx-btn mt-3 inline-flex">
                Open portfolio
              </a>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
