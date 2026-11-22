/**
 * NEXUS — Professional identity
 * ---------------------------------------------------------------------------
 * Single source of truth for who this portfolio belongs to.
 *
 * ACCURACY POLICY
 * Every statement below is limited to the owner's supplied professional
 * background. No degrees, certifications, employers, dates, testimonials,
 * metrics or "shipped" claims are invented. Items that need verification are
 * marked `verified: false` and rendered with a "AWAITING CONFIGURATION" badge.
 *
 * Identifiers, tags and panel labels may be replaced here without touching the
 * 3D world: the facility reads this data through `src/content/index.ts`.
 */

export type Confidence = "professional" | "working" | "familiar" | "learning";

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  professional: "Applied in professional work",
  working: "Hands-on in real projects",
  familiar: "Technically familiar",
  learning: "Active learning objective",
};

export type ContactChannel = {
  id: "email" | "github" | "linkedin" | "location";
  label: string;
  /** Placeholder values are intentionally obvious until the owner verifies them. */
  value: string;
  href?: string;
  verified: boolean;
  note: string;
};

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@awaiting-configuration";
const GITHUB = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/awaiting-configuration";
const LINKEDIN =
  process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://linkedin.com/in/awaiting-configuration";

export const profile = {
  name: "Mohammad Ali Ashnavar",
  shortName: "M. A. Ashnavar",
  initials: "MAA",
  title: "Software Engineer",
  specialisation: "Application Development / Systems / Infrastructure",
  positioning:
    "Software Engineer | Application Development | Systems Integration | IT Infrastructure",
  tagline: "I build software that survives contact with production.",
  philosophy: "Technology is valuable when it solves real problems reliably.",
  summary:
    "Software engineer focused on application development, systems integration and the infrastructure that keeps applications reachable. Around two years of frontend development experience, plus practical React Native application development: interfaces, state management, device capabilities and the API layers behind them.",
  introBullets: [
    "≈ 2 years of frontend development experience",
    "Practical React Native application development",
    "Production hosting on Linux VPS: Nginx, TLS, DNS, Node.js",
    "Integration work: APIs, webhooks, payments, file handling",
  ],
  biography: [
    "I work where the interface meets the system. My day-to-day is JavaScript and TypeScript — React on the web, React Native on mobile — but the interesting part of the job has always been what sits behind the screen: state that has to stay coherent, APIs that have to fail gracefully, uploads that have to survive a slow connection, callbacks that have to be verified.",
    "That curiosity pushed me from frontend work into integration and infrastructure. If an application has to be reachable, someone has to own DNS, certificates, reverse proxying and the runtime that actually executes it. I took that ownership: Linux VPS environments, Nginx as a reverse proxy, Node.js deployments, Certbot-managed TLS, production troubleshooting when something breaks at the wrong hour.",
    "Most of my project work sits in the business-software space — corporate platforms, internal administrative tooling, messaging and notification flows, document handling. That context is unforgiving in a useful way: the people using the system are not evaluating the animation easing, they are trying to finish work. Reliability beats novelty every time.",
    "Outside of client work I experiment with PC hardware — CPU and GPU architecture, BIOS configuration, memory timings, thermal behaviour, benchmarking. It is a technical interest rather than a professional qualification, but it taught me the same lesson the servers did: understand the mechanism, measure before you optimise, and never trust a number you did not observe yourself.",
    "I use AI-assisted development as part of my workflow. The architecture, the implementation decisions, the debugging and the validation remain mine — a generated snippet that I cannot explain is a liability, not a shortcut.",
  ],
  philosophyPoints: [
    {
      title: "Systems over screens",
      body: "A feature is not done when it renders. It is done when the data flow, failure modes and deployment path around it are understood.",
    },
    {
      title: "Mechanism before abstraction",
      body: "I want to know what the framework is doing — what the request actually looks like on the wire, what the proxy actually forwards, what the database actually receives.",
    },
    {
      title: "Reliability is a feature",
      body: "Retries, validation, certificate renewal, clear error surfaces. The boring parts are what users experience when something goes wrong.",
    },
    {
      title: "Optimise with evidence",
      body: "Measure first. From bundle weight to memory timings, a change without a measurement is a guess.",
    },
    {
      title: "Integration is engineering",
      body: "Most real systems are seams: payment callbacks, webhooks, file pipelines. The seam is where correctness is won or lost.",
    },
    {
      title: "AI with judgement",
      body: "AI-assisted development accelerates the mechanical work. Architecture decisions, verification and accountability stay human.",
    },
  ],
  timeline: [
    {
      id: "tl-01",
      era: "Foundation",
      marker: "Entry point",
      title: "Web fundamentals and interface craft",
      body: "HTML, CSS and JavaScript, then WordPress and responsive site architecture. Building multilingual structures and custom frontend implementations taught me how much of professional frontend work is structural, not decorative.",
      tags: ["HTML", "CSS", "JavaScript", "WordPress", "Responsive UI", "SEO fundamentals"],
      verified: true,
    },
    {
      id: "tl-02",
      era: "≈ 2 years",
      marker: "Approximate duration",
      title: "Frontend development in production",
      body: "Around two years of frontend development: component architecture, state management, animation, API integration and interface implementation against real business requirements.",
      tags: ["React", "TypeScript", "State management", "API integration", "UI/UX implementation"],
      verified: true,
    },
    {
      id: "tl-03",
      era: "Application",
      marker: "Practical experience",
      title: "React Native application development",
      body: "Practical mobile application development with React Native: navigation, Redux-based state, device camera, video and voice capabilities, chat flows and the JavaScript/TypeScript layer that connects them.",
      tags: ["React Native", "React Navigation", "Redux", "Camera", "Video", "Voice", "Chat"],
      verified: true,
    },
    {
      id: "tl-04",
      era: "Integration",
      marker: "Project work",
      title: "Systems integration and business logic",
      body: "Connecting frontends to backend services: REST APIs, webhook receivers and callbacks, payment integration, file upload and processing pipelines, administrative functionality, notification delivery.",
      tags: ["API integration", "Webhooks", "Payments", "File handling", "Business logic"],
      verified: true,
    },
    {
      id: "tl-05",
      era: "Infrastructure",
      marker: "Operational ownership",
      title: "Production infrastructure and deployment",
      body: "Owning the path from domain to application: Linux VPS configuration, Nginx reverse proxying, Node.js runtime deployment, DNS records, SSL/TLS with Certbot, HTTPS enforcement and production troubleshooting.",
      tags: ["Linux", "Nginx", "Node.js", "DNS", "SSL/TLS", "Certbot", "VPS"],
      verified: true,
    },
    {
      id: "tl-06",
      era: "Now",
      marker: "Current focus",
      title: "Depth in systems, deliberate about scale",
      body: "Continuing to deepen backend integration and infrastructure depth, with a growing interest in automation, observability and application performance work. Hardware experimentation stays the practical laboratory for performance thinking.",
      tags: ["Automation", "Observability", "Performance", "Systems design"],
      verified: true,
    },
  ],
  interests: [
    {
      id: "hw",
      title: "PC hardware & architecture",
      body: "CPU and GPU architecture, platform topology, BIOS configuration, memory tuning, thermal management and benchmarking. A technical interest and experimentation area — not presented as a professional qualification.",
      confidence: "familiar" as Confidence,
    },
    {
      id: "perf",
      title: "Performance engineering",
      body: "Profiling rendering and runtime cost, reducing work per frame, understanding where latency actually comes from. The same discipline applies to web bundles and to thermal headroom.",
      confidence: "working" as Confidence,
    },
    {
      id: "infra",
      title: "Operating system optimisation",
      body: "Linux server configuration and tuning, service supervision, operating system level optimisation and troubleshooting in production environments.",
      confidence: "working" as Confidence,
    },
    {
      id: "lang",
      title: "Multilingual systems",
      body: "URL and content architecture for multilingual sites — including right-to-left Persian alongside English, Arabic and Russian structures, with SEO and sitemap configuration.",
      confidence: "working" as Confidence,
    },
  ],
  learning: [
    {
      id: "learn-1",
      title: "Deeper backend architecture",
      body: "Moving further into service boundaries, data modelling and failure handling beyond integration work.",
      horizon: "Ongoing",
    },
    {
      id: "learn-2",
      title: "Automation & observability",
      body: "Deployment automation, structured logging and monitoring so production behaviour is observable rather than guessed.",
      horizon: "Near term",
    },
    {
      id: "learn-3",
      title: "Real-time application patterns",
      body: "Beyond polling and webhooks: presence, delivery guarantees and message ordering in conversational systems.",
      horizon: "Near term",
    },
    {
      id: "learn-4",
      title: "Graphics & interactive systems",
      body: "WebGL/Three.js rendering, shader fundamentals and the performance trade-offs of real-time 3D — the discipline behind this facility.",
      horizon: "Active exploration",
    },
  ],
  contact: {
    status: "awaiting_configuration" as const,
    channels: [
      {
        id: "email",
        label: "Email",
        value: EMAIL,
        href: EMAIL.includes("@") ? `mailto:${EMAIL}` : undefined,
        verified: false,
        note: "Placeholder until the owner sets NEXT_PUBLIC_CONTACT_EMAIL.",
      },
      {
        id: "github",
        label: "GitHub",
        value: GITHUB,
        href: GITHUB,
        verified: false,
        note: "Placeholder until NEXT_PUBLIC_GITHUB_URL is configured.",
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        value: LINKEDIN,
        href: LINKEDIN,
        verified: false,
        note: "Placeholder until NEXT_PUBLIC_LINKEDIN_URL is configured.",
      },
      {
        id: "location",
        label: "Working remotely",
        value: "Remote / hybrid — timezone flexible",
        verified: false,
        note: "Location details intentionally omitted until confirmed by the owner.",
      },
    ] satisfies ContactChannel[],
    form: {
      heading: "Direct transmission",
      note: "Messages are validated server-side. Delivery becomes active once the deployment provides RESEND_API_KEY and CONTACT_TO_EMAIL — until then the form reports that transport is not yet configured.",
    },
  },
  availability: {
    status: "Open to conversations",
    note: "Software engineering roles and projects in application development, systems integration and infrastructure.",
  },
} as const;

export type Profile = typeof profile;
