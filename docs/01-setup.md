# Setup

NEXUS is a Next.js 15 application. It has one interactive route (`/`) that renders a
WebGL facility, plus a set of conventional, fully indexable pages that carry the same
content.

## Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.9+ (developed on 22.22) | Next 15 requires Node ≥ 18.18; 20+ recommended |
| npm | 10+ | `package-lock.json` is committed |
| A WebGL 2 browser | current Chrome / Edge / Firefox / Safari | WebGL 1 works with reduced post-processing |

No native build tools are required: every dependency is pure JavaScript.

## Install

```bash
git clone <repository> ProjectNEXUS
cd ProjectNEXUS
npm ci          # or: npm install
cp .env.example .env.local
npm run dev     # http://localhost:3000
```

The site runs without any environment variables. Contact delivery is the only feature
that needs secrets, and the form states clearly when transport is not configured.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with fast refresh on `:3000` |
| `npm run build` | Production build (all pages prerendered, `/api/contact` dynamic) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`eslint-config-next` + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | Spatial + gameplay + render + UI verification (see [05-verification](05-verification.md)) |
| `npm run verify:world` | Sector spawns, interaction reachability, panel payload integrity |
| `npm run verify:connectivity` | Flood-fills the floor to prove all sectors are walkable |
| `npm run verify:session` | Drives every interaction through the real store/cinematics code |
| `npm run verify:render` | Mounts every sector through `@react-three/test-renderer` (no GPU) |
| `npm run verify:ui` | Client-renders every overlay and all 25 panel payloads in jsdom |

## Environment variables

All variables are optional for local development.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | build + client | Canonical origin for metadata, Open Graph, `sitemap.xml`, `robots.txt`. Set this in production. |
| `RESEND_API_KEY` | server only | Resend API key used by `POST /api/contact`. Never exposed to the browser. |
| `CONTACT_TO_EMAIL` | server only | Inbox that receives contact messages. |
| `CONTACT_FROM_EMAIL` | server only | Verified sender. Defaults to `NEXUS Contact <onboarding@resend.dev>`. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | client | Public contact address (placeholder until the owner verifies one). |
| `NEXT_PUBLIC_GITHUB_URL` | client | GitHub profile URL. |
| `NEXT_PUBLIC_LINKEDIN_URL` | client | LinkedIn profile URL. |

Behaviour by configuration state:

| State | `POST /api/contact` response |
| --- | --- |
| No `RESEND_API_KEY` / `CONTACT_TO_EMAIL` | `503 { code: "not_configured" }` — validated, nothing sent, message tells the visitor to use a listed channel |
| Configured, provider accepts | `200 { ok: true }` |
| Provider rejects | `502 { code: "delivery_failed" }` |
| Malformed input | `422 { code: "validation_failed", fields }` |
| More than 4 messages / 10 min / IP | `429 { code: "rate_limited" }` |
| Honeypot field filled | `200 { ok: true }` — silently discarded |

`GET /api/contact` returns `{ configured: boolean }` for uptime checks.

## Environment notes

- Node 22's `fetch`, `AbortSignal` and `Response` are used server-side; no polyfills.
- The app never reads secrets on the client. `NEXT_PUBLIC_*` values are inlined at build time.
- Session state (intro seen, discoveries, settings) lives in `sessionStorage` /
  `localStorage` behind `try/catch`, so private browsing modes degrade quietly.
