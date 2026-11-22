import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { projects, slugById, type Project } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects — engineering missions",
  description:
    "Engineering case studies: the Khuzestan Yeast multilingual corporate platform, a React Native chat application, production infrastructure on Linux/Nginx/Node.js, and business automation and notification systems.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />
      <main className="mx-auto max-w-[1120px] px-5 py-12">
        <div className="nx-label text-accent/90">Sector 05 · Evidence</div>
        <h1 className="mt-2 font-display text-[clamp(30px,5vw,48px)] font-semibold uppercase leading-none tracking-[0.08em] text-ink">
          Engineering missions
        </h1>
        <p className="mt-3 max-w-[740px] text-[14px] leading-relaxed text-ink-dim">
          Four missions, each documenting the architecture, decisions, challenges and honest
          limitations. Conceptual diagrams are labelled as such; nothing here is presented as a
          screenshot of internal infrastructure.
        </p>

        <div className="mt-8 space-y-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="relative overflow-hidden border border-line bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/80">
              MISSION {project.missionNo}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
              {project.code}
            </span>
          </div>
          <h2 className="mt-1 font-display text-[24px] font-semibold uppercase leading-tight tracking-[0.06em] text-ink">
            {project.title}
          </h2>
          <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">
            {project.organisation}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="border border-accent/40 bg-[#0b2027] px-2 py-[3px] font-mono text-[8.5px] uppercase tracking-[0.14em] text-accent">
            {project.classification.split("—")[0]}
          </span>
          <span className="border border-line px-2 py-[3px] font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-faint">
            {project.status}
          </span>
        </div>
      </div>

      <p className="mt-3 max-w-[820px] text-[13.5px] leading-relaxed text-ink-dim">{project.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.technologies.slice(0, 12).map((tech) => (
          <span
            key={tech}
            className="border border-line bg-black/30 px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/projects/${slugById[project.id]}`} className="nx-btn nx-btn-primary">
          Open case study
        </Link>
        {project.url && (
          <a href={project.url} target="_blank" rel="noreferrer" className="nx-btn">
            Live site ↗
          </a>
        )}
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
          {project.architecture.length} architecture stages · {project.challenges.length} decisions
        </span>
      </div>
    </article>
  );
}
