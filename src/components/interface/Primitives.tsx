import type { ReactNode } from "react";
import type { EvidenceKind } from "@/content/projects";

const TONES: Record<string, string> = {
  cyan: "border-[#2b6f7d] bg-[#0c2027] text-[#8fe8f7]",
  amber: "border-[#6b5220] bg-[#1e1710] text-[#f2c68a]",
  white: "border-[#33454f] bg-[#101a20] text-[#d3e3ec]",
  muted: "border-[#24333d] bg-[#0a1218] text-[#8ba2b0]",
  alert: "border-[#6b2b28] bg-[#1d1110] text-[#ff9b93]",
  good: "border-[#285f47] bg-[#0b1d16] text-[#7ff0b8]",
};

export function Chip({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-[3px] font-mono text-[9.5px] uppercase leading-none tracking-[0.14em] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const EVIDENCE: Record<EvidenceKind, { label: string; tone: keyof typeof TONES; note: string }> = {
  verified: {
    label: "Verified implementation",
    tone: "good",
    note: "Capability delivered in real project work described by the owner.",
  },
  conceptual: {
    label: "Conceptual diagram",
    tone: "cyan",
    note: "A schematic drawn from the real architecture — not a screenshot or live system.",
  },
  illustrative: {
    label: "Illustrative mockup",
    tone: "amber",
    note: "Authored for this portfolio; not an original application screenshot.",
  },
  planned: {
    label: "Planned capability",
    tone: "muted",
    note: "Explored but not presented as delivered.",
  },
  external: {
    label: "External link",
    tone: "white",
    note: "Opens the live third-party resource in a new tab.",
  },
};

export function EvidenceBadge({ kind, compact = false }: { kind: EvidenceKind; compact?: boolean }) {
  const e = EVIDENCE[kind];
  return (
    <span className="inline-flex items-center gap-1.5" title={e.note}>
      <Chip tone={e.tone}>{compact ? e.label.split(" ")[0] : e.label}</Chip>
      {!compact && <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">· {kind}</span>}
    </span>
  );
}

export function Section({
  label,
  title,
  children,
  id,
  className = "",
}: {
  label?: string;
  title?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`border-t border-line/70 pt-5 first:border-0 first:pt-0 ${className}`}>
      {(label || title) && (
        <header className="mb-3">
          {label && <div className="nx-label mb-1">{label}</div>}
          {title && (
            <h3 className="font-display text-[19px] font-semibold uppercase tracking-[0.1em] text-ink">
              {title}
            </h3>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-line-2/60 pl-3">
      <div className="nx-label">{label}</div>
      <div className="mt-1 font-mono text-[12px] leading-snug text-ink">{value}</div>
    </div>
  );
}

export function Rule({ className = "" }: { className?: string }) {
  return <div className={`nx-hairline my-4 ${className}`} />;
}

export function Notice({ children, tone = "muted" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <div className={`border-l-2 px-3 py-2 font-mono text-[11px] leading-relaxed ${TONES[tone]} border-l-current bg-black/30`}>
      {children}
    </div>
  );
}

export function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-dim">
          <span className="mt-[7px] h-1 w-1 shrink-0 bg-accent/70" />
          {item}
        </li>
      ))}
    </ul>
  );
}
