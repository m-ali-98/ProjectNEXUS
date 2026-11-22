/** Network Operations — DNS, transport and mail. All values are conceptual. */

export type DnsRecordType = {
  id: string;
  type: string;
  code: string;
  role: string;
  explanation: string;
  example: string;
  notes: string[];
};

export const dnsRecordTypes: DnsRecordType[] = [
  {
    id: "a",
    type: "A",
    code: "REC-01",
    role: "Hostname → IPv4 address",
    explanation:
      "The record that actually answers the question most clients ask. A hostname with an A record resolves to a specific IPv4 address — the public entry point of the host.",
    example: "www.example-domain.test.    A    203.0.113.10",
    notes: [
      "Addresses in this facility are reserved documentation ranges, never live infrastructure.",
      "Changing an A record is a traffic cut-over: plan TTL before the change, not after.",
    ],
  },
  {
    id: "cname",
    type: "CNAME",
    code: "REC-02",
    role: "Alias → another hostname",
    explanation:
      "An alias that points at another name, which is then resolved. Useful when the address behind a service is allowed to change without editing every hostname.",
    example: "cdn.example-domain.test.  CNAME  edge.example-domain.test.",
    notes: [
      "A CNAME cannot coexist with other record types at the same name.",
      "Apex domains are commonly flattened rather than given a raw CNAME.",
    ],
  },
  {
    id: "mx",
    type: "MX",
    code: "REC-03",
    role: "Inbound mail routing",
    explanation:
      "Tells the world which mail servers accept mail for a domain, with a preference value that orders them. Without MX records, mail has nowhere to go.",
    example: "example-domain.test.     MX    10 mail.example-domain.test.",
    notes: [
      "Lower preference value = higher priority.",
      "Received mail authentication depends on SPF/DKIM/DMARC, not on MX alone.",
    ],
  },
  {
    id: "txt",
    type: "TXT",
    code: "REC-04",
    role: "Verification and policy",
    explanation:
      "Free-form text attached to a name. In practice it holds domain ownership verification, SPF policy, DKIM public keys and DMARC instructions.",
    example: 'example-domain.test.  TXT  "v=spf1 include:_spf.provider.test -all"',
    notes: [
      "One TXT record per policy is cleaner than several competing strings.",
      "Duplicate SPF records are a common and confusing misconfiguration.",
    ],
  },
  {
    id: "aaaa",
    type: "AAAA",
    code: "REC-05",
    role: "Hostname → IPv6 address",
    explanation:
      "The IPv6 counterpart to an A record, used when the host has a routable IPv6 address. Modern clients will prefer it when both families are present.",
    example: "www.example-domain.test. AAAA 2001:db8::10",
    notes: [
      "If IPv6 is advertised it must actually be reachable — otherwise it becomes a latency problem.",
    ],
  },
  {
    id: "srv-txt",
    type: "TXT / DKIM",
    code: "REC-06",
    role: "Cryptographic mail signature",
    explanation:
      "A DKIM public key published at a selector-based name lets receivers verify that a message was authorised by the domain and was not altered in transit.",
    example: "selector1._domainkey.example-domain.test. TXT \"v=DKIM1; k=rsa; p=...\"",
    notes: [
      "The private key stays with the sending service; only the public key is published.",
      "Rotating a selector allows a safe overlap during migration.",
    ],
  },
];

export type ResolutionStep = {
  index: number;
  title: string;
  detail: string;
  layer: string;
};

/** Conceptual resolution walkthrough — no live queries are performed. */
export const resolutionSteps: ResolutionStep[] = [
  {
    index: 1,
    title: "Client asks a resolver",
    layer: "STUB",
    detail:
      "The application needs an address and queries its configured recursive resolver. The resolver may answer from cache if a record is still within its TTL.",
  },
  {
    index: 2,
    title: "Resolver consults the root",
    layer: "ROOT",
    detail:
      "On a cache miss the resolver walks the hierarchy: the root servers identify the nameservers authoritative for the top-level domain.",
  },
  {
    index: 3,
    title: "TLD refers to the zone",
    layer: "TLD",
    detail:
      "The TLD servers return the delegation — which nameservers are authoritative for the specific domain.",
  },
  {
    index: 4,
    title: "Authoritative answer",
    layer: "AUTH",
    detail:
      "The authoritative nameserver answers with the record itself and a TTL. This is the answer the zone owner actually controls.",
  },
  {
    index: 5,
    title: "Cache and connect",
    layer: "CLIENT",
    detail:
      "The result is cached for its TTL, then the client opens a TCP connection and negotiates TLS with the host that was returned.",
  },
];

