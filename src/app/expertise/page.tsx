import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { skillGroups } from "@/content/expertise";
import { CONFIDENCE_LABEL, type Confidence } from "@/content/profile";
import { projects } from "@/content/projects";
import { Chip, Notice } from "@/components/interface/Primitives";

export const metadata: Metadata = {
  title: "Expertise — application development, integration and infrastructure",
  description:
    "Technical capability across JavaScript and TypeScript, React and React Native, Redux, API and webhook integration, payments, Linux VPS operations, Nginx, TLS, DNS and Node.js deployment.",
  alternates: { canonical: "/expertise" },
};

const CONFIDENCE_ORDER: Confidence[] = ["professional", "working", "familiar", "learning"];

const slugFor = (id: string) =>
  id === "mission-001"
    ? "khuzestan-yeast"
    : id === "mission-002"
      ? "react-native-chat"
      : id === "mission-003"
        ? "infrastructure"
        : "business-automation";

export default function ExpertisePage() {
  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />
      <main className="mx-auto max-w-[1120px] px-5 py-12">
        <div className="nx-label text-accent/90">Capability map</div>
        <h1 className="mt-2 font-display text-[clamp(30px,5vw,48px)] font-semibold uppercase leading-none tracking-[0.08em] text-ink">
          Expertise
        </h1>
        <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-ink-dim">
          Grouped by where the capability sits in a real system. Each item states the nature of the
          exposure — applied professionally, hands-on in real projects, technically familiar, or an
          active learning objective.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {CONFIDENCE_ORDER.map((c) => (
            <Chip key={c} tone={c === "professional" ? "good" : c === "working" ? "cyan" : c === "familiar" ? "amber" : "muted"}>
              {CONFIDENCE_LABEL[c]}
            </Chip>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {skillGroups.map((group) => (
            <section key={group.id} id={group.id} className="border border-line bg-black/20 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="nx-label">{group.short}</div>
                  <h2 className="mt-0.5 font-display text-[24px] font-semibold uppercase tracking-[0.08em] text-ink">
                    {group.label}
                  </h2>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
                  sector · {group.sector}
                </span>
              </div>
              <p className="mt-2 max-w-[760px] text-[13px] leading-relaxed text-ink-dim">{group.summary}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.skills.map((skill) => (
                  <div key={skill.id} className="border border-line bg-black/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink">
                        {skill.name}
                      </span>
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rotate-45 ${
                          skill.confidence === "professional"
                            ? "bg-good"
                            : skill.confidence === "working"
                              ? "bg-accent"
                              : skill.confidence === "familiar"
                                ? "bg-amber"
                                : "bg-ink-faint"
                        }`}
                        title={CONFIDENCE_LABEL[skill.confidence]}
                      />
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">{skill.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="nx-label">Applied in</span>
                {group.relatedProjects.map((pid) => {
                  const p = projects.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <Link
                      key={pid}
                      href={`/projects/${slugFor(pid)}`}
                      className="nx-btn px-2 py-1 text-[9px]"
                    >
                      M-{p.missionNo} · {p.code}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <Notice tone="amber">
          Hardware, benchmarking and memory tuning are documented as technical interests and
          experimentation, not as professional qualifications. Where a capability is exploratory it is
          labelled as such instead of being presented as delivered work.
        </Notice>
      </main>
      <SiteFooter />
    </div>
  );
}
