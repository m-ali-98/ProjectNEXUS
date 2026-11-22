import type { Confidence } from "./profile";

export type Skill = {
  id: string;
  name: string;
  confidence: Confidence;
  note: string;
};

export type SkillGroup = {
  id: string;
  label: string;
  short: string;
  sector: string;
  accent: "cyan" | "blue" | "amber" | "red" | "white";
  summary: string;
  skills: Skill[];
  relatedProjects: string[];
};

/**
 * Expertise tree. `confidence` is honest about the nature of the exposure:
 * applied professionally, hands-on in real projects, technically familiar, or
 * an active learning objective.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "application",
    label: "Application Development",
    short: "APPLICATION LAB",
    sector: "application-lab",
    accent: "cyan",
    summary:
      "React and React Native applications: component architecture, navigation, device capabilities, and the interface layer that sits on top of integrated services.",
    skills: [
      {
        id: "js",
        name: "JavaScript",
        confidence: "professional",
        note: "Core language for frontend and mobile work; modules, async flows, browser APIs.",
      },
      {
        id: "ts",
        name: "TypeScript",
        confidence: "professional",
        note: "Typed application code, interface contracts for API payloads, safer refactors.",
      },
      {
        id: "react",
        name: "React",
        confidence: "professional",
        note: "Component composition, hooks, rendering behaviour and state boundaries.",
      },
      {
        id: "rn",
        name: "React Native",
        confidence: "working",
        note: "Cross-platform application development with native module access.",
      },
      {
        id: "nav",
        name: "React Navigation",
        confidence: "working",
        note: "Stack, tab and nested navigators; screen parameters and deep linking patterns.",
      },
      {
        id: "redux",
        name: "Redux & state management",
        confidence: "professional",
        note: "Shared application state, reducers, async flows and predictable updates.",
      },
      {
        id: "anim",
        name: "Animation & interaction",
        confidence: "working",
        note: "Gesture-driven transitions, animated feedback and motion that carries meaning.",
      },
      {
        id: "uiux",
        name: "UI/UX implementation",
        confidence: "professional",
        note: "Turning layouts into responsive, accessible interfaces without losing intent.",
      },
      {
        id: "device",
        name: "Camera, video & voice",
        confidence: "working",
        note: "Device capture and playback integrated into application flows.",
      },
      {
        id: "chat",
        name: "Chat applications",
        confidence: "working",
        note: "Conversation UI, message state, media handling and delivery feedback.",
      },
    ],
    relatedProjects: ["mission-001", "mission-002", "mission-004"],
  },
  {
    id: "systems",
    label: "Systems & Integration",
    short: "SYSTEMS CORE",
    sector: "systems-core",
    accent: "blue",
    summary:
      "Where the application meets the rest of the world: APIs, authentication, business logic, payments, webhooks and file pipelines.",
    skills: [
      {
        id: "api",
        name: "API integration",
        confidence: "professional",
        note: "Consuming and shaping REST APIs, handling error surfaces and loading states.",
      },
      {
        id: "backend",
        name: "Backend application integration",
        confidence: "professional",
        note: "Connecting application layers to backend services and shared data contracts.",
      },
      {
        id: "arch",
        name: "Application architecture",
        confidence: "working",
        note: "Separating routing, state, services and presentation so systems stay changeable.",
      },
      {
        id: "hooks",
        name: "Webhooks & callbacks",
        confidence: "professional",
        note: "Receiving asynchronous provider callbacks and making them verifiable and idempotent.",
      },
      {
        id: "pay",
        name: "Payment integration",
        confidence: "professional",
        note: "Gateway initiation and callback handling, including Zarinpal flows.",
      },
      {
        id: "files",
        name: "File handling",
        confidence: "professional",
        note: "Uploads, size limits, streaming and large-file handling through a proxy.",
      },
      {
        id: "biz",
        name: "Business-oriented software",
        confidence: "professional",
        note: "Administrative functionality, user management and operational workflows.",
      },
      {
        id: "auth",
        name: "Authentication & access",
        confidence: "working",
        note: "Session/token flows, protected routes and role-aware interfaces.",
      },
    ],
    relatedProjects: ["mission-001", "mission-002", "mission-004"],
  },
  {
    id: "infrastructure",
    label: "Infrastructure & Deployment",
    short: "INFRASTRUCTURE",
    sector: "infrastructure",
    accent: "amber",
    summary:
      "The runtime layer: Linux VPS environments, reverse proxies, TLS, DNS and Node.js deployments that keep applications reachable.",
    skills: [
      {
        id: "vps",
        name: "VPS environments",
        confidence: "professional",
        note: "Provisioning and operating Linux virtual servers for production applications.",
      },
      {
        id: "linux",
        name: "Linux server configuration",
        confidence: "professional",
        note: "Service management, permissions, firewalling and operational troubleshooting.",
      },
      {
        id: "nginx",
        name: "Nginx",
        confidence: "professional",
        note: "Server blocks, reverse proxying, headers, client body limits and TLS termination.",
      },
      {
        id: "node",
        name: "Node.js deployment",
        confidence: "professional",
        note: "Running Node applications behind a proxy with process supervision.",
      },
      {
        id: "dns",
        name: "DNS management",
        confidence: "professional",
        note: "A/MX/TXT records, subdomains, propagation-aware changes and domain configuration.",
      },
      {
        id: "tls",
        name: "SSL/TLS & Certbot",
        confidence: "professional",
        note: "Certificate issuance and renewal, HTTPS enforcement and redirect strategy.",
      },
      {
        id: "proxy",
        name: "Reverse proxies",
        confidence: "professional",
        note: "Routing public traffic to application servers, header forwarding and timeouts.",
      },
      {
        id: "trouble",
        name: "Production troubleshooting",
        confidence: "professional",
        note: "Reading logs, isolating layers, and fixing incidents without guesswork.",
      },
    ],
    relatedProjects: ["mission-001", "mission-003"],
  },
  {
    id: "network",
    label: "Network Operations",
    short: "NETWORK OPS",
    sector: "network-operations",
    accent: "cyan",
    summary:
      "Domains, DNS architecture, mail authentication and the web-server layer that serves public traffic.",
    skills: [
      {
        id: "records",
        name: "DNS records",
        confidence: "professional",
        note: "A, AAAA, CNAME, MX and TXT records — what each actually answers.",
      },
      {
        id: "mail",
        name: "Email authentication",
        confidence: "working",
        note: "SPF, DKIM and DMARC basics for domain-aligned mail delivery.",
      },
      {
        id: "https",
        name: "HTTPS / TLS handshake",
        confidence: "professional",
        note: "Certificate chains, renewal, HSTS considerations and redirect behaviour.",
      },
      {
        id: "subdomain",
        name: "Subdomain architecture",
        confidence: "professional",
        note: "Separating services by host, then routing them through one proxy.",
      },
      {
        id: "servers",
        name: "Nginx & Caddy",
        confidence: "professional",
        note: "Nginx in production; Caddy's automatic TLS model as a comparison point.",
      },
      {
        id: "hosting",
        name: "Web hosting",
        confidence: "professional",
        note: "Static and dynamic hosting, document roots, cache and compression headers.",
      },
    ],
    relatedProjects: ["mission-001", "mission-003"],
  },
  {
    id: "web",
    label: "Web Platforms & Content",
    short: "WEB PLATFORMS",
    sector: "application-lab",
    accent: "white",
    summary:
      "Corporate and content-driven web platforms: responsive interfaces, multilingual URL architecture and search visibility.",
    skills: [
      {
        id: "html",
        name: "HTML & CSS",
        confidence: "professional",
        note: "Semantic structure, responsive layout systems and cross-browser behaviour.",
      },
      {
        id: "wordpress",
        name: "WordPress",
        confidence: "professional",
        note: "Theme-level customisation, content structures and practical administration.",
      },
      {
        id: "seo",
        name: "SEO fundamentals",
        confidence: "working",
        note: "Metadata, heading structure, sitemaps and crawlable multilingual URLs.",
      },
      {
        id: "multi",
        name: "Multilingual architecture",
        confidence: "professional",
        note: "Per-language routes, RTL handling and localised content structures.",
      },
      {
        id: "site",
        name: "Website architecture",
        confidence: "professional",
        note: "Information hierarchy, navigation design and content modelling.",
      },
    ],
    relatedProjects: ["mission-001"],
  },
  {
    id: "hardware",
    label: "Hardware & Performance",
    short: "HARDWARE LAB",
    sector: "personal-quarters",
    accent: "amber",
    summary:
      "A technical interest and experimentation area: platform architecture, configuration and measurement — not offered as a professional qualification.",
    skills: [
      {
        id: "cpu",
        name: "CPU / GPU architecture",
        confidence: "familiar",
        note: "Cores, cache hierarchy, memory controllers, GPU scheduling — conceptual understanding.",
      },
      {
        id: "bios",
        name: "BIOS configuration",
        confidence: "familiar",
        note: "Firmware settings, boot configuration, platform features and stability testing.",
      },
      {
        id: "bench",
        name: "Benchmarking",
        confidence: "familiar",
        note: "Repeatable measurement, variance, and why one run is not evidence.",
      },
      {
        id: "mem",
        name: "Memory tuning",
        confidence: "familiar",
        note: "Timings, frequency and stability trade-offs, validated with stress tests.",
      },
      {
        id: "thermal",
        name: "Thermal management",
        confidence: "familiar",
        note: "Cooling capacity, airflow, thermal throttling behaviour.",
      },
      {
        id: "osopt",
        name: "OS optimisation",
        confidence: "working",
        note: "Service trimming, scheduling and system-level performance tuning.",
      },
    ],
    relatedProjects: ["mission-003"],
  },
];

export const getSkillGroup = (id: string) => skillGroups.find((g) => g.id === id);

export const allSkills = skillGroups.flatMap((group) =>
  group.skills.map((skill) => ({ ...skill, groupId: group.id, groupLabel: group.label })),
);

/** Technologies referenced across the portfolio, for the tech tree / filters. */
export const technologyIndex = Array.from(
  new Set(
    allSkills.map((s) => s.name).concat(["REST APIs", "Zarinpal", "HTTPS", "Certbot", "RTL layout"]),
  ),
).sort((a, b) => a.localeCompare(b));
