/** Infrastructure sector — deployment pipeline and operations terminals. */

export type PipelineStage = {
  id: string;
  index: number;
  label: string;
  code: string;
  role: string;
  detail: string;
  responsibilities: string[];
  failure: string;
  diagnosis: string;
  technologies: string[];
  evidence: "verified" | "conceptual";
};

export const pipelineStages: PipelineStage[] = [
  {
    id: "stage-dns",
    index: 1,
    label: "Domain & DNS",
    code: "L1 / RESOLVE",
    role: "Turns a hostname into an address",
    detail:
      "The zone holds the records that answer resolver queries. Changes are deliberate: the record type is chosen for the job (A for an address, CNAME for an alias, TXT for verification and policy) and TTL is considered before anything is changed.",
    responsibilities: [
      "A / AAAA records pointing at the host",
      "Subdomain records separating services",
      "TXT records for verification and mail policy",
      "TTL planning for safe cut-overs",
    ],
    failure: "Resolution points at a decommissioned address, or a subdomain was never created.",
    diagnosis:
      "Query a public resolver and the authoritative nameserver directly, then compare. If they disagree, suspect TTL and propagation before changing configuration.",
    technologies: ["DNS", "A records", "CNAME", "TXT", "TTL"],
    evidence: "verified",
  },
  {
    id: "stage-tls",
    index: 2,
    label: "HTTPS / SSL",
    code: "L2 / TRANSPORT",
    role: "Encrypts and authenticates the connection",
    detail:
      "Certbot obtains a certificate, the proxy terminates TLS, and HTTP is redirected. The certificate has a lifecycle: issuance, renewal, verification. Expiry is an outage that gives no warning until it does.",
    responsibilities: [
      "Certificate issuance through Certbot",
      "Automated renewal plus verification",
      "TLS termination at the edge",
      "HTTP → HTTPS redirect enforcement",
    ],
    failure: "Renewal failure discovered only when the certificate expires.",
    diagnosis:
      "Inspect the served certificate chain and expiry from outside the host; check the renewal timer and its logs on the host.",
    technologies: ["SSL/TLS", "Certbot", "Let's Encrypt", "HSTS considerations"],
    evidence: "verified",
  },
  {
    id: "stage-proxy",
    index: 3,
    label: "Nginx reverse proxy",
    code: "L3 / ROUTE",
    role: "The single public entry point",
    detail:
      "One process owns ports 80/443 and forwards requests to the correct internal upstream. It also carries the policies that never belong in application code: body limits, timeouts, forwarded headers, cache and compression.",
    responsibilities: [
      "server blocks per hostname",
      "proxy_pass to the application upstream",
      "client_max_body_size for uploads",
      "Forwarded headers and proxy timeouts",
      "Static asset handling and compression",
    ],
    failure: "502 / 504 while the application itself looks healthy, because the upstream drifted.",
    diagnosis:
      "Read the access and error logs: was the request received, and which upstream was contacted? Compare the configured upstream port with the port actually listening.",
    technologies: ["Nginx", "proxy_pass", "client_max_body_size", "Headers"],
    evidence: "verified",
  },
  {
    id: "stage-runtime",
    index: 4,
    label: "Application server",
    code: "L4 / EXECUTE",
    role: "Runs the application",
    detail:
      "The Node.js process binds to a local port and serves requests forwarded by the proxy. It runs under supervision so it restarts on crash and survives a reboot, with logs that are actually read.",
    responsibilities: [
      "Node.js production runtime",
      "Process supervision and restart policy",
      "Environment configuration outside the codebase",
      "Structured log review",
    ],
    failure: "The process died while the proxy stayed up, so users got 502 with no application error.",
    diagnosis:
      "Confirm the process is running and listening, then read the application log for the first error rather than the last.",
    technologies: ["Node.js", "Process supervision", "Logs"],
    evidence: "verified",
  },
  {
    id: "stage-services",
    index: 5,
    label: "Backend services",
    code: "L5 / SERVE",
    role: "Performs the actual work",
    detail:
      "Data storage, file handling, provider callbacks and administrative functions. Health is verified from outside, through the same path a visitor takes — not only from a shell on the host.",
    responsibilities: [
      "Data persistence and integrity",
      "File handling and processing",
      "Provider callbacks (payments, messaging)",
      "Administrative operations",
    ],
    failure: "A dependency is down while every infrastructure layer reports healthy.",
    diagnosis:
      "Trace one real request end to end and find where the observable result diverges from expectation.",
    technologies: ["REST", "Storage", "Callbacks", "Business logic"],
    evidence: "verified",
  },
];

export type InfraTerminal = {
  id: string;
  label: string;
  code: string;
  summary: string;
  points: string[];
  confidence: "professional" | "working" | "familiar";
};

export const infraTerminals: InfraTerminal[] = [
  {
    id: "inf-vps",
    label: "VPS Environments",
    code: "OPS-01",
    summary:
      "Linux virtual servers provisioned for production applications, configured as a deploy target rather than a workstation.",
    points: [
      "Base configuration: users, SSH access, package baseline",
      "Service supervision and boot behaviour",
      "Firewall surface limited to what must be public",
      "Disk and log growth as a routine operational concern",
    ],
    confidence: "professional",
  },
  {
    id: "inf-linux",
    label: "Linux Configuration",
    code: "OPS-02",
    summary:
      "Operating the host: services, permissions, logs and the day-to-day discipline that keeps a server predictable.",
    points: [
      "systemd service management and journald logs",
      "File ownership and permission boundaries for web content",
      "Log locations by layer: proxy, runtime, system",
      "Non-root operation for application processes",
    ],
    confidence: "professional",
  },
  {
    id: "inf-nginx",
    label: "Nginx",
    code: "OPS-03",
    summary:
      "Reverse proxy configuration: hostname routing, TLS termination, body limits and headers.",
    points: [
      "Server blocks for multiple hostnames on one host",
      "proxy_pass upstream mapping",
      "client_max_body_size and proxy timeouts for uploads",
      "Security headers and compression",
    ],
    confidence: "professional",
  },
  {
    id: "inf-tls",
    label: "SSL / Certbot",
    code: "OPS-04",
    summary:
      "Certificate lifecycle: issuance, automated renewal, verification, and HTTPS enforcement.",
    points: [
      "Certbot issuance with the webroot or standalone challenge",
      "Renewal timers and post-renewal reload",
      "Redirect strategy for plain HTTP",
      "Verification from outside the host, not assumption",
    ],
    confidence: "professional",
  },
  {
    id: "inf-deploy",
    label: "Node.js Deployment",
    code: "OPS-05",
    summary:
      "Running a Node application in production behind a proxy, with configuration kept out of the source tree.",
    points: [
      "Local bind behind the proxy rather than direct exposure",
      "Environment variables for deploy-specific values",
      "Restart procedure with a verification step",
      "Dependency and build steps documented, not remembered",
    ],
    confidence: "professional",
  },
  {
    id: "inf-trouble",
    label: "Production Troubleshooting",
    code: "OPS-06",
    summary:
      "A layer-isolation method: establish which component is actually failing before changing anything.",
    points: [
      "Reproduce through the same path a user takes",
      "Proxy logs first: was the request received, where was it sent",
      "Runtime logs second: did it arrive, did it throw",
      "One change at a time, then verify",
    ],
    confidence: "professional",
  },
];

export const deploymentFacts = [
  { label: "Edge", value: "Nginx · TLS · HTTP→HTTPS" },
  { label: "Runtime", value: "Node.js under supervision" },
  { label: "Transport", value: "Certbot-managed certificates" },
  { label: "Naming", value: "Subdomain-separated services" },
];
