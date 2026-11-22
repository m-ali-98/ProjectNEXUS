/**
 * Sector fixtures and interaction anchors.
 *
 * Both the wall geometry and the interactive registry read from here, so a
 * console rendered on screen is always the console the player can activate.
 * Coordinates are room-local: x across the room, z toward the back wall, and
 * every room is placed by `frameFor()` in worldLayout.ts.
 */
import type { SectorId } from "@/content/sectors";
import type { PanelState } from "@/stores/nexusStore";
import { getProject } from "@/content/projects";

export type PropType =
  | "rack"
  | "console"
  | "station"
  | "pylon"
  | "monolith"
  | "pedestal"
  | "table"
  | "bench"
  | "cooler"
  | "crate"
  | "serverStack";

export type LocalProp = {
  id: string;
  type: PropType;
  x: number;
  z: number;
  rotY?: number;
  w?: number;
  d?: number;
  h?: number;
  variant?: string;
  solid?: boolean;
  /** Optional display title for generic fixtures (e.g. the philosophy slab). */
  text?: string;
};

export type InteractionKind =
  | "terminal"
  | "exhibit"
  | "hologram"
  | "portal"
  | "console";

export type InteractionAction =
  | { type: "travel"; sector: SectorId }
  | { type: "exit" }
  | { type: "map" }
  | { type: "tour" }
  | { type: "resume" };

export type LocalInteraction = {
  id: string;
  kind: InteractionKind;
  sector: SectorId;
  code: string;
  label: string;
  verb: string;
  x: number;
  y: number;
  z: number;
  radius?: number;
  /** Where the marker sits, if different from the activation point. */
  markerY?: number;
  panel?: PanelState;
  action?: InteractionAction;
  discoveryId?: string;
};

const facing = (x: number, z: number, cx = 0, cz = 0) => Math.atan2(cx - x, cz - z);

// ---------------------------------------------------------------------------
// ATRIUM
// ---------------------------------------------------------------------------

export const atriumInteractions: LocalInteraction[] = [
  {
    id: "atrium-core",
    kind: "hologram",
    sector: "atrium",
    code: "ATR-01",
    label: "Engineering Core",
    verb: "INTERFACE",
    x: 0,
    y: 1.35,
    z: 5.2,
    radius: 4.2,
    panel: { kind: "identity" },
  },
  {
    id: "atrium-map",
    kind: "terminal",
    sector: "atrium",
    code: "ATR-02",
    label: "Facility Map",
    verb: "OPEN MAP",
    x: 7.4,
    y: 1.15,
    z: 7.6,
    panel: undefined,
    action: { type: "map" },
  },
  {
    id: "atrium-tour",
    kind: "console",
    sector: "atrium",
    code: "ATR-03",
    label: "Guided Orientation",
    verb: "BEGIN TOUR",
    x: -7.4,
    y: 1.15,
    z: 7.6,
    action: { type: "tour" },
  },
  {
    id: "atrium-maintenance-panel",
    kind: "terminal",
    sector: "atrium",
    code: "ATR-04",
    label: "Maintenance Access",
    verb: "INSPECT",
    x: 13.9,
    y: 1.3,
    z: -7.4,
    radius: 2.6,
    discoveryId: "atrium-maintenance",
  },
];

// --- Sector portals are generated from the six wall doors -------------------
export const portalAnchors: { sector: Exclude<SectorId, "atrium">; label: string; code: string }[] = [
  { sector: "application-lab", label: "Application Lab", code: "01" },
  { sector: "systems-core", label: "Systems Core", code: "02" },
  { sector: "infrastructure", label: "Infrastructure", code: "03" },
  { sector: "network-operations", label: "Network Operations", code: "04" },
  { sector: "project-archive", label: "Project Archive", code: "05" },
  { sector: "personal-quarters", label: "Personal Quarters", code: "06" },
];

// ---------------------------------------------------------------------------
// 01 APPLICATION LAB
// ---------------------------------------------------------------------------

