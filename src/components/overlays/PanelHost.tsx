"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useNexusStore, type PanelState } from "@/stores/nexusStore";
import { projects, getProject } from "@/content/projects";
import { getSystemNode, systemNodes } from "@/content/systems";
import { pipelineStages } from "@/content/infrastructure";
import { infraTerminals } from "@/content/infrastructure";
import { labStations } from "@/content/lab";
import {
  dnsRecordTypes,
  mailAuth,
  networkDisclaimers,
  proxyRoutes,
  resolutionSteps,
  tlsSteps,
} from "@/content/network";
import { discoveries } from "@/content/discoveries";
import { profile, CONFIDENCE_LABEL } from "@/content/profile";
import { skillGroups } from "@/content/expertise";
import { getSector } from "@/content/sectors";
import { BulletList, Chip, EvidenceBadge, KeyValue, Notice, Rule, Section } from "@/components/interface/Primitives";
import { ContactForm } from "@/components/interface/ContactForm";
import { ChatMockup } from "@/components/interface/ChatMockup";
import { closePanelAndResume } from "@/world/camera/cinematics";
import { cameraRef } from "@/world/camera/director";

const SLUG_BY_PROJECT: Record<string, string> = {
  "mission-001": "khuzestan-yeast",
  "mission-002": "react-native-chat",
  "mission-003": "infrastructure",
  "mission-004": "business-automation",
};

function header(panel: PanelState): { code: string; title: string; subtitle: string } {
  switch (panel.kind) {
    case "project": {
      const p = getProject(panel.id);
      return {
        code: `MISSION ${p?.missionNo ?? "—"} / ${p?.code ?? ""}`,
        title: p?.title ?? "Mission",
        subtitle: p?.subtitle ?? "",
      };
    }
    case "systemNode": {
      const n = getSystemNode(panel.id);
      return { code: `SYSTEM NODE / ${n?.code ?? ""}`, title: n?.label ?? "Node", subtitle: n?.purpose ?? "" };
    }
    case "pipeline": {
      const s = pipelineStages.find((x) => x.id === panel.id);
      return { code: `PIPELINE ${s?.code ?? ""}`, title: s?.label ?? "Stage", subtitle: s?.role ?? "" };
    }
    case "infraTerminal": {
      const t = infraTerminals.find((x) => x.id === panel.id);
      return { code: `OPS / ${t?.code ?? ""}`, title: t?.label ?? "Terminal", subtitle: "Infrastructure operations" };
    }
    case "labStation": {
      const s = labStations.find((x) => x.id === panel.id);
      return { code: `APP / ${s?.code ?? ""}`, title: s?.label ?? "Station", subtitle: s?.tagline ?? "" };
    }
    case "chat":
      return { code: "APP-DEV / RECONSTRUCTION", title: "Chat Interface", subtitle: "Illustrative mobile client reconstruction" };
    case "dnsRecord": {
      const r = dnsRecordTypes.find((x) => x.id === panel.id);
      return { code: `DNS / ${r?.code ?? ""}`, title: `${r?.type ?? "Record"} record`, subtitle: r?.role ?? "" };
    }
    case "mailAuth": {
      const m = mailAuth.find((x) => x.id === panel.id);
      return { code: `MAIL / ${m?.code ?? ""}`, title: m?.label ?? "Mail authentication", subtitle: m?.purpose ?? "" };
    }
    case "tls":
      return { code: "NET-03 / TRANSPORT", title: "TLS Handshake", subtitle: "What happens before the first byte of HTTP" };
    case "proxy":
      return { code: "NET-04 / ROUTING", title: "Reverse Proxy Routing", subtitle: "One public entry point, several internal upstreams" };
    case "networkIndex":
      return { code: "NET-01 / RESOLUTION", title: "DNS Record Console", subtitle: "Record types, resolution path and reserved-range examples" };
    case "architecture":
      return { code: "SYS-CORE / OVERVIEW", title: "Application Architecture", subtitle: "How the layers connect and where they fail" };
    case "identity":
      return { code: "ATR-01 / FACILITY CORE", title: profile.name, subtitle: profile.specialisation };
    case "philosophy":
      return { code: "PRS-03", title: "Engineering Philosophy", subtitle: profile.philosophy };
    case "timeline":
      return { code: "PRS-01", title: "Career Timeline", subtitle: "Development experience, in order" };
    case "bio":
      return { code: "PRS-02", title: "Professional Biography", subtitle: profile.positioning };
    case "interests":
      return { code: "PRS-04", title: "Technical Interests", subtitle: "Experimentation areas and where they stop being professional claims" };
    case "learning":
      return { code: "PRS-05", title: "Learning Objectives", subtitle: "Active development areas" };
    case "contact":
      return { code: "PRS-06 / CONTACT", title: "Contact Channel", subtitle: "Communication terminal" };
    case "missionIndex":
      return { code: "ARC-00", title: "Mission Index", subtitle: "Four engineering missions" };
    case "discovery": {
      const d = discoveries.find((x) => x.id === panel.id);
      return { code: `DISCOVERY / ${d?.code ?? ""}`, title: d?.title ?? "Discovery", subtitle: d?.label ?? "" };
    }
    default:
      return { code: "NEXUS", title: "Interface", subtitle: "" };
  }
}

