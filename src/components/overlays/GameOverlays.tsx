"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNexusStore } from "@/stores/nexusStore";
import { tourStops } from "@/world/camera/cinematics";

export function TransitionOverlay() {
  const fade = useNexusStore((s) => s.fade);
  const label = useNexusStore((s) => s.transitionLabel);
  const transitioning = useNexusStore((s) => s.transitioning);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 bg-void transition-opacity duration-300 ${
        fade === "out" ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <div className="nx-scanlines absolute inset-0 opacity-30" />
      {transitioning && label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent/70">NEXUS / TRANSIT</div>
          <div className="font-display text-[clamp(16px,2.4vw,24px)] uppercase tracking-[0.24em] text-ink">
            {label}
          </div>
          <div className="mt-1 h-[1px] w-40 overflow-hidden bg-line">
            <div className="nx-sweep h-full w-full bg-accent/70" />
          </div>
        </div>
      )}
    </div>
  );
}

export function SectorBanner() {
  const banner = useNexusStore((s) => s.banner);
  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key={banner.title}
          className="pointer-events-none fixed inset-x-0 top-[18%] z-30 flex flex-col items-center px-4 text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.42em] text-accent/80">{banner.code}</div>
          <div className="mt-1 font-display text-[clamp(24px,4vw,42px)] font-semibold uppercase leading-none tracking-[0.18em] text-ink">
            {banner.title}
          </div>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.3em] text-ink-faint">
            {banner.subtitle}
          </div>
          <div className="mt-3 h-[1px] w-[min(420px,70vw)] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ToastHost() {
  const toast = useNexusStore((s) => s.toast);
  const clear = useNexusStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clear, 7000);
    return () => window.clearTimeout(timer);
  }, [toast, clear]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          className="pointer-events-auto fixed bottom-24 left-4 z-30 w-[min(360px,88vw)] sm:bottom-28 sm:left-6"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="nx-hud-panel nx-corner relative px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className={`font-mono text-[8.5px] uppercase tracking-[0.24em] ${
                    toast.kind === "discovery"
                      ? "text-good"
                      : toast.kind === "warning"
                        ? "text-alert"
                        : "text-accent"
                  }`}
                >
                  {toast.kind === "discovery" ? "Discovery unlocked" : "Facility notice"}
                </div>
                <div className="mt-1 font-display text-[16px] uppercase leading-tight tracking-[0.06em] text-ink">
                  {toast.title}
                </div>
                {toast.body && (
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-dim">{toast.body}</p>
                )}
              </div>
              <button
                onClick={clear}
                className="font-mono text-[10px] text-ink-faint hover:text-accent"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TourCaption() {
  const active = useNexusStore((s) => s.tourActive);
  const step = useNexusStore((s) => s.tourStep);
  const stop = tourStops[step];

  return (
    <AnimatePresence>
      {active && stop && (
        <motion.div
          key={step}
          className="pointer-events-none fixed inset-x-0 bottom-[9%] z-30 flex justify-center px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4 }}
        >
          <div className="nx-hud-panel max-w-[620px] px-4 py-2.5 text-center">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-accent/80">
              GUIDED TOUR · {String(step + 1).padStart(2, "0")} / {String(tourStops.length).padStart(2, "0")}
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{stop.caption}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
