"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useNexusStore } from "@/stores/nexusStore";
import { ringSectors, getSector, type SectorId } from "@/content/sectors";
import { projects } from "@/content/projects";
import { travelToSector, returnToAtrium } from "@/world/camera/cinematics";
import { playerState } from "@/world/player/playerState";
import { getAudio } from "@/world/audio/audioEngine";
import { exitPointerLock, requestPointerLock, isTouchDevice } from "@/world/player/pointerLock";
import { visitedCount } from "@/lib/progress";

const MAP_RADIUS = 168;

export function FacilityMap() {
  const overlay = useNexusStore((s) => s.overlay);
  const sector = useNexusStore((s) => s.sector);
  const visited = useNexusStore((s) => s.visited);
  const open = overlay === "map";

  const close = () => {
    useNexusStore.getState().setOverlay("none");
    useNexusStore.getState().setPaused(false);
    if (!isTouchDevice()) requestPointerLock();
  };

  const go = (id: SectorId) => {
    const store = useNexusStore.getState();
    store.setOverlay("none");
    store.setPaused(false);
    getAudio().play("open");
    exitPointerLock();
    if (id === "atrium") {
      if (playerState.sector === "atrium") {
        close();
        return;
      }
      void returnToAtrium(playerState.sector as Exclude<SectorId, "atrium">);
      return;
    }
    void travelToSector(id as Exclude<SectorId, "atrium">);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="nx-hud-panel nx-corner relative flex max-h-[94vh] w-full max-w-[1120px] flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.985, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line/80 px-5 py-3.5">
              <div>
                <div className="nx-label">NEXUS / FACILITY SCHEMATIC</div>
                <h2 className="font-display text-[24px] font-semibold uppercase tracking-[0.1em] text-ink">
                  Facility Map
                </h2>
              </div>
              <button onClick={close} className="nx-btn px-3 py-1.5 text-[10px]">
                Close [M]
              </button>
            </header>

            <div className="grid flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_360px]">
              {/* schematic */}
              <div className="relative mx-auto aspect-square w-full max-w-[520px]">
                <div className="absolute inset-0 nx-grid-bg opacity-30" />
                <svg viewBox="0 0 520 520" className="absolute inset-0 h-full w-full">
                  <defs>
                    <radialGradient id="coreglow">
                      <stop offset="0%" stopColor="#46e6ff" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#46e6ff" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="260" cy="260" r="150" fill="url(#coreglow)" />
                  {ringSectors.map((s) => {
                    const a = (s.angle * Math.PI) / 180;
                    const x = 260 + Math.cos(a) * MAP_RADIUS;
                    const y = 260 - Math.sin(a) * MAP_RADIUS;
                    const active = s.id === sector;
                    const seen = visited.includes(s.id);
                    return (
                      <g key={s.id}>
                        <line
                          x1={260 + Math.cos(a) * 62}
                          y1={260 - Math.sin(a) * 62}
                          x2={x - Math.cos(a) * 48}
                          y2={y + Math.sin(a) * 48}
                          stroke={seen ? "#46e6ff" : "#1b2833"}
                          strokeOpacity={seen ? 0.45 : 0.5}
                          strokeWidth={active ? 2 : 1}
                          strokeDasharray="5 6"
                        />
                      </g>
                    );
                  })}
                  {/* atrium hexagon */}
                  <polygon
                    points={Array.from({ length: 6 })
                      .map((_, i) => {
                        const a = (Math.PI / 3) * i + Math.PI / 6;
                        return `${260 + Math.cos(a) * 62},${260 - Math.sin(a) * 62}`;
                      })
                      .join(" ")}
                    fill={sector === "atrium" ? "#0d2b33" : "#08131a"}
                    stroke="#46e6ff"
                    strokeOpacity={sector === "atrium" ? 0.9 : 0.4}
                    strokeWidth={sector === "atrium" ? 2 : 1.2}
                  />
                  <circle cx="260" cy="260" r="14" fill="#46e6ff" fillOpacity="0.18" stroke="#46e6ff" strokeOpacity="0.7" />
                  {sector === "atrium" && <circle cx="260" cy="260" r="5" fill="#8ff0ff" />}
                </svg>

                {ringSectors.map((s) => {
                  const a = (s.angle * Math.PI) / 180;
                  const x = 260 + Math.cos(a) * MAP_RADIUS;
                  const y = 260 - Math.sin(a) * MAP_RADIUS;
                  const seen = visited.includes(s.id);
                  const active = sector === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => go(s.id)}
                      className={`absolute w-[104px] -translate-x-1/2 -translate-y-1/2 border px-1.5 py-1.5 text-center transition ${
                        active
                          ? "border-accent bg-[#0e2a33] text-ink"
                          : seen
                            ? "border-[#2b6f7d]/70 bg-[#08161c] text-ink-dim hover:border-accent hover:text-accent"
                            : "border-line bg-[#070f14] text-ink-faint hover:border-[#2b6f7d]"
                      }`}
                      style={{ left: `${(x / 520) * 100}%`, top: `${(y / 520) * 100}%` }}
                    >
                      <div className="font-mono text-[8px] tracking-[0.18em] text-accent/80">{s.number}</div>
                      <div className="font-display text-[11.5px] uppercase leading-tight tracking-[0.04em]">
                        {s.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-ink-faint">
                        {active ? "you are here" : seen ? "visited" : "undiscovered"}
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => go("atrium")}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[8px] uppercase tracking-[0.2em] text-accent/90 hover:text-white"
                >
                  ATRIUM
                </button>
              </div>

              {/* destination list */}
              <div className="space-y-2">
                <div className="nx-label">
                  Destinations · {visitedCount(visited)}/7 discovered
                </div>
                {[
                  { id: "atrium" as SectorId, number: "00", name: "Central Atrium", summary: "Facility core and orientation" },
                  ...ringSectors.map((s) => ({ id: s.id, number: s.number, name: s.name, summary: s.subtitle })),
                ].map((dest) => {
                  const meta = getSector(dest.id);
                  const active = sector === dest.id;
                  return (
                    <button
                      key={dest.id}
                      onClick={() => go(dest.id)}
                      className={`w-full border p-2.5 text-left transition ${
                        active
                          ? "border-accent/70 bg-[#0d2630]"
                          : "border-line bg-black/25 hover:border-accent/50 hover:bg-[#0a1a20]"
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[9px] text-accent/80">{dest.number}</span>
                        <span className="font-display text-[14px] uppercase tracking-[0.06em] text-ink">
                          {dest.name}
                        </span>
                        {active && (
                          <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                            current
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
                        {dest.summary}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-dim/80">{meta.tags.join(" · ")}</p>
                    </button>
                  );
                })}

                <div className="border border-line bg-black/25 p-2.5">
                  <div className="nx-label mb-1">Mission quick access</div>
                  <div className="flex flex-wrap gap-1.5">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          useNexusStore.getState().setOverlay("none");
                          useNexusStore.getState().openPanel({ kind: "project", id: p.id });
                        }}
                        className="nx-btn px-2 py-1 text-[9px]"
                      >
                        M-{p.missionNo}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="font-mono text-[9px] leading-relaxed text-ink-faint">
                  Fast travel uses a fade cut. Every sector is also physically connected through the
                  atrium corridors — you can walk between rooms.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