export function PanelHost() {
  const panel = useNexusStore((s) => s.panel);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!panel) return;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [panel]);

  const close = () => closePanelAndResume(cameraRef.camera);
  const meta = panel ? header(panel) : null;

  return (
    <AnimatePresence>
      {panel && meta && (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-[3px] sm:p-6 md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={meta.title}
            className="nx-hud-panel nx-corner relative my-auto w-full max-w-[1020px]"
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line/80 px-5 py-4">
              <div className="min-w-0">
                <div className="nx-label mb-1">{meta.code}</div>
                <h2 className="truncate font-display text-[26px] font-semibold uppercase leading-tight tracking-[0.08em] text-ink">
                  {meta.title}
                </h2>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">
                  {meta.subtitle}
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={close}
                className="nx-btn shrink-0 px-3 py-1.5 text-[10px]"
                aria-label="Close panel"
              >
                Close ✕
              </button>
            </header>

            <div className="nx-scroll max-h-[70vh] overflow-y-auto px-5 py-5">
              <PanelBody panel={panel} />
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line/80 px-5 py-2.5">
              <span className="nx-label">ESC to close · E to interact · M for map</span>
              <span className="nx-label text-accent/60">NEXUS / {getSector("atrium").code}</span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PanelBody({ panel }: { panel: PanelState }) {
  switch (panel.kind) {
    case "project":
      return <ProjectPanel id={panel.id} />;
    case "systemNode":
      return <SystemNodePanel id={panel.id} />;
    case "pipeline":
      return <PipelinePanel id={panel.id} />;
    case "infraTerminal":
      return <InfraTerminalPanel id={panel.id} />;
    case "labStation":
      return <LabStationPanel id={panel.id} />;
    case "chat":
      return (
        <div className="grid gap-6 md:grid-cols-[340px_1fr]">
          <div className="mx-auto">
            <ChatMockup />
          </div>
          <div className="space-y-4">
            <Section label="ABOUT THIS INTERFACE" title="Illustrative reconstruction">
              <p className="text-[13.5px] leading-relaxed text-ink-dim">
                This device interface was authored for NEXUS to demonstrate the interaction and state
                model of the chat application. It is <strong className="text-ink">not a screenshot</strong>{" "}
                of the original application and contains no real conversation data.
              </p>
              <Rule />
              <p className="text-[13.5px] leading-relaxed text-ink-dim">
                The screen tabs on the device are live: switch between the conversation, thread list,
                media capture and the state model. Everything you can press works.
              </p>
            </Section>
            <Section label="MISSION" title="React Native Chat Application">
              <p className="text-[13.5px] leading-relaxed text-ink-dim">
                Full architecture, responsibilities and limitations are documented in Mission 002.
              </p>
              <Link href="/projects/react-native-chat" className="nx-btn mt-3">
                Open mission 002
              </Link>
            </Section>
          </div>
        </div>
      );
    case "dnsRecord":
      return <DnsRecordPanel id={panel.id} />;
    case "mailAuth":
      return <MailPanel id={panel.id} />;
    case "tls":
      return <TlsPanel />;
    case "proxy":
      return <ProxyPanel />;
    case "networkIndex":
      return <NetworkIndexPanel />;
    case "architecture":
      return <ArchitecturePanel />;
    case "identity":
      return <IdentityPanel />;
    case "philosophy":
      return <PhilosophyPanel />;
    case "timeline":
      return <TimelinePanel />;
    case "bio":
      return <BioPanel />;
    case "interests":
      return <InterestsPanel />;
    case "learning":
      return <LearningPanel />;
    case "contact":
      return <ContactPanel />;
    case "missionIndex":
      return <MissionIndexPanel />;
    case "discovery":
      return <DiscoveryPanel id={panel.id} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

function ProjectPanel({ id }: { id: string }) {
  const project = getProject(id);
  if (!project) return null;
  const slug = SLUG_BY_PROJECT[project.id];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {project.facts.map((f) => (
          <KeyValue key={f.label} label={f.label} value={f.value} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="cyan">{project.classification}</Chip>
        <Chip tone={project.status === "operational" ? "good" : "white"}>{project.status}</Chip>
        {project.url && (
          <a href={project.url} target="_blank" rel="noreferrer" className="nx-btn px-2.5 py-1 text-[9.5px]">
            Live site ↗
          </a>
        )}
        {slug && (
          <Link href={`/projects/${slug}`} className="nx-btn px-2.5 py-1 text-[9.5px]">
            Conventional page ↗
          </Link>
        )}
      </div>

      <Section label="BRIEFING" title="Context">
        <div className="space-y-3">
          {project.briefing.map((para) => (
            <p key={para.slice(0, 24)} className="text-[13.5px] leading-relaxed text-ink-dim">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section label="ARCHITECTURE" title="Request path">
        <ol className="space-y-2">
          {project.architecture.map((stage, i) => (
            <li key={stage.id} className="border border-line bg-black/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">
                  {stage.label}
                </span>
                <EvidenceBadge kind={stage.evidence} compact />
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">{stage.detail}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stage.tech.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section label="RESPONSIBILITIES" title="My work">
          <BulletList items={project.responsibilities} />
        </Section>
        <Section label="TECHNOLOGIES" title="Stack">
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <Chip key={t} tone="cyan">
                {t}
              </Chip>
            ))}
          </div>
        </Section>
      </div>

      <Section label="ENGINEERING" title="Challenges and decisions">
        <div className="space-y-3">
          {project.challenges.map((c) => (
            <div key={c.title} className="border-l border-line-2 pl-3">
              <div className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">{c.title}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-faint">
                <span className="text-amber/80">Problem · </span>
                {c.problem}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">
                <span className="text-accent/80">Response · </span>
                {c.response}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="OUTCOMES" title="Result">
        <BulletList items={project.outcomes} />
      </Section>

      <Section label="EVIDENCE & LIMITS" title="What is not claimed">
        <div className="space-y-2">
          {project.caveats.map((c) => (
            <Notice key={c} tone="amber">
              {c}
            </Notice>
          ))}
          {project.media.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2 border border-line bg-black/20 p-2">
              <Chip tone="muted">{m.label}</Chip>
              <span className="font-mono text-[10px] leading-snug text-ink-faint">{m.disclaimer}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SystemNodePanel({ id }: { id: string }) {
  const node = getSystemNode(id);
  const store = useNexusStore();
  if (!node) return null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="cyan">{node.layer} layer</Chip>
        <Chip tone="muted">{node.code}</Chip>
      </div>
      <p className="text-[14px] leading-relaxed text-ink">{node.detail}</p>
      <Section label="FAILURE MODE" title="What goes wrong here">
        <Notice tone="alert">{node.failure}</Notice>
      </Section>
      <div className="grid gap-6 md:grid-cols-2">
        <Section label="TECHNOLOGIES" title="Involved">
          <div className="flex flex-wrap gap-1.5">
            {node.technologies.map((t) => (
              <Chip key={t} tone="cyan">
                {t}
              </Chip>
            ))}
          </div>
        </Section>
        <Section label="CONNECTIONS" title="Upstream & downstream">
          <div className="flex flex-wrap gap-1.5">
            {node.connections.map((c) => {
              const target = getSystemNode(c);
              if (!target) return null;
              return (
                <button
                  key={c}
                  onClick={() => store.openPanel({ kind: "systemNode", id: c })}
                  className="nx-btn px-2 py-1 text-[9.5px]"
                >
                  {target.label}
                </button>
              );
            })}
          </div>
        </Section>
      </div>
      <Section label="RELATED MISSIONS" title="Where this appears">
        <div className="flex flex-wrap gap-2">
          {node.relatedProjects.map((pid) => {
            const p = getProject(pid);
            if (!p) return null;
            return (
              <button
                key={pid}
                onClick={() => store.openPanel({ kind: "project", id: pid })}
                className="nx-btn px-2.5 py-1 text-[9.5px]"
              >
                Mission {p.missionNo} — {p.code}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function PipelinePanel({ id }: { id: string }) {
  const stage = pipelineStages.find((s) => s.id === id);
  const store = useNexusStore();
  if (!stage) return null;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KeyValue label="Layer" value={stage.code} />
        <KeyValue label="Responsibility" value={stage.role} />
        <div>
          <div className="nx-label mb-1">Evidence</div>
          <EvidenceBadge kind={stage.evidence} />
        </div>
      </div>
      <p className="text-[14px] leading-relaxed text-ink">{stage.detail}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <Section label="RESPONSIBILITIES" title="What this layer does">
          <BulletList items={stage.responsibilities} />
        </Section>
        <div className="space-y-4">
          <Section label="TYPICAL FAILURE" title="How it breaks">
            <Notice tone="alert">{stage.failure}</Notice>
          </Section>
          <Section label="DIAGNOSIS" title="How I isolate it">
            <p className="text-[12.5px] leading-relaxed text-ink-dim">{stage.diagnosis}</p>
          </Section>
        </div>
      </div>
      <Section label="TECHNOLOGIES" title="Involved">
        <div className="flex flex-wrap gap-1.5">
          {stage.technologies.map((t) => (
            <Chip key={t} tone="amber">
              {t}
            </Chip>
          ))}
        </div>
      </Section>
      <div className="flex flex-wrap gap-2">
        {pipelineStages.map((s) => (
          <button
            key={s.id}
            onClick={() => store.openPanel({ kind: "pipeline", id: s.id })}
            className={`nx-btn px-2 py-1 text-[9px] ${s.id === stage.id ? "nx-btn-primary" : ""}`}
          >
            {s.code.split(" / ")[0]}
          </button>
        ))}
        <Link href="/projects/infrastructure" className="nx-btn px-2 py-1 text-[9px]">
          Mission 003 ↗
        </Link>
      </div>
    </div>
  );
}

function InfraTerminalPanel({ id }: { id: string }) {
  const terminal = infraTerminals.find((t) => t.id === id);
  if (!terminal) return null;
  return (
    <div className="space-y-5">
      <Chip tone="amber">{CONFIDENCE_LABEL[terminal.confidence]}</Chip>
      <p className="text-[14px] leading-relaxed text-ink">{terminal.summary}</p>
      <Section label="OPERATIONAL NOTES" title="What this involves">
        <BulletList items={terminal.points} />
      </Section>
      <Notice>
        This terminal documents operating practice from real deployments. No hostnames, addresses,
        credentials or client infrastructure are exposed anywhere in NEXUS.
      </Notice>
    </div>
  );
}

function LabStationPanel({ id }: { id: string }) {
  const station = labStations.find((s) => s.id === id);
  if (!station) return null;
  const project = getProject(station.relatedProject);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="cyan">{CONFIDENCE_LABEL[station.confidence]}</Chip>
        <Chip tone="muted">{station.code}</Chip>
      </div>
      <p className="text-[14px] leading-relaxed text-ink">{station.detail}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <Section label="PRACTICE" title="How it is applied">
          <BulletList items={station.practices} />
        </Section>
        <Section label="TECHNOLOGIES" title="Toolset">
          <div className="flex flex-wrap gap-1.5">
            {station.technologies.map((t) => (
              <Chip key={t} tone="cyan">
                {t}
              </Chip>
            ))}
          </div>
          {project && (
            <div className="mt-4">
              <div className="nx-label mb-1.5">Related mission</div>
              <Link href={`/projects/${SLUG_BY_PROJECT[project.id]}`} className="nx-btn px-2.5 py-1 text-[9.5px]">
                Mission {project.missionNo} — {project.code}
              </Link>
              <button
                onClick={() => useNexusStore.getState().openPanel({ kind: "project", id: project.id })}
                className="nx-btn ml-2 px-2.5 py-1 text-[9.5px]"
              >
                Open briefing
              </button>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function DnsRecordPanel({ id }: { id: string }) {
  const record = dnsRecordTypes.find((r) => r.id === id);
  if (!record) return null;
  return (
    <div className="space-y-5">
      <div className="border border-line bg-black/40 p-3 font-mono text-[12px] text-accent">
        {record.example}
      </div>
      <p className="text-[14px] leading-relaxed text-ink">{record.explanation}</p>
      <Section label="NOTES" title="Practical detail">
        <BulletList items={record.notes} />
      </Section>
      <div className="flex flex-wrap gap-2">
        {dnsRecordTypes.map((r) => (
          <button
            key={r.id}
            onClick={() => useNexusStore.getState().openPanel({ kind: "dnsRecord", id: r.id })}
            className={`nx-btn px-2 py-1 text-[9px] ${r.id === record.id ? "nx-btn-primary" : ""}`}
          >
            {r.type}
          </button>
        ))}
      </div>
      <Notice tone="amber">{networkDisclaimers[0]}</Notice>
    </div>
  );
}

function MailPanel({ id }: { id: string }) {
  const item = mailAuth.find((m) => m.id === id) ?? mailAuth[0];
  return (
    <div className="space-y-5">
      <p className="text-[14px] leading-relaxed text-ink">{item.detail}</p>
      <Section label="FAILURE MODE" title="What breaks alignment">
        <Notice tone="alert">{item.failure}</Notice>
      </Section>
      <div className="flex flex-wrap gap-2">
        {mailAuth.map((m) => (
          <button
            key={m.id}
            onClick={() => useNexusStore.getState().openPanel({ kind: "mailAuth", id: m.id })}
            className={`nx-btn px-2 py-1 text-[9px] ${m.id === item.id ? "nx-btn-primary" : ""}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Section label="SEQUENCE" title="How the policies combine">
        <ol className="space-y-2">
          {mailAuth.map((m, i) => (
            <li key={m.id} className="flex gap-3 border-l border-line pl-3">
              <span className="font-mono text-[10px] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="font-display text-[14px] uppercase tracking-[0.08em] text-ink">{m.label}</div>
                <p className="text-[12px] leading-relaxed text-ink-dim">{m.purpose}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function TlsPanel() {
  return (
    <div className="space-y-5">
      <p className="text-[13.5px] leading-relaxed text-ink-dim">
        TLS is negotiated before any application data moves. When HTTPS fails, the application never
        sees the request at all — which is exactly why the transport layer is diagnosed first.
      </p>
      <ol className="space-y-2">
        {tlsSteps.map((step) => (
          <li key={step.index} className="border border-line bg-black/25 p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-accent">{String(step.index).padStart(2, "0")}</span>
              <span className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">{step.label}</span>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{step.detail}</p>
          </li>
        ))}
      </ol>
      <Notice tone="amber">
        Certificates in this facility are managed with Certbot and renewed on a schedule, then verified
        from outside the host. An unverified renewal is how an outage gets scheduled silently.
      </Notice>
    </div>
  );
}

function ProxyPanel() {
  return (
    <div className="space-y-5">
      <p className="text-[13.5px] leading-relaxed text-ink-dim">
        One public entry point routes several hostnames to separate internal upstreams. Hostnames and
        addresses below use reserved documentation ranges.
      </p>
      <div className="space-y-2">
        {proxyRoutes.map((route) => (
          <div key={route.id} className="border border-line bg-black/25 p-3">
            <div className="flex flex-wrap items-baseline gap-3 font-mono text-[11.5px]">
              <span className="text-ink">{route.host}</span>
              <span className="text-accent">→ {route.upstream}</span>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-dim">{route.note}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <KeyValue label="Body limits" value="Raised per upload route, then verified with real files" />
        <KeyValue label="Headers" value="Forwarded host/proto + security headers at the edge" />
        <KeyValue label="Timeouts" value="Adjusted for long-running uploads" />
        <KeyValue label="Static assets" value="Served by the proxy with long cache lifetimes" />
      </div>
      <Notice>{networkDisclaimers[0]}</Notice>
    </div>
  );
}

function NetworkIndexPanel() {
  const store = useNexusStore();
  return (
    <div className="space-y-6">
      <Section label="RECORD TYPES" title="Select a record">
        <div className="grid gap-2 sm:grid-cols-2">
          {dnsRecordTypes.map((record) => (
            <button
              key={record.id}
              onClick={() => store.openPanel({ kind: "dnsRecord", id: record.id })}
              className="border border-line bg-black/25 p-3 text-left transition hover:border-accent/50 hover:bg-[#0b1c22]"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[16px] uppercase tracking-[0.1em] text-accent">
                  {record.type}
                </span>
                <span className="font-mono text-[9px] text-ink-faint">{record.code}</span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-dim">{record.role}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section label="RESOLUTION MODEL" title="How a hostname becomes a connection">
        <ol className="space-y-2">
          {resolutionSteps.map((step) => (
            <li key={step.index} className="flex gap-3 border-l border-line pl-3">
              <span className="mt-0.5 font-mono text-[10px] text-accent">{String(step.index).padStart(2, "0")}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[14.5px] uppercase tracking-[0.08em] text-ink">
                    {step.title}
                  </span>
                  <Chip tone="muted">{step.layer}</Chip>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-dim">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => store.openPanel({ kind: "tls" })} className="nx-btn px-2.5 py-1 text-[9.5px]">
          TLS handshake
        </button>
        <button onClick={() => store.openPanel({ kind: "proxy" })} className="nx-btn px-2.5 py-1 text-[9.5px]">
          Proxy routing
        </button>
        <button onClick={() => store.openPanel({ kind: "mailAuth", id: "spf" })} className="nx-btn px-2.5 py-1 text-[9.5px]">
          Mail authentication
        </button>
      </div>
      <div className="space-y-2">
        {networkDisclaimers.map((d) => (
          <Notice key={d} tone="amber">
            {d}
          </Notice>
        ))}
      </div>
    </div>
  );
}

function ArchitecturePanel() {
  const store = useNexusStore();
  return (
    <div className="space-y-5">
      <p className="text-[13.5px] leading-relaxed text-ink-dim">
        The application as a set of layers, each with a distinct responsibility and a distinct failure
        mode. Select a layer to inspect it. The same node graph is standing in the centre of this room.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {systemNodes.map((node) => (
          <button
            key={node.id}
            onClick={() => store.openPanel({ kind: "systemNode", id: node.id })}
            className="border border-line bg-black/25 p-3 text-left transition hover:border-accent/50 hover:bg-[#0b1c22]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">{node.label}</span>
              <span className="font-mono text-[9px] text-ink-faint">{node.code}</span>
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-accent/70">
              {node.layer}
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-dim">{node.purpose}</p>
          </button>
        ))}
      </div>
      <Notice>
        The visualisation is built from real interconnected nodes — selecting one highlights its
        connections in the room and animates data flow along them.
      </Notice>
    </div>
  );
}

function IdentityPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-[30px] font-semibold uppercase tracking-[0.1em] text-ink">
          {profile.name}
        </h3>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.24em] text-accent">{profile.title}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          {profile.specialisation}
        </div>
      </div>
      <p className="text-[14px] leading-relaxed text-ink-dim">{profile.summary}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {profile.introBullets.map((b) => (
          <div key={b} className="border border-line bg-black/25 px-3 py-2 font-mono text-[11px] text-ink-dim">
            {b}
          </div>
        ))}
      </div>
      <Section label="PHILOSOPHY" title={`“${profile.philosophy}”`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {profile.philosophyPoints.slice(0, 4).map((p) => (
            <div key={p.title} className="border-l border-line-2 pl-3">
              <div className="font-display text-[14px] uppercase tracking-[0.08em] text-ink">{p.title}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-dim">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section label="CONNECTED SYSTEM" title="The stack around this core">
        <div className="flex flex-wrap gap-2">
          {skillGroups.map((g) => (
            <Chip key={g.id} tone={g.accent === "amber" ? "amber" : "cyan"}>
              {g.label}
            </Chip>
          ))}
        </div>
      </Section>
      <div className="flex flex-wrap gap-2">
        <Link href="/about" className="nx-btn">
          Full profile
        </Link>
        <Link href="/projects" className="nx-btn">
          Projects
        </Link>
        <Link href="/contact" className="nx-btn nx-btn-primary">
          Contact
        </Link>
      </div>
    </div>
  );
}

function PhilosophyPanel() {
  return (
    <div className="space-y-6">
      <blockquote className="border-l-2 border-amber/60 pl-4 font-display text-[24px] leading-snug text-ink">
        “{profile.philosophy}”
      </blockquote>
      <div className="grid gap-4 sm:grid-cols-2">
        {profile.philosophyPoints.map((point) => (
          <div key={point.title} className="border border-line bg-black/25 p-3">
            <div className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">{point.title}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{point.body}</p>
          </div>
        ))}
      </div>
      <Notice tone="amber">
        AI-assisted development is part of the workflow. Architecture, implementation decisions,
        debugging and validation remain human — a generated snippet that cannot be explained is a
        liability, not a shortcut.
      </Notice>
    </div>
  );
}

function TimelinePanel() {
  return (
    <div className="space-y-3">
      <Notice>
        Timeline markers are approximate and editable in <code>src/content/profile.ts</code>. No
        employers, dates, degrees or certifications are published.
      </Notice>
      <ol className="space-y-2">
        {profile.timeline.map((entry, i) => (
          <li key={entry.id} className="border border-line bg-black/25 p-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[10px] text-amber">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-display text-[16px] uppercase tracking-[0.08em] text-ink">{entry.title}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                {entry.era} · {entry.marker}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">{entry.body}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function BioPanel() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <KeyValue label="Role" value={profile.title} />
        <KeyValue label="Focus" value={profile.specialisation} />
        <KeyValue label="Availability" value={profile.availability.status} />
      </div>
      <div className="space-y-3">
        {profile.biography.map((para) => (
          <p key={para.slice(0, 24)} className="text-[13.5px] leading-relaxed text-ink-dim">
            {para}
          </p>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/about" className="nx-btn">
          Read on the conventional site
        </Link>
        <Link href="/expertise" className="nx-btn">
          Expertise
        </Link>
      </div>
    </div>
  );
}

function InterestsPanel() {
  return (
    <div className="space-y-4">
      <Notice tone="amber">
        Hardware work is presented as a technical interest and experimentation area — not as a
        professional qualification.
      </Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.interests.map((interest) => (
          <div key={interest.id} className="border border-line bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-display text-[16px] uppercase tracking-[0.08em] text-ink">
                {interest.title}
              </div>
              <Chip tone="amber">{CONFIDENCE_LABEL[interest.confidence]}</Chip>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">{interest.body}</p>
          </div>
        ))}
      </div>
      <Section label="HARDWARE" title="Bench practice">
        <div className="flex flex-wrap gap-1.5">
          {["CPU architecture", "GPU architecture", "BIOS", "Memory timings", "Thermals", "Benchmarking", "OS tuning"].map(
            (t) => (
              <Chip key={t}>{t}</Chip>
            ),
          )}
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-dim">
          One variable at a time, long enough to be meaningful, written down. The same rule applies to
          a thermal test and to a bundler change.
        </p>
      </Section>
    </div>
  );
}

function LearningPanel() {
  return (
    <div className="space-y-4">
      <p className="text-[13.5px] leading-relaxed text-ink-dim">
        Active development areas. These are objectives, not completed capabilities.
      </p>
      <div className="space-y-2">
        {profile.learning.map((item, i) => (
          <div key={item.id} className="border border-line bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">
                {String(i + 1).padStart(2, "0")} · {item.title}
              </span>
              <Chip tone="muted">{item.horizon}</Chip>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">{item.body}</p>
          </div>
        ))}
      </div>
      <Notice>{profile.availability.note}</Notice>
    </div>
  );
}

function ContactPanel() {
  return (
    <div className="space-y-5">
      <p className="text-[13.5px] leading-relaxed text-ink-dim">{profile.contact.form.note}</p>
      <ContactForm compact />
    </div>
  );
}

function MissionIndexPanel() {
  const store = useNexusStore();
  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div key={project.id} className="border border-line bg-black/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="nx-label">MISSION {project.missionNo}</div>
              <div className="font-display text-[19px] uppercase tracking-[0.06em] text-ink">
                {project.title}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => store.openPanel({ kind: "project", id: project.id })}
                className="nx-btn px-2.5 py-1 text-[9.5px]"
              >
                Briefing
              </button>
              <Link
                href={`/projects/${SLUG_BY_PROJECT[project.id]}`}
                className="nx-btn px-2.5 py-1 text-[9.5px]"
              >
                Page ↗
              </Link>
            </div>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-dim">{project.summary}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 7).map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscoveryPanel({ id }: { id: string }) {
  const discovery = discoveries.find((d) => d.id === id);
  if (!discovery) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="good">Discovery unlocked</Chip>
        <Chip tone="muted">{discovery.code}</Chip>
        <Chip tone="muted">{discovery.label}</Chip>
      </div>
      {discovery.body.map((para) => (
        <p key={para.slice(0, 20)} className="text-[13.5px] leading-relaxed text-ink-dim">
          {para}
        </p>
      ))}
      <Notice>
        Optional discovery. Nothing essential is hidden behind these — every professional detail is
        reachable through the sectors and the conventional pages.
      </Notice>
    </div>
  );
}
