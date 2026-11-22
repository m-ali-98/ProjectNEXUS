import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SectorId } from "@/content/sectors";

export type Quality = "ultra" | "high" | "performance";

export type PanelState =
  | { kind: "project"; id: string }
  | { kind: "systemNode"; id: string }
  | { kind: "pipeline"; id: string }
  | { kind: "infraTerminal"; id: string }
  | { kind: "labStation"; id: string }
  | { kind: "chat" }
  | { kind: "dnsRecord"; id: string }
  | { kind: "mailAuth"; id: string }
  | { kind: "tls" }
  | { kind: "proxy" }
  | { kind: "identity" }
  | { kind: "philosophy" }
  | { kind: "timeline" }
  | { kind: "bio" }
  | { kind: "interests" }
  | { kind: "learning" }
  | { kind: "contact" }
  | { kind: "missionIndex" }
  | { kind: "help" }
  | { kind: "discovery"; id: string }
  | { kind: "networkIndex" }
  | { kind: "architecture" };

export type FocusTarget = {
  id: string;
  label: string;
  verb: string;
  kind: string;
};

export type Settings = {
  quality: Quality;
  sensitivity: number; // 0.25 .. 2.5
  invertY: boolean;
  fov: number; // 65 .. 100
  motion: "full" | "reduced";
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
  showFps: boolean;
  subtitles: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  quality: "high",
  sensitivity: 1,
  invertY: false,
  fov: 75,
  motion: "full",
  master: 0.7,
  music: 0.45,
  sfx: 0.7,
  muted: false,
  showFps: false,
  subtitles: true,
};

export type Phase = "boot" | "intro" | "ready";
export type Overlay = "none" | "map" | "pause" | "settings" | "help";

type NexusState = {
  phase: Phase;
  entered: boolean;
  sector: SectorId;
  visited: SectorId[];
  focused: FocusTarget | null;
  panel: PanelState | null;
  overlay: Overlay;
  paused: boolean;
  pointerLocked: boolean;
  transitioning: boolean;
  transitionLabel: string | null;
  fade: "none" | "out" | "in";
  openedPortals: Record<string, boolean>;
  discovered: string[];
  examined: string[];
  activated: string[];
  toast: { id: string; kind: "discovery" | "info" | "warning"; title: string; body?: string } | null;
  banner: { title: string; subtitle: string; code: string } | null;
  settings: Settings;
  audioArmed: boolean;
  tourActive: boolean;
  tourStep: number;
  webglFailed: boolean;

  setPhase: (phase: Phase) => void;
  enterFacility: () => void;
  resetIntro: () => void;
  setSector: (sector: SectorId) => void;
  setFocused: (target: FocusTarget | null) => void;
  openPanel: (panel: PanelState) => void;
  closePanel: () => void;
  setOverlay: (overlay: Overlay) => void;
  setPaused: (paused: boolean) => void;
  setPointerLocked: (locked: boolean) => void;
  setTransitioning: (transitioning: boolean, label?: string | null) => void;
  setFade: (fade: "none" | "out" | "in") => void;
  openPortal: (sector: Exclude<SectorId, "atrium">) => void;
  closePortal: (sector: Exclude<SectorId, "atrium">) => void;
  discover: (id: string, title: string, body?: string) => void;
  markExamined: (id: string) => void;
  markActivated: (id: string) => void;
  pushToast: (toast: NexusState["toast"]) => void;
  clearToast: () => void;
  showBanner: (banner: { title: string; subtitle: string; code: string } | null) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  armAudio: () => void;
  setTour: (active: boolean, step?: number) => void;
  setWebglFailed: (failed: boolean) => void;
};

export const useNexusStore = create<NexusState>()(
  persist(
    (set, get) => ({
      phase: "boot",
      entered: false,
      sector: "atrium",
      visited: ["atrium"],
      focused: null,
      panel: null,
      overlay: "none",
      paused: false,
      pointerLocked: false,
      transitioning: false,
      transitionLabel: null,
      fade: "none",
      openedPortals: {},
      discovered: [],
      examined: [],
      activated: [],
      toast: null,
      banner: null,
      settings: DEFAULT_SETTINGS,
      audioArmed: false,
      tourActive: false,
      tourStep: 0,
      webglFailed: false,

      setPhase: (phase) => set({ phase }),
      enterFacility: () => set({ phase: "ready", entered: true }),
      resetIntro: () => set({ phase: "intro", entered: false }),
      setSector: (sector) => {
        const visited = get().visited;
        set({
          sector,
          visited: visited.includes(sector) ? visited : [...visited, sector],
        });
      },
      setFocused: (focused) => {
        const current = get().focused;
        if (current?.id === focused?.id) return;
        set({ focused });
      },
      openPanel: (panel) => set({ panel, overlay: "none", paused: true }),
      closePanel: () => set({ panel: null }),
      setOverlay: (overlay) => set({ overlay }),
      setPaused: (paused) => set({ paused }),
      setPointerLocked: (pointerLocked) => set({ pointerLocked }),
      setTransitioning: (transitioning, label = null) =>
        set({ transitioning, transitionLabel: label }),
      setFade: (fade) => set({ fade }),
      openPortal: (sector) =>
        set({ openedPortals: { ...get().openedPortals, [sector]: true } }),
      closePortal: (sector) =>
        set({ openedPortals: { ...get().openedPortals, [sector]: false } }),
      discover: (id, title, body) => {
        if (get().discovered.includes(id)) return;
        set({
          discovered: [...get().discovered, id],
          toast: { id: `disc-${id}`, kind: "discovery", title, body },
        });
      },
      markExamined: (id) => {
        if (get().examined.includes(id)) return;
        set({ examined: [...get().examined, id] });
      },
      markActivated: (id) => {
        if (get().activated.includes(id)) return;
        set({ activated: [...get().activated, id] });
      },
      pushToast: (toast) => set({ toast }),
      clearToast: () => set({ toast: null }),
      showBanner: (banner) => set({ banner }),
      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        set({ settings });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.motion =
            settings.motion === "reduced" ? "reduced" : "full";
        }
      },
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      armAudio: () => set({ audioArmed: true }),
      setTour: (active, step = 0) => set({ tourActive: active, tourStep: step }),
      setWebglFailed: (failed) => set({ webglFailed: failed }),
    }),
    {
      name: "nexus-settings-v1",
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);

export const selectSettings = (s: NexusState) => s.settings;

export const useIsBusy = () =>
  useNexusStore(
    (s) => s.panel !== null || s.overlay !== "none" || s.paused || s.transitioning || s.phase !== "ready",
  );
