export type ProjectStatus = "delivered" | "operational" | "ongoing";

export type EvidenceKind =
  | "verified"
  | "conceptual"
  | "illustrative"
  | "planned"
  | "external";

export type ArchitectureStage = {
  id: string;
  label: string;
  short: string;
  detail: string;
  tech: string[];
  evidence: EvidenceKind;
};

export type Project = {
  id: string;
  missionNo: string;
  code: string;
  title: string;
  subtitle: string;
  organisation: string;
  url?: string;
  classification: string;
  sector: string;
  accent: "cyan" | "amber" | "blue" | "white" | "red";
  status: ProjectStatus;
  year: string;
  summary: string;
  briefing: string[];
  responsibilities: string[];
  architecture: ArchitectureStage[];
  technologies: string[];
  challenges: { title: string; problem: string; response: string }[];
  outcomes: string[];
  caveats: string[];
  facts: { label: string; value: string }[];
  media: { id: string; kind: EvidenceKind; label: string; disclaimer: string }[];
  /** Node ids in the Systems Core that relate to this mission. */
  systemNodes: string[];
};

export const projects: Project[] = [
  {
    id: "mission-001",
    missionNo: "001",
    code: "KHY-PLATFORM",
    title: "Khuzestan Yeast Corporate Digital Platform",
    subtitle: "Multilingual corporate platform, deployed and operated end to end",
    organisation: "Khuzestan Yeast Manufacturing Co.",
    url: "https://khuzestanyeast-co.com/",
    classification: "FLAGSHIP — WEB PLATFORM / INFRASTRUCTURE",
    sector: "project-archive",
    accent: "cyan",
    status: "operational",
    year: "Production deployment",
    summary:
      "A corporate web platform for an industrial manufacturer: responsive interfaces, a multilingual URL architecture across Persian, English, Arabic and Russian, payment callback handling, and the full deployment path — DNS, TLS, Nginx reverse proxy and a Node.js production application on a VPS.",
    briefing: [
      "Khuzestan Yeast Manufacturing Co. needed a corporate presence that could serve four language audiences — Persian, English, Arabic and Russian — while still behaving like a single coherent platform rather than four disconnected sites.",
      "The work covered both halves of that problem. On the surface: responsive layouts, an information architecture for products and company content, and a multilingual route structure that is crawlable and shareable. Underneath: payment callbacks, large file upload handling, DNS and domain administration, TLS, and a Nginx-fronted Node.js deployment on a Linux VPS.",
      "It is the clearest single example of how I work: the interface, the integration layer and the infrastructure are one system, and each one is only as reliable as the layer beneath it.",
    ],
    responsibilities: [
      "Corporate website development and responsive interface implementation",
      "Multilingual URL and content architecture (fa / en / ar / ru) including RTL layout",
      "SEO and sitemap configuration for multilingual routes",
      "Domain and DNS administration",
      "VPS deployment, Linux server configuration and Node.js production runtime",
      "Nginx reverse proxy configuration with TLS termination",
      "SSL certificate issuance and renewal via Certbot; HTTPS enforcement",
      "Large file upload handling through the proxy layer",
      "Zarinpal payment callback integration",
      "Production troubleshooting across the network, proxy and application layers",
    ],
    architecture: [
      {
        id: "visitor",
        label: "Visitor",
        short: "CLIENT",
        detail:
          "Browser requests the public hostname over HTTPS. Language selection is encoded in the URL so every page has one canonical, shareable address per locale.",
        tech: ["HTML", "CSS", "JavaScript", "Responsive layout"],
        evidence: "verified",
      },
      {
        id: "dns",
        label: "DNS",
        short: "RESOLUTION",
        detail:
          "Authoritative DNS resolves the corporate hostname to the VPS address. Subdomains and mail-related records are managed in the same zone.",
        tech: ["A records", "CNAME", "TXT", "MX"],
        evidence: "verified",
      },
      {
        id: "tls",
        label: "HTTPS / TLS",
        short: "TRANSPORT",
        detail:
          "TLS terminates at the reverse proxy with a Certbot-issued certificate; plain HTTP is redirected to HTTPS so every request arrives encrypted.",
        tech: ["SSL/TLS", "Certbot", "HTTPS redirect"],
        evidence: "verified",
      },
      {
        id: "nginx",
        label: "Nginx reverse proxy",
        short: "PROXY",
        detail:
          "Nginx serves the public entry point, forwards application traffic to the Node.js process, enforces request body limits large enough for file uploads, and adds security headers.",
        tech: ["Nginx", "proxy_pass", "client_max_body_size", "Headers"],
        evidence: "verified",
      },
      {
        id: "node",
        label: "Node.js application",
        short: "RUNTIME",
        detail:
          "The Node.js production application renders the platform, handles locale routing, and exposes the endpoints used by forms, uploads and payment callbacks.",
        tech: ["Node.js", "Server-side routing", "Locale handling"],
        evidence: "verified",
      },
      {
        id: "services",
        label: "Backend services",
        short: "SERVICES",
        detail:
          "Supporting services cover content storage, file handling, payment verification and administrative functionality. Provider callbacks are validated before a payment is treated as successful.",
        tech: ["REST APIs", "Zarinpal", "File handling", "Admin functions"],
        evidence: "verified",
      },
    ],
    technologies: [
      "JavaScript",
      "TypeScript",
      "HTML",
      "CSS",
      "Node.js",
      "Nginx",
      "Linux",
      "VPS",
      "DNS",
      "SSL/TLS",
      "Certbot",
      "HTTPS",
      "Zarinpal",
      "SEO",
      "Multilingual (fa/en/ar/ru)",
    ],
    challenges: [
      {
        title: "One platform, four languages",
        problem:
          "Four locales with different reading directions and different content volumes. Naively duplicating templates makes every future change four times more expensive.",
        response:
          "Shared layout and component structure with locale-aware routing and content lookups, plus explicit RTL handling for the Persian surface. Sitemaps and metadata generated per locale so search engines index each language distinctly.",
      },
      {
        title: "Large uploads through a proxy",
        problem:
          "File uploads failed before reaching the application because the proxy rejected the request body, and long-running requests hit default timeouts.",
        response:
          "Raised the proxy body limit and timeout configuration for the upload routes, verified the behaviour against real files, and kept the application-side validation in place as the authoritative check.",
      },
      {
        title: "Payment callbacks that must be trusted",
        problem:
          "A Zarinpal callback is a public HTTP request. Treating its arrival as proof of payment would be a correctness and security failure.",
        response:
          "Callback handling verifies the transaction with the provider before the order state changes, and the flow is written so a repeated callback does not double-apply a result.",
      },
      {
        title: "Certificate and DNS operations",
        problem:
          "TLS renewal and DNS changes are routine until they fail silently — an expired certificate takes the whole platform offline.",
        response:
          "Certbot-managed issuance and renewal on the proxy host, HTTPS enforced by redirect, and DNS changes applied with awareness of propagation and TTL before verifying the live result.",
      },
    ],
    outcomes: [
      "A live, publicly reachable corporate platform across four languages.",
      "Verified HTTPS with automated certificate renewal in place.",
      "A documented deployment shape — DNS → TLS → Nginx → Node.js — that can be reasoned about layer by layer during an incident.",
      "Payment and upload paths that handle their real-world failure modes rather than only the happy path.",
    ],
    caveats: [
      "The architecture diagrams in this facility are conceptual schematics drawn from the actual deployment shape. They are not screenshots of internal infrastructure.",
      "No performance, revenue or traffic metrics are claimed: this portfolio does not publish numbers that were not measured and released by the client.",
    ],
    facts: [
      { label: "Organisation", value: "Khuzestan Yeast Manufacturing Co." },
      { label: "Domain", value: "khuzestanyeast-co.com" },
      { label: "Locales", value: "fa / en / ar / ru" },
      { label: "Deployment", value: "Linux VPS · Nginx · Node.js · Certbot" },
      { label: "Integrations", value: "Zarinpal · file uploads · forms" },
    ],
    media: [
      {
        id: "m1-arch",
        kind: "conceptual",
        label: "Request architecture",
        disclaimer:
          "Conceptual schematic of the deployment shape. Not a screenshot of internal infrastructure.",
      },
      {
        id: "m1-live",
        kind: "external",
        label: "Live platform",
        disclaimer:
          "External link to the production site operated for the client. Opens in a new tab.",
      },
      {
        id: "m1-locales",
        kind: "conceptual",
        label: "Locale structure",
        disclaimer:
          "Illustrative URL map of the multilingual architecture. Paths are representative, not exhaustive.",
      },
    ],
    systemNodes: ["frontend", "api", "database", "payments", "files", "webhooks", "business"],
  },
  {
    id: "mission-002",
    missionNo: "002",
    code: "RN-CHAT",
    title: "React Native Chat Application",
    subtitle: "Cross-platform messaging application with media and state management",
    organisation: "Independent application development",
    url: undefined,
    classification: "APPLICATION — MOBILE CLIENT",
    sector: "application-lab",
    accent: "blue",
    status: "delivered",
    year: "Application development",
    summary:
      "A React Native messaging application: navigation between conversation and media screens, Redux-backed state, animated interaction feedback, and device integration for camera, video and voice.",
    briefing: [
      "A chat application is a state-management problem wearing a messaging interface. Conversations arrive asynchronously, optimistic sends have to be reconciled with server truth, unread counts must stay consistent across screens, and media uploads introduce their own lifecycle.",
      "This mission documents the React Native client work: navigation structure, shared state with Redux, camera/video/voice integration, and the message-level interactions that make a conversation feel responsive instead of merely connected.",
      "The interface you can inspect in the Application Lab is an illustrative reconstruction built for this facility. It is explicitly labelled as such — no original application screenshot or client data is presented here.",
    ],
    responsibilities: [
      "React Native application development in JavaScript and TypeScript",
      "Navigation architecture with React Navigation (stack and nested navigators)",
      "Application state management with Redux for conversations and message state",
      "Animated interface feedback and screen transitions",
      "Camera, video and voice capture integration",
      "Chat flows: message composition, media attachment, delivery feedback",
      "API integration layer between the mobile client and backend services",
    ],
    architecture: [
      {
        id: "ui",
        label: "UI layer",
        short: "VIEWS",
        detail:
          "Screens for conversation list, thread, media capture and profile. Components stay presentational; data arrives through connected hooks.",
        tech: ["React Native", "TypeScript", "StyleSheet"],
        evidence: "verified",
      },
      {
        id: "nav",
        label: "Navigation",
        short: "NAV",
        detail:
          "React Navigation drives the screen graph: a stack over tabbed sections, with route parameters for conversation identity and nested media screens.",
        tech: ["React Navigation", "Stack", "Tabs"],
        evidence: "verified",
      },
      {
        id: "state",
        label: "State",
        short: "STATE",
        detail:
          "Redux holds conversation, message and user state so multiple screens observe one source of truth; actions model send, receive and acknowledgement.",
        tech: ["Redux", "Actions", "Selectors"],
        evidence: "verified",
      },
      {
        id: "device",
        label: "Device capabilities",
        short: "DEVICE",
        detail:
          "Camera, video and voice capture exposed through application permissions and media lifecycle handling, including preview and cancellation.",
        tech: ["Camera", "Video", "Voice"],
        evidence: "verified",
      },
      {
        id: "api",
        label: "Service layer",
        short: "API",
        detail:
          "API calls are isolated from components; payload types describe the message and media contracts, and failures surface as recoverable UI states.",
        tech: ["REST APIs", "TypeScript types", "Async flows"],
        evidence: "verified",
      },
    ],
    technologies: [
      "React Native",
      "JavaScript",
      "TypeScript",
      "React Navigation",
      "Redux",
      "State management",
      "Animations",
      "Camera",
      "Video",
      "Voice",
      "REST APIs",
    ],
    challenges: [
      {
        title: "One conversation, many screens",
        problem:
          "Unread counts and last-message previews lived on the conversation list while the thread screen held the messages. Independent copies drifted immediately.",
        response:
          "Normalised conversation state in Redux with selectors deriving list presentation, so a received message updates one entity and every screen observes the same result.",
      },
      {
        title: "Optimistic sends",
        problem:
          "Waiting for a round trip before rendering a sent message makes a chat feel broken on slow networks.",
        response:
          "Messages render immediately in a pending state, then reconcile against the server response; failures are marked recoverable instead of silently disappearing.",
      },
      {
        title: "Media lifecycle on device",
        problem:
          "Camera and voice capture introduce permissions, temporary files and cancellation paths that are easy to leak or leave in an inconsistent state.",
        response:
          "Capture is wrapped in a small module that owns permission requests, temporary artefacts and cleanup, keeping the screens unaware of platform detail.",
      },
    ],
    outcomes: [
      "A working cross-platform messaging client with a coherent navigation and state architecture.",
      "Media capture integrated into the conversation flow rather than bolted on as a separate screen.",
      "Typed contracts between the client and backend services, which made later changes far less fragile.",
    ],
    caveats: [
      "The device interface shown in the Application Lab is an illustrative UI mockup authored for NEXUS. It is not a screenshot of the original application and contains no real conversation data.",
      "Third-party service names, deployment details and user numbers are intentionally omitted.",
    ],
    facts: [
      { label: "Platform", value: "React Native (cross-platform)" },
      { label: "Language", value: "JavaScript / TypeScript" },
      { label: "State", value: "Redux" },
      { label: "Navigation", value: "React Navigation" },
      { label: "Device", value: "Camera · Video · Voice" },
    ],
    media: [
      {
        id: "m2-device",
        kind: "illustrative",
        label: "Chat interface reconstruction",
        disclaimer:
          "Illustrative mockup built for NEXUS. Not an original application screenshot.",
      },
      {
        id: "m2-state",
        kind: "conceptual",
        label: "Client state flow",
        disclaimer:
          "Conceptual diagram of the state architecture. Simplified for legibility.",
      },
    ],
    systemNodes: ["frontend", "api", "auth", "database", "webhooks"],
  },
  {
    id: "mission-003",
    missionNo: "003",
    code: "OPS-DEPLOY",
    title: "Production Infrastructure & Deployment",
    subtitle: "From domain resolution to a running application server",
    organisation: "Consolidated infrastructure case study",
    url: undefined,
    classification: "INFRASTRUCTURE — OPERATIONS CASE STUDY",
    sector: "infrastructure",
    accent: "amber",
    status: "operational",
    year: "Ongoing operational work",
    summary:
      "A case study of the deployment path I operate: DNS and domains, TLS with automated renewal, Nginx as reverse proxy, Node.js runtime supervision, HTTPS enforcement, and the troubleshooting method used when a layer fails.",
    briefing: [
      "This mission is not a separate client project. It is the infrastructure practice behind the deployed applications in this archive — most directly the Khuzestan Yeast platform — documented as a reproducible engineering case study.",
      "The interesting property of this stack is that every layer can fail independently: DNS can resolve to the wrong host, a certificate can expire, a proxy can forward to a dead upstream, an application process can die while the proxy stays healthy. Debugging means establishing which layer is actually broken before changing anything.",
      "The Infrastructure sector is built around this path: five interactive stages, each with its real responsibility, its typical failure mode and the diagnostic that isolates it.",
    ],
    responsibilities: [
      "Provisioning and configuring Linux VPS environments",
      "Nginx configuration as reverse proxy and static host",
      "Node.js application deployment and process supervision",
      "DNS, domain and subdomain configuration",
      "SSL/TLS issuance and renewal through Certbot",
      "HTTPS enforcement and redirect strategy",
      "Production incident diagnosis across network, proxy and application layers",
      "Operational hardening: headers, body limits, timeouts, log review",
    ],
    architecture: [
      {
        id: "domain",
        label: "Domain & DNS",
        short: "DNS",
        detail:
          "The zone maps hostnames to the VPS. Records are changed deliberately, with TTL and propagation in mind, then verified with a resolver query rather than assumed.",
        tech: ["A records", "CNAME", "TXT", "Subdomains"],
        evidence: "verified",
      },
      {
        id: "https",
        label: "HTTPS / SSL",
        short: "TLS",
        detail:
          "Certbot obtains and renews certificates; the proxy terminates TLS and redirects HTTP. Renewal is verified rather than trusted, because expiry is a silent outage.",
        tech: ["Certbot", "Let's Encrypt", "HSTS considerations"],
        evidence: "verified",
      },
      {
        id: "proxy",
        label: "Nginx reverse proxy",
        short: "PROXY",
        detail:
          "One public entry point forwarding to internal application ports, adding headers, enforcing body limits and separating static assets from dynamic requests.",
        tech: ["Nginx", "proxy_pass", "Headers", "Timeouts"],
        evidence: "verified",
      },
      {
        id: "runtime",
        label: "Application server",
        short: "NODE",
        detail:
          "The Node.js process runs behind supervision so it restarts on failure and starts on boot. Logs are the first diagnostic, not the last resort.",
        tech: ["Node.js", "Process management", "Log review"],
        evidence: "verified",
      },
      {
        id: "services",
        label: "Backend services",
        short: "SERVICES",
        detail:
          "Data storage, file handling, callbacks and administrative functions. Health is checked from outside the host, through the same path a user takes.",
        tech: ["REST APIs", "Storage", "Callbacks"],
        evidence: "verified",
      },
    ],
    technologies: [
      "VPS",
      "Linux",
      "Nginx",
      "Node.js",
      "DNS",
      "SSL/TLS",
      "Certbot",
      "HTTPS",
      "Reverse proxy",
      "Bash",
      "Log analysis",
    ],
    challenges: [
      {
        title: "The proxy answered, the application did not",
        problem:
          "A 502 from the proxy looks like an application bug from the outside; the application itself had no error to show because the request never arrived.",
        response:
          "Diagnosis is layered: confirm the process is listening, confirm the proxy upstream matches that port, confirm the request reaches it in the access log, then read the application log. Fix the layer that is actually wrong.",
      },
      {
        title: "Silent certificate expiry",
        problem:
          "Renewal can fail quietly while the current certificate is still valid, and the outage arrives later with no obvious cause.",
        response:
          "Renewal is treated as a scheduled operation with verification after each cycle, and HTTPS is enforced by redirect so mixed-content and downgrade paths do not linger.",
      },
      {
        title: "Uploads rejected before the application",
        problem:
          "Default proxy body limits and timeouts silently reject large uploads, which looks like a frontend failure to the user.",
        response:
          "Route-specific proxy limits and timeouts, verified with real files of representative size, with the application retaining authoritative validation.",
      },
    ],
    outcomes: [
      "A repeatable deployment shape that can be rebuilt from a bare VPS.",
      "TLS renewal that is verified operationally, not assumed.",
      "A troubleshooting order of operations that shortens incident diagnosis.",
    ],
    caveats: [
      "No uptime percentage, incident count or benchmark is published — those measurements are not part of this portfolio's evidence.",
      "Server addresses, provider names, internal hostnames and credentials are intentionally not shown anywhere in this facility.",
    ],
    facts: [
      { label: "Host", value: "Linux VPS" },
      { label: "Entry point", value: "Nginx reverse proxy" },
      { label: "Runtime", value: "Node.js application server" },
      { label: "Transport", value: "HTTPS via Certbot-managed certificates" },
      { label: "Naming", value: "Subdomain-separated services" },
    ],
    media: [
      {
        id: "m3-pipeline",
        kind: "conceptual",
        label: "Request pipeline",
        disclaimer:
          "Conceptual deployment schematic. Interactive in the Infrastructure sector.",
      },
      {
        id: "m3-failure",
        kind: "conceptual",
        label: "Layer isolation model",
        disclaimer:
          "Illustrative diagnostic decision model, simplified from real troubleshooting practice.",
      },
    ],
    systemNodes: ["api", "webhooks", "database", "files"],
  },
  {
    id: "mission-004",
    missionNo: "004",
    code: "BIZ-AUTO",
    title: "Business Automation & Notification Systems",
    subtitle: "Administrative tooling, broadcast messaging and document pipelines",
    organisation: "Business software work",
    url: undefined,
    classification: "SYSTEMS — BUSINESS AUTOMATION",
    sector: "systems-core",
    accent: "white",
    status: "delivered",
    year: "Internal tooling",
    summary:
      "Administrative functionality and messaging automation for business operations: user management, group messaging, broadcast notifications with conditional delivery, PDF processing and document organisation.",
    briefing: [
      "Business software is defined by the operator's workflow, not the demo. This mission collects the administrative and messaging automation work: tools that staff actually use to manage users, reach groups of people, and produce or organise documents.",
      "The engineered part is conditional delivery — a notification that should not go to everyone, should not go twice, and should be traceable after it has been sent. Combined with PDF processing and file organisation, the result is a small operations platform rather than a set of scripts.",
      "Verified capabilities are listed separately from concepts that were explored but not delivered. Nothing in the 'concepts' column is claimed as shipped.",
    ],
    responsibilities: [
      "Administrative interface functionality for staff operations",
      "User management: creation, grouping and role-aware access",
      "Group messaging and broadcast notification flows",
      "Conditional message delivery rules (audience, state, suppression)",
      "PDF processing and document generation/handling",
      "Document organisation and retrieval structure",
      "Messaging provider integration and delivery reporting",
    ],
    architecture: [
      {
        id: "admin",
        label: "Admin console",
        short: "ADMIN",
        detail:
          "Operational screens for users, groups, messages and documents. Actions are explicit and reversible where the business rules allow it.",
        tech: ["React", "Forms", "Permissions"],
        evidence: "verified",
      },
      {
        id: "users",
        label: "User & group model",
        short: "USERS",
        detail:
          "Users belong to groups; broadcast audience is derived from those memberships so the operator chooses a business concept, not a list of identifiers.",
        tech: ["User management", "Grouping", "Role-aware UI"],
        evidence: "verified",
      },
      {
        id: "delivery",
        label: "Delivery engine",
        short: "SEND",
        detail:
          "Conditional delivery decides whether a message should be sent to a given recipient, then records the result so duplicates and omissions are visible.",
        tech: ["Conditional logic", "Suppression", "Idempotency"],
        evidence: "verified",
      },
      {
        id: "docs",
        label: "Document pipeline",
        short: "DOCS",
        detail:
          "PDF processing and organised storage: generated documents keep a stable identity and a predictable location so staff can find what was issued.",
        tech: ["PDF processing", "File handling", "Organisation"],
        evidence: "verified",
      },
      {
        id: "providers",
        label: "Messaging integrations",
        short: "PROVIDERS",
        detail:
          "Provider integration is isolated behind an adapter so delivery channels can change without rewriting business rules.",
        tech: ["Messaging APIs", "Callbacks", "Adapters"],
        evidence: "verified",
      },
    ],
    technologies: [
      "JavaScript",
      "TypeScript",
      "React",
      "REST APIs",
      "PDF processing",
      "File handling",
      "Messaging integrations",
      "Conditional logic",
      "Administrative UI",
    ],
    challenges: [
      {
        title: "Broadcast without spamming",
        problem:
          "A single send to a group is easy; a rule that suppresses duplicates and respects membership at send time is not.",
        response:
          "Delivery rules resolve the audience, evaluate conditions and record an outcome per recipient, so the same recipient is never silently messaged twice.",
      },
      {
        title: "Documents that stay findable",
        problem:
          "Generated PDFs with ad-hoc naming become unsearchable within weeks.",
        response:
          "A predictable naming and folder structure tied to the business entity, with metadata stored so the document can be located from the record rather than the filesystem.",
      },
      {
        title: "Operational clarity for staff",
        problem:
          "Administrative tools fail when their state is ambiguous — operators repeat actions because the screen does not say what happened.",
        response:
          "Explicit status feedback and confirmation states on destructive actions, with the resulting state readable on refresh rather than held only in the browser.",
      },
    ],
    outcomes: [
      "Administrative tooling that supports real operational workflows.",
      "Notification delivery that accounts for audience and suppression instead of blind broadcasting.",
      "A document pipeline that keeps generated PDFs traceable to their records.",
    ],
    caveats: [
      "Concepts explored but not presented as delivered: multi-channel campaign orchestration, scheduled recurring campaigns with analytics, and inbound message automation. These are future capability notes, not claims.",
      "Client identities, recipient volumes and message content are not represented in this facility.",
    ],
    facts: [
      { label: "Domain", value: "Business operations tooling" },
      { label: "Core", value: "Admin · users · groups · broadcast" },
      { label: "Delivery", value: "Conditional, deduplicated" },
      { label: "Documents", value: "PDF processing & organisation" },
      { label: "Status", value: "Delivered functionality" },
    ],
    media: [
      {
        id: "m4-flow",
        kind: "conceptual",
        label: "Conditional delivery flow",
        disclaimer:
          "Conceptual diagram of the delivery decision path. Simplified for legibility.",
      },
      {
        id: "m4-docs",
        kind: "conceptual",
        label: "Document pipeline",
        disclaimer:
          "Illustrative pipeline schematic. Business-specific logic is not reproduced.",
      },
    ],
    systemNodes: ["frontend", "backend", "business", "database", "files", "webhooks"],
  },
];

export const getProject = (id: string) => projects.find((p) => p.id === id);

/** mission id → public route slug */
export const slugById: Record<string, string> = {
  "mission-001": "khuzestan-yeast",
  "mission-002": "react-native-chat",
  "mission-003": "infrastructure",
  "mission-004": "business-automation",
};

export const projectBySlug: Record<string, string> = {
  "khuzestan-yeast": "mission-001",
  "react-native-chat": "mission-002",
  infrastructure: "mission-003",
  "business-automation": "mission-004",
};

export const missionForSlug = (slug: string) => getProject(projectBySlug[slug] ?? "");