export const applicationLabProps: LocalProp[] = [
  // Eight development stations along the side walls.
  { id: "st-1", type: "station", x: -13.4, z: -8, rotY: Math.PI / 2, solid: true },
  { id: "st-2", type: "station", x: -13.4, z: -2, rotY: Math.PI / 2, solid: true },
  { id: "st-3", type: "station", x: -13.4, z: 4, rotY: Math.PI / 2, solid: true },
  { id: "st-4", type: "station", x: 13.4, z: -8, rotY: -Math.PI / 2, solid: true },
  { id: "st-5", type: "station", x: 13.4, z: -2, rotY: -Math.PI / 2, solid: true },
  { id: "st-6", type: "station", x: 13.4, z: 4, rotY: -Math.PI / 2, solid: true },
  { id: "st-7", type: "station", x: -6.5, z: 9.2, rotY: Math.PI, solid: true },
  { id: "st-8", type: "station", x: 6.5, z: 9.2, rotY: Math.PI, solid: true },
  // Centre: holo architecture table + device pedestal.
  { id: "lab-table", type: "table", x: 0, z: -6.5, w: 5.4, d: 2.6, h: 0.95, solid: true },
  { id: "lab-pedestal", type: "pedestal", x: 0, z: 2.4, w: 2.4, d: 2.4, h: 1.0, solid: true },
  { id: "lab-crate-a", type: "crate", x: 16.4, z: 11.2, w: 1.8, d: 1.6, h: 1.2, solid: true },
  { id: "lab-crate-b", type: "crate", x: 16.4, z: 9.1, w: 1.4, d: 1.4, h: 0.8, solid: true },
];

export const applicationLabInteractions: LocalInteraction[] = [
  ...(
    [
      { id: "lab-rn", label: "React Native", code: "APP-01", x: -11.6, z: -8 },
      { id: "lab-ts", label: "JavaScript & TypeScript", code: "APP-02", x: -11.6, z: -2 },
      { id: "lab-nav", label: "React Navigation", code: "APP-03", x: -11.6, z: 4 },
      { id: "lab-state", label: "Redux & State", code: "APP-04", x: 11.6, z: -8 },
      { id: "lab-ui", label: "UI/UX & Animation", code: "APP-05", x: 11.6, z: -2 },
      { id: "lab-api", label: "API Integration", code: "APP-06", x: 11.6, z: 4 },
      { id: "lab-device", label: "Camera, Video & Voice", code: "APP-07", x: -6.5, z: 7.8 },
      { id: "lab-chat", label: "Chat Systems", code: "APP-08", x: 6.5, z: 7.8 },
    ] as const
  ).map((s) => ({
    id: s.id,
    kind: "terminal" as InteractionKind,
    sector: "application-lab" as SectorId,
    code: s.code,
    label: s.label,
    verb: "EXAMINE",
    x: s.x,
    y: 1.2,
    z: s.z,
    panel: { kind: "labStation", id: s.id } as PanelState,
  })),
  {
    id: "lab-device-mock",
    kind: "exhibit",
    sector: "application-lab",
    code: "APP-DEV",
    label: "Chat Interface Reconstruction",
    verb: "INSPECT DEVICE",
    x: 0,
    y: 1.75,
    z: 4.0,
    radius: 3.2,
    panel: { kind: "chat" },
  },
  {
    id: "lab-architecture",
    kind: "hologram",
    sector: "application-lab",
    code: "APP-ARCH",
    label: "Application Architecture",
    verb: "VISUALISE",
    x: 0,
    y: 1.9,
    z: -4.6,
    radius: 3,
    panel: { kind: "systemNode", id: "frontend" },
  },
];

// ---------------------------------------------------------------------------
// 02 SYSTEMS CORE
// ---------------------------------------------------------------------------

export const systemsCoreProps: LocalProp[] = [
  { id: "sys-core-base", type: "pedestal", x: 0, z: 0, w: 3.2, d: 3.2, h: 1.1, solid: true },
  { id: "sys-console-a", type: "console", x: -7.6, z: -8.6, rotY: facing(-7.6, -8.6), solid: true },
  { id: "sys-console-b", type: "console", x: 7.6, z: -8.6, rotY: facing(7.6, -8.6), solid: true },
  { id: "sys-console-c", type: "console", x: 0, z: 8.6, rotY: facing(0, 8.6), solid: true },
  { id: "sys-crate-a", type: "crate", x: -16.2, z: 11.0, w: 1.6, d: 1.4, h: 1.4, solid: true },
  { id: "sys-crate-b", type: "crate", x: 16.2, z: 11.0, w: 1.6, d: 1.4, h: 1.0, solid: true },
];

