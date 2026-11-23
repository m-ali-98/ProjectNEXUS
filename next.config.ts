import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The live-preview pane proxies this dev server from *.e2b.app, so its
  // /_next/* requests arrive cross-origin; declare that origin explicitly.
  allowedDevOrigins: ["*.e2b.app"],
  experimental: {
    optimizePackageImports: ["@react-three/drei", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Deliberately no X-Frame-Options / frame-ancestors: the facility is
          // meant to be embeddable (portfolios, case-study pages, preview panes).
          // Add a frame-ancestors CSP at the edge if a deployment needs it.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/fonts/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
