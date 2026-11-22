import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-[720px] flex-col justify-center px-5 py-16">
        <div className="nx-label text-accent/80">SIGNAL LOST / 404</div>
        <h1 className="mt-2 font-display text-[clamp(32px,6vw,56px)] font-semibold uppercase leading-none tracking-[0.1em] text-ink">
          Sector not found
        </h1>
        <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-ink-dim">
          The requested path does not exist in this facility. Return to the atrium or open the
          conventional portfolio.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/" className="nx-btn nx-btn-primary">
            Enter facility
          </Link>
          <Link href="/portfolio" className="nx-btn">
            Portfolio
          </Link>
          <Link href="/projects" className="nx-btn">
            Projects
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
