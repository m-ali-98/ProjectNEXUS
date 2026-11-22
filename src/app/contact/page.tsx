import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { profile } from "@/content/profile";
import { ContactForm } from "@/components/interface/ContactForm";
import { Notice } from "@/components/interface/Primitives";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact channel for Mohammad Ali Ashnavar — software engineering roles, application development, systems integration and infrastructure work.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />
      <main className="mx-auto max-w-[920px] px-5 py-12">
        <div className="nx-label text-accent/90">Sector 06 · Contact channel</div>
        <h1 className="mt-2 font-display text-[clamp(30px,5vw,46px)] font-semibold uppercase leading-none tracking-[0.08em] text-ink">
          Contact
        </h1>
        <p className="mt-3 max-w-[660px] text-[14px] leading-relaxed text-ink-dim">
          {profile.availability.note} Messages are validated and rate-limited server-side. Delivery
          becomes active once the deployment provides mail transport credentials.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="nx-hud-panel p-5">
            <div className="nx-label mb-3">Direct transmission</div>
            <ContactForm compact />
          </div>
          <aside className="space-y-3">
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-1.5">Role</div>
              <p className="font-display text-[17px] uppercase tracking-[0.06em] text-ink">
                {profile.title}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-ink-faint">
                {profile.specialisation}
              </p>
            </div>
            <Notice tone="amber">
              Email, GitHub and LinkedIn values are placeholders until the owner verifies them. Set
              them with NEXT_PUBLIC_CONTACT_EMAIL, NEXT_PUBLIC_GITHUB_URL and NEXT_PUBLIC_LINKEDIN_URL.
            </Notice>
            <div className="nx-hud-panel p-4">
              <div className="nx-label mb-1.5">Prefer the facility?</div>
              <p className="text-[11.5px] leading-relaxed text-ink-dim">
                The contact terminal is in Personal Quarters, sector 06.
              </p>
              <Link href="/" className="nx-btn mt-2 w-full">
                Enter facility
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
