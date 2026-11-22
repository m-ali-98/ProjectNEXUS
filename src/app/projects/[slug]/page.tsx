import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { missionForSlug, projectBySlug, getProject, slugById } from "@/content/projects";
import { BulletList, Chip, EvidenceBadge, KeyValue, Notice, Section } from "@/components/interface/Primitives";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return Object.keys(projectBySlug).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = missionForSlug(slug);
  if (!project) return { title: "Mission not found" };
  return {
    title: `Mission ${project.missionNo} — ${project.title}`,
    description: project.summary.slice(0, 180),
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${project.title} — NEXUS`,
      description: project.summary.slice(0, 200),
      type: "article",
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = missionForSlug(slug);
  if (!project) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    author: { "@type": "Person", name: "Mohammad Ali Ashnavar" },
    about: project.technologies,
    genre: "Software engineering case study",
  };

  const others = Object.entries(slugById)
    .filter(([id]) => id !== project.id)
    .map(([id, s]) => ({ slug: s, project: getProject(id)! }));

  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />
      <main className="mx-auto max-w-[1040px] px-5 py-12">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80">
            Mission {project.missionNo}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
            {project.code}
          </span>
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4.6vw,44px)] font-semibold uppercase leading-[1.02] tracking-[0.06em] text-ink">
          {project.title}
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          {project.organisation} · {project.classification}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/" className="nx-btn nx-btn-primary">
            Visit in the facility
          </Link>
          {project.url && (
            <a href={project.url} target="_blank" rel="noreferrer" className="nx-btn">
              Live site ↗
            </a>
          )}
          <Link href="/projects" className="nx-btn">
            All missions
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {project.facts.map((f) => (
            <KeyValue key={f.label} label={f.label} value={f.value} />
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-8">
            <Section label="BRIEFING" title="Context">
              <div className="space-y-3">
                {project.briefing.map((para) => (
                  <p key={para.slice(0, 24)} className="text-[14px] leading-relaxed text-ink-dim">
                    {para}
                  </p>
                ))}
              </div>
            </Section>

            <Section label="ARCHITECTURE" title="Request path">
              <ol className="space-y-2">
                {project.architecture.map((stage, i) => (
                  <li key={stage.id} className="border border-line bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-accent/80">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="font-display text-[17px] uppercase tracking-[0.06em] text-ink">
                        {stage.label}
                      </h3>
                      <EvidenceBadge kind={stage.evidence} compact />
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">{stage.detail}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {stage.tech.map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section label="RESPONSIBILITIES" title="My work">
              <BulletList items={project.responsibilities} />
            </Section>

            <Section label="DECISIONS" title="Challenges and responses">
              <div className="space-y-4">
                {project.challenges.map((c) => (
                  <div key={c.title} className="border-l border-line-2 pl-4">
                    <h3 className="font-display text-[16px] uppercase tracking-[0.06em] text-ink">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
                      <span className="text-amber/80">Problem · </span>
                      {c.problem}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-dim">
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
                  <div key={m.id} className="flex flex-wrap items-center gap-2 border border-line p-2">
                    <Chip tone="muted">{m.label}</Chip>
                    <span className="font-mono text-[10px] leading-snug text-ink-faint">{m.disclaimer}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <aside className="space-y-4">
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-2">Technologies</div>
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((t) => (
                  <Chip key={t} tone="cyan">
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-2">Other missions</div>
              <ul className="space-y-2">
                {others.map(({ slug: s, project: p }) => (
                  <li key={s}>
                    <Link
                      href={`/projects/${s}`}
                      className="flex items-baseline gap-2 text-[12px] leading-snug text-ink-dim transition hover:text-accent"
                    >
                      <span className="font-mono text-[8.5px] text-accent/60">M-{p.missionNo}</span>
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-1.5">Explore in 3D</div>
              <p className="text-[11.5px] leading-relaxed text-ink-dim">
                This mission is installed in the Project Archive sector as a physical exhibit with an
                outline table.
              </p>
              <Link href="/" className="nx-btn mt-2 w-full">
                Enter facility
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
