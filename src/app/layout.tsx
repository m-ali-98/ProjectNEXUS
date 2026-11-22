import type { Metadata, Viewport } from "next";
import "./globals.css";
import { profile } from "@/content/profile";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NEXUS — Mohammad Ali Ashnavar · Software Engineer",
    template: "%s · NEXUS",
  },
  description:
    "NEXUS is an explorable 3D engineering portfolio for Mohammad Ali Ashnavar — software engineer working across application development, systems integration and production infrastructure.",
  keywords: [
    "Mohammad Ali Ashnavar",
    "software engineer",
    "portfolio",
    "React Native",
    "TypeScript",
    "systems integration",
    "infrastructure",
    "Nginx",
    "Node.js",
    "NEXUS",
  ],
  authors: [{ name: profile.name }],
  creator: profile.name,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "NEXUS",
    title: "NEXUS — Interactive Engineering Environment",
    description:
      "An explorable 3D facility representing software engineering work: application development, systems integration and infrastructure.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXUS — Interactive Engineering Environment",
    description:
      "An explorable 3D engineering portfolio: application development, systems integration, production infrastructure.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#04060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.title,
  description: profile.summary,
  knowsAbout: [
    "JavaScript",
    "TypeScript",
    "React",
    "React Native",
    "Redux",
    "API integration",
    "Nginx",
    "Linux",
    "DNS",
    "SSL/TLS",
    "Node.js",
  ],
  url: siteUrl,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-motion="full">
      <body className="min-h-screen bg-void text-ink antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
