import Link from "next/link";

const NAV = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/expertise", label: "Expertise" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3">
        <Link href="/portfolio" className="group flex items-baseline gap-2.5">
          <span className="font-display text-[22px] font-semibold uppercase tracking-[0.3em] text-ink transition group-hover:text-accent">
            NEXUS
          </span>
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.24em] text-ink-faint sm:inline">
            interactive engineering environment
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim transition hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="nx-btn px-2.5 py-1 text-[9px]"
            title="Enter the 3D facility"
          >
            Enter 3D
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line/70 bg-abyss/60">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 sm:grid-cols-3">
        <div>
          <div className="font-display text-[18px] font-semibold uppercase tracking-[0.26em] text-ink">
            NEXUS
          </div>
          <p className="mt-2 max-w-[320px] text-[12px] leading-relaxed text-ink-faint">
            An explorable engineering environment. The 3D facility and these pages present the same
            professional information — nothing is exclusive to the game layer.
          </p>
        </div>
        <div>
          <div className="nx-label mb-2">Navigate</div>
          <ul className="space-y-1.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[12px] text-ink-dim transition hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="nx-label mb-2">Status</div>
          <p className="text-[12px] leading-relaxed text-ink-faint">
            Contact details are editable placeholders until verified. The contact form is fully
            functional but reports clearly when mail transport is not configured.
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
            Built with Next.js · React Three Fiber · TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
}
