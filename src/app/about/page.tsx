import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { profile, CONFIDENCE_LABEL } from "@/content/profile";
import { Chip, Notice, Section } from "@/components/interface/Primitives";

export const metadata: Metadata = {
  title: "About — background, philosophy and interests",
  description:
    "Mohammad Ali Ashnavar: approximately two years of frontend development, practical React Native application work, systems integration and production infrastructure operations.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />
      <main className="mx-auto max-w-[1000px] px-5 py-12">
        <div className="nx-label text-accent/90">Sector 06 · Personnel file</div>
        <h1 className="mt-2 font-display text-[clamp(30px,5vw,48px)] font-semibold uppercase leading-none tracking-[0.08em] text-ink">
          About
        </h1>
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.24em] text-ink-faint">
          {profile.positioning}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="space-y-4">
            {profile.biography.map((para) => (
              <p key={para.slice(0, 24)} className="text-[14.5px] leading-relaxed text-ink-dim">
                {para}
              </p>
            ))}
            <blockquote className="border-l-2 border-accent/60 pl-4 font-display text-[22px] leading-snug text-ink">
              “{profile.philosophy}”
            </blockquote>
          </article>
          <aside className="space-y-3">
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-1.5">Working style</div>
              <p className="text-[12.5px] leading-relaxed text-ink-dim">{profile.tagline}</p>
            </div>
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-1.5">Availability</div>
              <p className="text-[12.5px] leading-relaxed text-ink-dim">{profile.availability.note}</p>
              <Link href="/contact" className="nx-btn mt-3 w-full">
                Contact
              </Link>
            </div>
            <Notice tone="amber">
              Accuracy policy: no degrees, certifications, employers, dates, testimonials or metrics
              are published here. Capability statements describe work actually performed; hardware
              topics are marked as interests, not qualifications.
            </Notice>
          </aside>
        </div>

        <Section label="TIMELINE" title="Experience, in order" className="mt-12">
          <div className="space-y-3">
            {profile.timeline.map((entry, i) => (
              <div key={entry.id} className="border border-line bg-black/20 p-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-mono text-[10px] text-accent/80">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-display text-[18px] uppercase tracking-[0.06em] text-ink">
                    {entry.title}
                  </h3>
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
                    {entry.era} · {entry.marker}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">{entry.body}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="PILLARS" title="Engineering philosophy" className="mt-12">
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.philosophyPoints.map((p) => (
              <div key={p.title} className="border-l border-line-2 pl-3">
                <h3 className="font-display text-[16px] uppercase tracking-[0.06em] text-ink">{p.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section label="INTERESTS" title="Technical experimentation" className="mt-12">
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.interests.map((interest) => (
              <div key={interest.id} className="border border-line bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-[16px] uppercase tracking-[0.06em] text-ink">
                    {interest.title}
                  </h3>
                  <Chip tone="amber">{CONFIDENCE_LABEL[interest.confidence]}</Chip>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">{interest.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section label="NEXT" title="Learning objectives" className="mt-12">
          <div className="space-y-2">
            {profile.learning.map((item) => (
              <div key={item.id} className="border border-line bg-black/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-[15px] uppercase tracking-[0.06em] text-ink">
                    {item.title}
                  </h3>
                  <Chip tone="muted">{item.horizon}</Chip>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{item.body}</p>
              </div>
            ))}
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
