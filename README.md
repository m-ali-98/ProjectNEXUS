# NEXUS — Interactive Engineering Environment

A game-grade, fully explorable 3D portfolio for **Mohammad Ali Ashnavar**
(Software Engineer · Application Development · Systems Integration · IT Infrastructure),
built as a real production website rather than a demo reel.

You arrive in a six-sided central atrium with an identity hologram, then walk — real
first-person movement, real collision, real doors — through six connected sectors:

| Sector | What is inside |
| --- | --- |
| **00 Central Atrium** | Identity core, profile hologram, six entrances, mission shortcuts |
| **01 Application Lab** | React/React Native workbenches, live chat-client reconstruction |
| **02 Systems Core** | Interactive node graph: select a node, its edges light up, data flows |
| **03 Infrastructure** | End-to-end deployment pipeline from DNS to runtime, selectable stages |
| **04 Network Operations** | DNS record console, mail authentication, TLS and proxy routing |
| **05 Project Archive** | Four physical mission exhibits with briefing tables |
| **06 Personal Quarters** | Biography, philosophy, interests, learning objectives, contact terminal |

Everything you can read in 3D is also a real, indexable page. The intro is skippable, the
facility never traps you, and no information exists only inside the canvas.

## Quick start

```bash
npm ci
npm run dev     # http://localhost:3000
```

Node 20.9+ and a WebGL 2 browser. No environment variables are required to run; the
contact form validates and rate-limits without credentials and reports honestly that
delivery is not configured.

```bash
npm run build && npm start     # production
npm run typecheck && npm run lint
npm run verify                 # spatial, gameplay, render and UI verification
```

Full instructions: [docs/01-setup.md](docs/01-setup.md).

## Controls

| Input | Action |
| --- | --- |
| Click | Engage pointer lock |
| `W A S D` | Move · `Shift` sprint |
| Mouse | Look |
| `E` | Interact with the focused object |
| `M` | Facility map / fast travel |
| `Esc` | Pause (Resume · Map · Tour · Settings · Profile · Projects · Contact · Exit) |
| `H` | Controls & accessibility |
| `F` | Fullscreen · `Q` cycle quality profile |

On touch devices a thumb-stick and action buttons replace pointer lock.

## What makes it a facility, not a menu

- **One connected volume.** Hexagonal atrium (17 m apothem) → six 5.4 m corridors →
  six 36 × 26 m rooms at 44 m radius. Doors are physical bulkheads that animate.
- **Analytic collision.** Wall segments, doorway gates and furniture boxes resolved
  without a physics engine; gravity, step detection, wall sliding, sprint.
- **Verified connectivity.** A flood fill over the real collision solver proves all seven
  sectors are reachable (100 % of each room's open floor) — see
  [docs/05-verification.md](docs/05-verification.md).
- **76 registered interactions**, each with a focus verb, raycast radius, camera framing
  and a content-bound panel. Nothing opens an empty panel: the verifier checks every id.
- **Sector streaming.** Rooms mount within 62 m and unmount beyond it, so the scene graph
  and GPU budget stay small.
- **Quality profiles** (ULTRA / HIGH / PERFORMANCE) drive every renderer knob from one
  table, with first-run detection and a persisted choice.

## Routes

`/` (facility) · `/portfolio` · `/about` · `/expertise` · `/projects` ·
`/projects/khuzestan-yeast` · `/projects/react-native-chat` ·
`/projects/infrastructure` · `/projects/business-automation` · `/contact`

Plus `sitemap.xml`, `robots.txt`, Person + CreativeWork JSON-LD, Open Graph metadata and a
WebGL-unavailable fallback that keeps every link and every fact reachable.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
three.js + React Three Fiber + Drei + postprocessing · GSAP + Framer Motion · Zustand ·
Zod. All textures, materials, geometry, HUD chrome and audio are generated in the
project — no third-party art, no CDN font fetches, no autoplaying sound.

## Documentation

| Document | Contents |
| --- | --- |
| [01 — Setup](docs/01-setup.md) | Requirements, commands, environment variables, API contract |
| [02 — Architecture](docs/02-architecture.md) | Routes, modules, world geometry, camera contract, state, quality, accessibility |
| [03 — Asset pipeline](docs/03-assets.md) | What ships procedurally, how to add Blender/KTX2/Draco assets, honest backlog |
| [04 — Deployment](docs/04-deployment.md) | Vercel, Node, Nginx + TLS + DNS, Docker, headers, post-deploy checks |
| [05 — Verification](docs/05-verification.md) | The five harnesses, what they prove, what is not automated |
| [06 — Content guide](docs/06-content-guide.md) | Editing content, accuracy rules, adding missions/skills |

## Accuracy policy

This portfolio documents engineering work without inflating it:

- Capabilities are labelled **professional**, **working**, **familiar** or **learning**.
- Hardware, benchmarking and memory tuning are presented as technical interests and
  experimentation — not as a professional qualification.
- Missions carry explicit caveats; illustrative diagrams and interface reconstructions
  are labelled as such. No screenshot implies access to a client's internal systems.
- Infrastructure examples use `.test` domains and RFC 5737 documentation addresses only.
- Contact details are placeholders until the owner verifies them, and the form says so.
- AI-assisted development is never presented as a replacement for engineering judgement.

## Licence and credits

Application code: © Mohammad Ali Ashnavar. Fonts: Rajdhani and IBM Plex Mono via
Fontsource under the SIL Open Font License. Three.js, React Three Fiber, Drei,
postprocessing, Next.js, GSAP, Framer Motion, Zustand and Zod retain their own licences.
No copyrighted game environments, characters, assets, UI or audio were reproduced; all
geometry, textures, HUD design and sound are original to this project.
