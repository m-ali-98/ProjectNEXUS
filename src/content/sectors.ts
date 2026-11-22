export type SectorId =
  | "atrium"
  | "application-lab"
  | "systems-core"
  | "infrastructure"
  | "network-operations"
  | "project-archive"
  | "personal-quarters";

export type SectorAccent = "cyan" | "blue" | "amber" | "white" | "red";

export type SectorMeta = {
  id: SectorId;
  number: string;
  code: string;
  name: string;
  subtitle: string;
  classification: string;
  summary: string;
  entrance: string;
  accent: SectorAccent;
  accentHex: string;
  /** Direction from the atrium centre, degrees. 0 = east, 90 = north. */
  angle: number;
  tags: string[];
  /** Conventional-site deep link providing the same information. */
  route: string;
};

export const sectors: SectorMeta[] = [
  {
    id: "atrium",
    number: "00",
    code: "ATR",
    name: "Central Atrium",
    subtitle: "Interactive Engineering Environment",
    classification: "FACILITY CORE — ORIENTATION",
    summary:
      "The convergence point of the facility. Six sectors are physically connected here, around a holographic model of the engineering stack.",
    entrance: "Facility core",
    accent: "cyan",
    accentHex: "#46e6ff",
    angle: 0,
    tags: ["Orientation", "Identity", "Navigation"],
    route: "/",
  },
  {
    id: "application-lab",
    number: "01",
    code: "APP",
    name: "Application Lab",
    subtitle: "Software & Application Development",
    classification: "SECTOR 01 — DEVELOPMENT",
    summary:
      "React Native, TypeScript, navigation, Redux, interface animation and device capabilities — presented as a working development laboratory.",
    entrance: "Application Lab",
    accent: "cyan",
    accentHex: "#46e6ff",
    angle: 0,
    tags: ["React", "TypeScript", "React Native", "Redux", "UI/UX"],
    route: "/expertise#application",
  },
  {
    id: "systems-core",
    number: "02",
    code: "SYS",
    name: "Systems Core",
    subtitle: "Application Architecture & Integration",
    classification: "SECTOR 02 — INTEGRATION",
    summary:
      "A living map of an application: frontend, API, auth, services, data, webhooks, payments and file pipelines, with their real responsibilities.",
    entrance: "Systems Core",
    accent: "blue",
    accentHex: "#5aa8ff",
    angle: 60,
    tags: ["API", "Architecture", "Webhooks", "Payments", "Data"],
    route: "/expertise#systems",
  },
  {
    id: "infrastructure",
    number: "03",
    code: "INF",
    name: "Infrastructure",
    subtitle: "Production Deployment & Operations",
    classification: "SECTOR 03 — RUNTIME",
    summary:
      "The underground data centre: server racks, cooling, and an interactive deployment pipeline from DNS to a running Node.js application.",
    entrance: "Infrastructure",
    accent: "amber",
    accentHex: "#f2a93b",
    angle: 120,
    tags: ["Linux", "Nginx", "Node.js", "TLS", "DNS"],
    route: "/expertise#infrastructure",
  },
  {
    id: "network-operations",
    number: "04",
    code: "NET",
    name: "Network Operations",
    subtitle: "Domains, DNS & Transport",
    classification: "SECTOR 04 — NETWORK",
    summary:
      "A control centre for resolution and transport: DNS record types, mail authentication, TLS handshakes and reverse-proxy routing.",
    entrance: "Network Operations",
    accent: "cyan",
    accentHex: "#46e6ff",
    angle: 180,
    tags: ["DNS", "SPF", "DKIM", "TLS", "SMTP"],
    route: "/expertise#network",
  },
  {
    id: "project-archive",
    number: "05",
    code: "ARC",
    name: "Project Archive",
    subtitle: "Engineering Missions",
    classification: "SECTOR 05 — EVIDENCE",
    summary:
      "Four engineering missions presented as physical installations, with architecture, decisions, challenges and honest limitations.",
    entrance: "Project Archive",
    accent: "cyan",
    accentHex: "#46e6ff",
    angle: 240,
    tags: ["Missions", "Case studies", "Architecture"],
    route: "/projects",
  },
  {
    id: "personal-quarters",
    number: "06",
    code: "PRS",
    name: "Personal Quarters",
    subtitle: "Background, Philosophy & Contact",
    classification: "SECTOR 06 — PERSONNEL",
    summary:
      "A quieter room: professional biography, engineering philosophy, hardware interests, learning objectives and the contact terminal.",
    entrance: "Personal Quarters",
    accent: "amber",
    accentHex: "#f2a93b",
    angle: 300,
    tags: ["Profile", "Philosophy", "Hardware", "Contact"],
    route: "/about",
  },
];

export const getSector = (id: SectorId) => sectors.find((s) => s.id === id)!;
export const ringSectors = sectors.filter((s) => s.id !== "atrium");

export const sectorOrder: SectorId[] = [
  "atrium",
  "application-lab",
  "systems-core",
  "infrastructure",
  "network-operations",
  "project-archive",
  "personal-quarters",
];