export type MailAuth = {
  id: string;
  label: string;
  code: string;
  purpose: string;
  detail: string;
  failure: string;
};

export const mailAuth: MailAuth[] = [
  {
    id: "spf",
    label: "SPF",
    code: "MAIL-01",
    purpose: "Declares which hosts may send mail for the domain.",
    detail:
      "A TXT record listing authorised sending infrastructure. It is evaluated on the envelope sender, and it is a policy declaration — not encryption.",
    failure: "Too many DNS lookups, or a permissive +all that authorises everyone.",
  },
  {
    id: "dkim",
    label: "DKIM",
    code: "MAIL-02",
    purpose: "Cryptographically signs outgoing messages.",
    detail:
      "The sending service signs selected headers and the body; the public key is published in DNS so receivers can verify integrity and domain authorisation.",
    failure: "Signature broken by a forwarding step that rewrites headers.",
  },
  {
    id: "dmarc",
    label: "DMARC",
    code: "MAIL-03",
    purpose: "Tells receivers what to do when alignment fails.",
    detail:
      "A policy record that combines SPF/DKIM alignment with an instruction (none, quarantine, reject) and a reporting address for aggregate reports.",
    failure: "Publishing p=reject before confirming every legitimate sender is aligned.",
  },
  {
    id: "mx",
    label: "MX / SMTP",
    code: "MAIL-04",
    purpose: "Routes and transports inbound mail.",
    detail:
      "MX records point at mail exchangers; SMTP is the delivery protocol between servers. Outbound submission usually uses a separate authenticated endpoint and port.",
    failure: "Port 25 blocked by the provider, or an MX target that no longer exists.",
  },
];

export type TransportStep = {
  index: number;
  label: string;
  detail: string;
};

export const tlsSteps: TransportStep[] = [
  {
    index: 1,
    label: "TCP connect",
    detail:
      "A connection is opened to port 443 on the address returned by DNS. Before any encryption, the route must work.",
  },
  {
    index: 2,
    label: "ClientHello",
    detail:
      "The client offers protocol versions, cipher suites and the SNI hostname. SNI is what allows one address to serve many certificates.",
  },
  {
    index: 3,
    label: "Certificate",
    detail:
      "The server presents its certificate chain. The client validates the chain against trusted roots, checks the hostname and checks validity dates.",
  },
  {
    index: 4,
    label: "Key exchange",
    detail:
      "Both sides derive a shared session key. In modern TLS this is ephemeral, so past traffic is not decryptable by a later key compromise.",
  },
  {
    index: 5,
    label: "HTTP request",
    detail:
      "Only now does the actual request travel — through the proxy, to the application upstream, and back.",
  },
];

export type ProxyRoute = {
  id: string;
  host: string;
  upstream: string;
  note: string;
};

/** Illustrative hostnames only. No real infrastructure is exposed. */
export const proxyRoutes: ProxyRoute[] = [
  {
    id: "route-apex",
    host: "example-domain.test",
    upstream: "127.0.0.1:3000",
    note: "Public application. HTTP is redirected to HTTPS at the edge; body limits raised for upload routes.",
  },
  {
    id: "route-www",
    host: "www.example-domain.test",
    upstream: "127.0.0.1:3000",
    note: "Canonical-host redirect to the apex domain so only one URL shape is indexed.",
  },
  {
    id: "route-api",
    host: "api.example-domain.test",
    upstream: "127.0.0.1:4000",
    note: "Separate service, separate upstream. Callback endpoints are reachable without exposing the whole application.",
  },
  {
    id: "route-assets",
    host: "static.example-domain.test",
    upstream: "document root",
    note: "Served directly by the proxy with long-lived cache headers instead of travelling through the application.",
  },
];

export const networkDisclaimers = [
  "Every hostname, address and record value in this sector uses reserved documentation ranges or .test names. No live infrastructure is exposed.",
  "The resolution walkthrough is a conceptual model of the DNS hierarchy, executed locally without network queries.",
];
