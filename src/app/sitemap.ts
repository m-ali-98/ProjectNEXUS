import type { MetadataRoute } from "next";
import { slugById } from "@/content/projects";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/portfolio", "/about", "/expertise", "/projects", "/contact"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" || path === "/portfolio" ? 1 : 0.8,
  }));

  const projects = Object.entries(slugById).map(([, slug]) => ({
    url: `${base}/projects/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...routes, ...projects];
}
