import Link from "next/link";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { sectors } from "@/content/sectors";

/**
 * Graceful degradation: no WebGL means no facility, but never no portfolio.
 */
export function WebGLFallback() {
  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-void nx-scroll">
      <div className="nx-grid-bg absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-[900px] px-6 py-16">
        <div className="nx-hud-panel nx-corner p-6">
          <div className="nx-label text-amber">Facility unavailable — WebGL disabled</div>
          <h1 className="mt-2 font-display text-[34px] font-semibold uppercase tracking-[0.12em] text-ink">
            NEXUS
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            interactive engineering environment
          </p>
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-dim">
            This browser or device could not start the 3D facility. Every piece of professional
            information in NEXUS remains available as conventional, accessible pages.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/portfolio" className="nx-btn nx-btn-primary">
              Conventional portfolio
            </Link>
            <Link href="/projects" className="nx-btn">
              Projects
            </Link>
            <Link href="/about" className="nx-btn">
              About
            </Link>
            <Link href="/contact" className="nx-btn">
              Contact
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="nx-hud-panel p-4">
            <div className="nx-label mb-1">Profile</div>
            <div className="font-display text-[18px] uppercase tracking-[0.08em] text-ink">
              {profile.name}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              {profile.specialisation}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-dim">{profile.summary}</p>
          </div>
          <div className="nx-hud-panel p-4">
            <div className="nx-label mb-2">Missions</div>
            <ul className="space-y-1.5">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id === "mission-001" ? "khuzestan-yeast" : p.id === "mission-002" ? "react-native-chat" : p.id === "mission-003" ? "infrastructure" : "business-automation"}`}
                    className="flex items-baseline gap-2 text-[12px] text-ink-dim hover:text-accent"
                  >
                    <span className="font-mono text-[9px] text-accent/70">{p.missionNo}</span>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 nx-hud-panel p-4">
          <div className="nx-label mb-2">Sectors in the full experience</div>
          <div className="flex flex-wrap gap-1.5">
            {sectors.map((s) => (
              <span
                key={s.id}
                className="border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint"
              >
                {s.number} · {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