export const systemsCoreInteractions: LocalInteraction[] = [
  {
    id: "sys-architecture",
    kind: "hologram",
    sector: "systems-core",
    code: "SYS-CORE",
    label: "System Overview",
    verb: "ANALYSE",
    x: 0,
    y: 1.6,
    z: 2.4,
    radius: 3.4,
    panel: { kind: "architecture" },
  },
  {
    id: "sys-integration-log",
    kind: "console",
    sector: "systems-core",
    code: "SYS-01",
    label: "Integration Log",
    verb: "OPEN RECORD",
    x: 0,
    y: 1.15,
    z: 7.1,
    radius: 2.3,
    panel: { kind: "project", id: "mission-004" },
  },
  {
    id: "sys-client-side",
    kind: "console",
    sector: "systems-core",
    code: "SYS-02",
    label: "Client State Reference",
    verb: "OPEN RECORD",
    x: -6.0,
    y: 1.15,
    z: -7.2,
    radius: 2.3,
    panel: { kind: "project", id: "mission-002" },
  },
  {
    id: "sys-edge-ref",
    kind: "console",
    sector: "systems-core",
    code: "SYS-03",
    label: "Edge Routing Reference",
    verb: "OPEN RECORD",
    x: 6.0,
    y: 1.15,
    z: -7.2,
    radius: 2.3,
    panel: { kind: "project", id: "mission-001" },
  },
];

/** Node ring for the Systems Core visualisation. */
export const SYSTEM_NODE_RADIUS = 6.4;
export const systemNodeLocalPosition = (index: number, count: number) => {
  const a = (index / count) * Math.PI * 2 + Math.PI / 9;
  return {
    x: Math.sin(a) * SYSTEM_NODE_RADIUS,
    z: Math.cos(a) * SYSTEM_NODE_RADIUS,
    y: 2.35 + (index % 3) * 0.85,
    angle: a,
  };
};

// ---------------------------------------------------------------------------
// 03 INFRASTRUCTURE
// ---------------------------------------------------------------------------

const RACK_Z = [-9.2, -3.1, 3.1, 9.2];

export const infrastructureProps: LocalProp[] = [
  ...RACK_Z.flatMap((z, i) => [
    {
      id: `rack-l-${i}`,
      type: "rack" as PropType,
      x: -12.6,
      z,
      rotY: Math.PI / 2,
      variant: "left",
      solid: true,
    },
    {
      id: `rack-r-${i}`,
      type: "rack" as PropType,
      x: 12.6,
      z,
      rotY: -Math.PI / 2,
      variant: "right",
      solid: true,
    },
  ]),
  ...[
    { id: "pipe-1", z: -8 },
    { id: "pipe-2", z: -4 },
    { id: "pipe-3", z: 0 },
    { id: "pipe-4", z: 4 },
    { id: "pipe-5", z: 8 },
  ].map((p) => ({
    id: p.id,
    type: "pylon" as PropType,
    x: 0,
    z: p.z,
    w: 1.5,
    d: 1.5,
    h: 1.05,
    solid: true,
  })),
  { id: "inf-term-l1", type: "console", x: -8.6, z: -6, rotY: Math.PI / 2, solid: true },
  { id: "inf-term-l2", type: "console", x: -8.6, z: 0, rotY: Math.PI / 2, solid: true },
  { id: "inf-term-l3", type: "console", x: -8.6, z: 6, rotY: Math.PI / 2, solid: true },
  { id: "inf-term-r1", type: "console", x: 8.6, z: -6, rotY: -Math.PI / 2, solid: true },
  { id: "inf-term-r2", type: "console", x: 8.6, z: 0, rotY: -Math.PI / 2, solid: true },
  { id: "inf-term-r3", type: "console", x: 8.6, z: 6, rotY: -Math.PI / 2, solid: true },
  { id: "cooler-a", type: "cooler", x: -16.4, z: 11.2, w: 2.6, d: 2.2, h: 4.2, solid: true },
  { id: "cooler-b", type: "cooler", x: 16.4, z: 11.2, w: 2.6, d: 2.2, h: 4.2, solid: true },
  { id: "inf-crate", type: "crate", x: 16.6, z: -10.8, w: 1.8, d: 1.8, h: 1.1, solid: true },
];

