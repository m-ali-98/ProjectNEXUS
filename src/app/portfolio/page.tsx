import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import {sectors} from "@/content/sectors";
import { skillGroups } from "@/content/expertise";
import { BulletList, Chip } from "@/components/interface/Primitives";

export const metadata: Metadata = {
  title: "Software Engineer — Application Development, Systems & Infrastructure",
  description:
    "Conventional portfolio of Mohammad Ali Ashnavar: frontend and React Native application development, systems integration, and production infrastructure on Linux, Nginx and Node.js.",
  alternates: { canonical: "/portfolio" },
};

const featured = projects[0];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />

      <main className="mx-auto max-w-[1180px] px-5">
        {/* hero */}
        <section className="relative overflow-hidden border-b border-line/70 py-14">
          <div className="nx-grid-bg pointer-events-none absolute inset-0 opacity-25" />
          <div className="relative max-w-[820px]">
            <div className="nx-label text-accent/90">Interactive engineering environment</div>
            <h1 className="mt-2 font-display text-[clamp(34px,6vw,64px)] font-semibold uppercase leading-[0.95] tracking-[0.06em] text-ink">
              {profile.name}
            </h1>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-accent">
              {profile.title} · applications / systems / infrastructure
            </p>
            <p className="mt-5 max-w-[680px] text-[15px] leading-relaxed text-ink-dim">{profile.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/" className="nx-btn nx-btn-primary">
                Enter the 3D facility
              </Link>
              <Link href="/projects" className="nx-btn">
                Engineering missions
              </Link>
              <Link href="/contact" className="nx-btn">
                Contact
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {profile.introBullets.map((bullet) => (
                <div key={bullet} className="border border-line bg-black/25 px-3 py-2">
                  <span className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink-dim">
                    {bullet}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* philosophy */}
        <section className="grid gap-8 border-b border-line/70 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="nx-label mb-2">Engineering philosophy</div>
            <blockquote className="font-display text-[clamp(22px,3vw,32px)] leading-tight text-ink">
              “{profile.philosophy}”
            </blockquote>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {profile.philosophyPoints.map((point) => (
                <div key={point.title} className="border-l border-line-2 pl-3">
                  <div className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">
                    {point.title}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="space-y-3">
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-1.5">Availability</div>
              <p className="text-[13px] leading-relaxed text-ink-dim">{profile.availability.note}</p>
              <Link href="/contact" className="nx-btn mt-3 w-full">
                Open contact channel
              </Link>
            </div>
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-1.5">How this portfolio works</div>
              <p className="text-[12px] leading-relaxed text-ink-dim">
                NEXUS is a real explorable 3D facility built with React Three Fiber: first-person
                movement, interactive exhibits and sector architecture. This page is the conventional
                equivalent — the same information without the game layer.
              </p>
            </div>
          </aside>
        </section>

        {/* sectors */}
        <section className="border-b border-line/70 py-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="nx-label mb-1">The facility</div>
              <h2 className="font-display text-[28px] font-semibold uppercase tracking-[0.1em] text-ink">
                Seven sectors, one system
              </h2>
            </div>
            <Link href="/expertise" className="nx-btn px-3 py-1.5 text-[9.5px]">
              Expertise detail
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((sector) => (
              <div key={sector.id} className="border border-line bg-black/20 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] text-accent/80">SECTOR {sector.number}</span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-faint">
                    {sector.code}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-[18px] uppercase leading-tight tracking-[0.06em] text-ink">
                  {sector.name}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-dim">{sector.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sector.tags.slice(0, 4).map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* featured mission */}
        <section className="grid gap-6 border-b border-line/70 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="nx-label mb-1">Flagship mission</div>
            <h2 className="font-display text-[26px] font-semibold uppercase leading-tight tracking-[0.06em] text-ink">
              {featured.title}
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {featured.organisation} · {featured.classification}
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-dim">{featured.summary}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {featured.technologies.slice(0, 10).map((t) => (
                <Chip key={t} tone="cyan">
                  {t}
                </Chip>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/projects/khuzestan-yeast" className="nx-btn nx-btn-primary">
                Read the case study
              </Link>
              {featured.url && (
                <a href={featured.url} target="_blank" rel="noreferrer" className="nx-btn">
                  Live platform ↗
                </a>
              )}
            </div>
          </div>
          <aside className="nx-hud-panel p-4">
            <div className="nx-label mb-2">Mission index</div>
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id === "mission-001" ? "khuzestan-yeast" : p.id === "mission-002" ? "react-native-chat" : p.id === "mission-003" ? "infrastructure" : "business-automation"}`}
                    className="group flex items-baseline gap-2"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent/70">
                      M-{p.missionNo}
                    </span>
                    <span className="text-[12px] leading-snug text-ink-dim transition group-hover:text-accent">
                      {p.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* expertise rail */}
        <section className="py-12">
          <div className="mb-5">
            <div className="nx-label mb-1">Capability</div>
            <h2 className="font-display text-[28px] font-semibold uppercase tracking-[0.1em] text-ink">
              Where the work happens
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <BulletList items={profile.biography.slice(0, 2)} />
            <div className="space-y-3">
              {skillGroups.slice(0, 4).map((group) => (
                <div key={group.id} className="border border-line bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[15px] uppercase tracking-[0.08em] text-ink">
                      {group.label}
                    </span>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-faint">
                      {group.sector}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {group.skills.slice(0, 5).map((skill) => (
                      <Chip key={skill.id}>{skill.name}</Chip>
                    ))}
                  </div>
                </div>
              ))}
              <Link href="/expertise" className="nx-btn w-full justify-center">
                Full expertise tree
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
