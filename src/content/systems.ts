/**
 * Systems Core — application architecture model.
 * The visualisation is built from these nodes; the camera travel and panels are
 * driven by the same ids, so content can change without touching the world.
 */

export type SystemNode = {
  id: string;
  label: string;
  code: string;
  layer: "client" | "edge" | "service" | "data" | "external";
  purpose: string;
  detail: string;
  failure: string;
  technologies: string[];
  relatedProjects: string[];
  connections: string[];
};

export const systemNodes: SystemNode[] = [
  {
    id: "frontend",
    label: "Frontend",
    code: "CL-01",
    layer: "client",
    purpose: "The interface the user actually operates.",
    detail:
      "React components, navigation and state. The frontend owns presentation and interaction, not truth: it renders server state, derives views, and treats every network result as something that may fail.",
    failure: "Silent optimism — rendering success before the server confirmed it.",
    technologies: ["React", "React Native", "TypeScript", "Redux"],
    relatedProjects: ["mission-001", "mission-002", "mission-004"],
    connections: ["api", "auth"],
  },
  {
    id: "api",
    label: "API layer",
    code: "SV-02",
    layer: "edge",
    purpose: "The contract between client and services.",
    detail:
      "REST endpoints that validate input, translate between transport shapes and domain shapes, and return predictable error structures. A stable API contract is what allows the frontend and backend to evolve independently.",
    failure: "Unvalidated input, inconsistent errors, and payload shapes that drift silently.",
    technologies: ["REST", "HTTP semantics", "Validation", "JSON"],
    relatedProjects: ["mission-001", "mission-002", "mission-003"],
    connections: ["frontend", "backend", "auth", "files", "webhooks", "payments"],
  },
  {
    id: "auth",
    label: "Authentication",
    code: "SV-03",
    layer: "service",
    purpose: "Establishes who is making a request.",
    detail:
      "Session or token issuance, protected routes and role-aware access. Authentication answers identity; authorisation answers what that identity may do — the two are enforced separately.",
    failure: "Trusting client-side checks, or accepting a session that was never verified.",
    technologies: ["Sessions", "Tokens", "Roles", "Protected routes"],
    relatedProjects: ["mission-002", "mission-004"],
    connections: ["api", "backend", "business"],
  },
  {
    id: "backend",
    label: "Backend services",
    code: "SV-04",
    layer: "service",
    purpose: "Where business operations are executed.",
    detail:
      "Application services receive validated requests, apply domain rules and coordinate persistence and side effects. Business rules live here — not in the interface, and not in the database.",
    failure: "Business logic leaking into controllers or into the database layer.",
    technologies: ["Node.js", "Service layer", "Domain rules"],
    relatedProjects: ["mission-001", "mission-004"],
    connections: ["api", "database", "business", "files"],
  },
  {
    id: "database",
    label: "Database",
    code: "DT-05",
    layer: "data",
    purpose: "Durable system of record.",
    detail:
      "Stores entities and their relationships with constraints that hold under concurrency. The schema is the contract every other layer is ultimately measured against.",
    failure: "Unmodelled relationships, missing constraints, and queries that assume small tables.",
    technologies: ["Relational modelling", "Constraints", "Indexes"],
    relatedProjects: ["mission-001", "mission-004"],
    connections: ["backend", "business"],
  },
  {
    id: "business",
    label: "Business logic",
    code: "SV-06",
    layer: "service",
    purpose: "Encodes how the organisation actually operates.",
    detail:
      "Audience resolution, conditional delivery, document rules, administrative workflows. This is the layer that makes software specific to a business rather than generic.",
    failure: "Rules scattered across UI, API and database with no single owner.",
    technologies: ["Workflow rules", "Audience logic", "Admin functions"],
    relatedProjects: ["mission-004"],
    connections: ["backend", "database", "webhooks"],
  },
  {
    id: "webhooks",
    label: "Webhooks & callbacks",
    code: "EX-07",
    layer: "external",
    purpose: "Asynchronous messages from external providers.",
    detail:
      "Providers call us — payment results, delivery receipts, messaging events. Because the caller is external and the endpoint is public, every callback is verified and made idempotent before it changes state.",
    failure: "Trusting the arrival of a request as proof that the event is genuine.",
    technologies: ["Webhooks", "Signature/verification", "Idempotency", "Retries"],
    relatedProjects: ["mission-001", "mission-003", "mission-004"],
    connections: ["payments", "backend", "business"],
  },
  {
    id: "payments",
    label: "Payments",
    code: "EX-08",
    layer: "external",
    purpose: "Money movement with verifiable state.",
    detail:
      "A payment is initiated, then confirmed by verification against the provider — never by the redirect alone. The flow is designed so a repeated callback cannot double-apply its effect.",
    failure: "Treating the browser redirect as the source of truth.",
    technologies: ["Zarinpal", "Callback verification", "Order state"],
    relatedProjects: ["mission-001"],
    connections: ["webhooks", "backend", "api"],
  },
  {
    id: "files",
    label: "File processing",
    code: "SV-09",
    layer: "service",
    purpose: "Uploads, documents and their lifecycle.",
    detail:
      "Upload size limits enforced at the proxy and validated in the application, temporary artefacts cleaned up, PDFs processed and stored with an identity that can be traced back to a record.",
    failure: "Untracked temporary files, and proxy limits that reject uploads before the app sees them.",
    technologies: ["Multipart uploads", "Proxy body limits", "PDF processing"],
    relatedProjects: ["mission-001", "mission-004"],
    connections: ["api", "backend"],
  },
];

export const getSystemNode = (id: string) => systemNodes.find((n) => n.id === id);

/** Ordered ring used by the Systems Core visualisation. */
export const systemNodeOrder = systemNodes.map((n) => n.id);