export const infrastructureInteractions: LocalInteraction[] = [
  ...(
    [
      { id: "stage-dns", label: "Domain & DNS", code: "L1", z: -8 },
      { id: "stage-tls", label: "HTTPS / SSL", code: "L2", z: -4 },
      { id: "stage-proxy", label: "Nginx Reverse Proxy", code: "L3", z: 0 },
      { id: "stage-runtime", label: "Application Server", code: "L4", z: 4 },
      { id: "stage-services", label: "Backend Services", code: "L5", z: 8 },
    ] as const
  ).map((s) => ({
    id: `inf-${s.id}`,
    kind: "exhibit" as InteractionKind,
    sector: "infrastructure" as SectorId,
    code: `PIPE-${s.code}`,
    label: s.label,
    verb: "INSPECT STAGE",
    x: 0,
    y: 1.25,
    z: s.z,
    radius: 2.4,
    panel: { kind: "pipeline", id: s.id } as PanelState,
  })),
  ...(
    [
      { id: "inf-vps", label: "VPS Environments", code: "OPS-01", x: -7.2, z: -6 },
      { id: "inf-linux", label: "Linux Configuration", code: "OPS-02", x: -7.2, z: 0 },
      { id: "inf-nginx", label: "Nginx", code: "OPS-03", x: -7.2, z: 6 },
      { id: "inf-tls", label: "SSL / Certbot", code: "OPS-04", x: 7.2, z: -6 },
      { id: "inf-deploy", label: "Node.js Deployment", code: "OPS-05", x: 7.2, z: 0 },
      { id: "inf-trouble", label: "Production Troubleshooting", code: "OPS-06", x: 7.2, z: 6 },
    ] as const
  ).map((t) => ({
    id: t.id,
    kind: "terminal" as InteractionKind,
    sector: "infrastructure" as SectorId,
    code: t.code,
    label: t.label,
    verb: "OPEN TERMINAL",
    x: t.x,
    y: 1.15,
    z: t.z,
    radius: 2.2,
    panel: { kind: "infraTerminal", id: t.id } as PanelState,
  })),
];

// ---------------------------------------------------------------------------
// 04 NETWORK OPERATIONS
// ---------------------------------------------------------------------------

export const networkProps: LocalProp[] = [
  { id: "net-plinth", type: "pedestal", x: 0, z: 0, w: 5.2, d: 5.2, h: 0.7, solid: true },
  { id: "net-console-dns", type: "console", x: 5.7, z: -5.7, rotY: facing(5.7, -5.7), solid: true },
  { id: "net-console-mail", type: "console", x: -5.7, z: -5.7, rotY: facing(-5.7, -5.7), solid: true },
  { id: "net-console-tls", type: "console", x: -5.7, z: 5.7, rotY: facing(-5.7, 5.7), solid: true },
  { id: "net-console-proxy", type: "console", x: 5.7, z: 5.7, rotY: facing(5.7, 5.7), solid: true },
  { id: "net-legacy", type: "console", x: 0, z: 4.9, rotY: 0, solid: true },
  { id: "net-crate", type: "crate", x: -16.2, z: 10.8, w: 1.6, d: 1.6, h: 0.9, solid: true },
];

