import type { Metadata } from "next";
import Link from "next/link";
import { GameShell } from "@/components/GameShell";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { sectors } from "@/content/sectors";

export const metadata: Metadata = {
  title: "NEXUS — Interactive Engineering Environment",
  description:
    "Enter NEXUS: a fully explorable 3D engineering facility built as the portfolio of Mohammad Ali Ashnavar — application development, systems integration and production infrastructure.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <GameShell />

      {/* Accessible / indexable equivalent of the facility. Reachable with the
          "Skip to text version" link; becomes a readable page when targeted. */}
      <main id="accessible-content" className="sr-only nx-a11y-route">
        <h1>NEXUS — Mohammad Ali Ashnavar, Software Engineer</h1>
        <p>
          NEXUS is an interactive 3D engineering portfolio. This is the accessible text version of the
          facility. Every professional detail is also available on the conventional pages linked below.
        </p>
        <p>
          <a href="#facility">Return to the 3D facility</a>
        </p>
        <p>{profile.summary}</p>
        <nav aria-label="Portfolio pages">
          <ul>
            <li>
              <Link href="/portfolio">Conventional portfolio</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/expertise">Expertise</Link>
            </li>
            <li>
              <Link href="/projects">Projects</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
        <h2>Facility sectors</h2>
        <ul>
          {sectors.map((sector) => (
            <li key={sector.id}>
              <h3>
                Sector {sector.number} — {sector.name}
              </h3>
              <p>{sector.summary}</p>
            </li>
          ))}
        </ul>
        <h2>Engineering missions</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <h3>
                Mission {project.missionNo} — {project.title}
              </h3>
              <p>{project.summary}</p>
            </li>
          ))}
        </ul>
        <p>Engineering philosophy: “{profile.philosophy}”</p>
      </main>
    </>
  );
}