export const networkInteractions: LocalInteraction[] = [
  {
    id: "net-dns-console",
    kind: "console",
    sector: "network-operations",
    code: "NET-01",
    label: "DNS Record Console",
    verb: "QUERY RECORDS",
    x: 4.4,
    y: 1.15,
    z: -4.4,
    radius: 2.3,
    panel: { kind: "networkIndex" },
  },
  {
    id: "net-mail-console",
    kind: "console",
    sector: "network-operations",
    code: "NET-02",
    label: "Mail Authentication",
    verb: "INSPECT POLICY",
    x: -4.4,
    y: 1.15,
    z: -4.4,
    radius: 2.3,
    panel: { kind: "mailAuth", id: "spf" },
  },
  {
    id: "net-tls-console",
    kind: "console",
    sector: "network-operations",
    code: "NET-03",
    label: "TLS Handshake",
    verb: "TRACE HANDSHAKE",
    x: -4.4,
    y: 1.15,
    z: 4.4,
    radius: 2.3,
    panel: { kind: "tls" },
  },
  {
    id: "net-proxy-console",
    kind: "console",
    sector: "network-operations",
    code: "NET-04",
    label: "Reverse Proxy Routing",
    verb: "ROUTE INSPECT",
    x: 4.4,
    y: 1.15,
    z: 4.4,
    radius: 2.3,
    panel: { kind: "proxy" },
  },
  {
    id: "net-globe",
    kind: "hologram",
    sector: "network-operations",
    code: "NET-GLOBE",
    label: "Network Globe",
    verb: "READ TOPOLOGY",
    x: 0,
    y: 1.5,
    z: -3.15,
    radius: 2.9,
    panel: { kind: "networkIndex" },
  },
  {
    id: "net-legacy-console",
    kind: "terminal",
    sector: "network-operations",
    code: "NET-05",
    label: "Legacy Resolver Console",
    verb: "INSPECT",
    x: 0,
    y: 1.15,
    z: 4.0,
    radius: 2.0,
    discoveryId: "net-console",
  },
];

// ---------------------------------------------------------------------------
// 05 PROJECT ARCHIVE
// ---------------------------------------------------------------------------

const archivePositions = [
  { id: "mission-001", x: -9, z: -6 },
  { id: "mission-002", x: 9, z: -6 },
  { id: "mission-003", x: -9, z: 6 },
  { id: "mission-004", x: 9, z: 6 },
];

export const archiveProps: LocalProp[] = [
  ...archivePositions.map((p) => ({
    id: `archive-${p.id}`,
    type: "monolith" as PropType,
    x: p.x,
    z: p.z,
    rotY: facing(p.x, p.z),
    w: 5.6,
    d: 1.3,
    h: 3.6,
    variant: p.id,
    solid: true,
  })),
  { id: "archive-index", type: "console", x: 0, z: 9.4, rotY: 0, solid: true },
  { id: "archive-desk", type: "table", x: 12.4, z: 9.6, w: 2.8, d: 1.6, h: 0.9, solid: true },
];

export const archiveInteractions: LocalInteraction[] = [
  ...archivePositions.map((p) => ({
    id: `archive-${p.id}`,
    kind: "exhibit" as InteractionKind,
    sector: "project-archive" as SectorId,
    code: `M-${p.id.slice(-3)}`,
    label: getProject(p.id)?.title ?? "Mission",
    verb: "ACCESS MISSION",
    x: p.x * 0.72,
    y: 1.6,
    z: p.z * 0.72,
    radius: 3.4,
    panel: { kind: "project", id: p.id } as PanelState,
  })),
  {
    id: "archive-index-terminal",
    kind: "terminal",
    sector: "project-archive",
    code: "ARC-00",
    label: "Mission Index",
    verb: "LIST MISSIONS",
    x: 0,
    y: 1.15,
    z: 7.9,
    radius: 2.3,
    panel: { kind: "missionIndex" },
  },
  {
    id: "archive-draft-note",
    kind: "terminal",
    sector: "project-archive",
    code: "ARC-SEC",
    label: "Discarded Approach Note",
    verb: "READ",
    x: 12.4,
    y: 1.15,
    z: 8.1,
    radius: 2.1,
    discoveryId: "archive-draft",
  },
];

// ---------------------------------------------------------------------------
// 06 PERSONAL QUARTERS
// ---------------------------------------------------------------------------

export const quartersProps: LocalProp[] = [
  { id: "quarters-philosophy", type: "monolith", x: 0, z: -3.4, rotY: Math.PI, w: 4.6, d: 1.0, h: 3.4, solid: true, variant: "philosophy", text: "ENGINEERING PHILOSOPHY" },
  { id: "quarters-bio", type: "console", x: -9.2, z: 0.4, rotY: facing(-9.2, 0.4), solid: true },
  { id: "quarters-interests", type: "console", x: 9.2, z: 0.4, rotY: facing(9.2, 0.4), solid: true },
  { id: "quarters-learning", type: "console", x: -11.2, z: 6.4, rotY: facing(-11.2, 6.4), solid: true },
  { id: "quarters-contact", type: "console", x: 12.6, z: 6.4, rotY: facing(12.6, 6.4), solid: true },
  { id: "quarters-hardware", type: "bench", x: -15.2, z: -9.6, rotY: facing(-15.2, -9.6), w: 3.4, d: 1.3, h: 1.0, solid: true },
  { id: "quarters-dev", type: "table", x: 15.0, z: -9.8, rotY: facing(15.0, -9.8), w: 3.2, d: 1.5, h: 0.95, solid: true },
  { id: "quarters-seat-a", type: "crate", x: 3.6, z: -8.4, w: 1.0, d: 1.0, h: 0.55, solid: true },
  { id: "quarters-seat-b", type: "crate", x: -3.6, z: -8.4, w: 1.0, d: 1.0, h: 0.55, solid: true },
];

export const quartersInteractions: LocalInteraction[] = [
  {
    id: "quarters-timeline",
    kind: "exhibit",
    sector: "personal-quarters",
    code: "PRS-01",
    label: "Career Timeline",
    verb: "READ TIMELINE",
    x: 0,
    y: 1.5,
    z: 10.6,
    radius: 3.4,
    panel: { kind: "timeline" },
  },
  {
    id: "quarters-bio-terminal",
    kind: "terminal",
    sector: "personal-quarters",
    code: "PRS-02",
    label: "Professional Biography",
    verb: "OPEN PROFILE",
    x: -7.4,
    y: 1.15,
    z: 0.9,
    radius: 2.2,
    panel: { kind: "bio" },
  },
  {
    id: "quarters-philosophy-terminal",
    kind: "exhibit",
    sector: "personal-quarters",
    code: "PRS-03",
    label: "Engineering Philosophy",
    verb: "READ",
    x: 0,
    y: 1.5,
    z: -1.6,
    radius: 2.8,
    panel: { kind: "philosophy" },
  },
  {
    id: "quarters-interests-terminal",
    kind: "terminal",
    sector: "personal-quarters",
    code: "PRS-04",
    label: "Technical Interests",
    verb: "OPEN",
    x: 7.4,
    y: 1.15,
    z: 0.9,
    radius: 2.2,
    panel: { kind: "interests" },
  },
  {
    id: "quarters-learning-terminal",
    kind: "terminal",
    sector: "personal-quarters",
    code: "PRS-05",
    label: "Learning Objectives",
    verb: "OPEN",
    x: -9.0,
    y: 1.15,
    z: 5.2,
    radius: 2.2,
    panel: { kind: "learning" },
  },
  {
    id: "quarters-contact-terminal",
    kind: "console",
    sector: "personal-quarters",
    code: "PRS-06",
    label: "Contact Terminal",
    verb: "OPEN CHANNEL",
    x: 10.2,
    y: 1.15,
    z: 5.2,
    radius: 2.4,
    panel: { kind: "contact" },
  },
  {
    id: "quarters-hardware-bench",
    kind: "terminal",
    sector: "personal-quarters",
    code: "PRS-SEC1",
    label: "Hardware Bench",
    verb: "INSPECT",
    x: -13.0,
    y: 1.1,
    z: -8.0,
    radius: 2.4,
    discoveryId: "hardware-corner",
  },
  {
    id: "quarters-dev-corner",
    kind: "terminal",
    sector: "personal-quarters",
    code: "PRS-SEC2",
    label: "Unmarked Workstation",
    verb: "INSPECT",
    x: 13.0,
    y: 1.1,
    z: -8.2,
    radius: 2.4,
    discoveryId: "dev-corner",
  },
];

export const sectorProps: Record<SectorId, LocalProp[]> = {
  atrium: [],
  "application-lab": applicationLabProps,
  "systems-core": systemsCoreProps,
  infrastructure: infrastructureProps,
  "network-operations": networkProps,
  "project-archive": archiveProps,
  "personal-quarters": quartersProps,
};

export const sectorInteractions: Record<SectorId, LocalInteraction[]> = {
  atrium: atriumInteractions,
  "application-lab": applicationLabInteractions,
  "systems-core": systemsCoreInteractions,
  infrastructure: infrastructureInteractions,
  "network-operations": networkInteractions,
  "project-archive": archiveInteractions,
  "personal-quarters": quartersInteractions,
};
