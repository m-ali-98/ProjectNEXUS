# Content guide

Everything a visitor reads comes from `src/content/*`. Editing those modules changes the
3D facility and the conventional pages at the same time — there is no second copy in JSX.

## Modules

| Module | Shapes | Used by |
| --- | --- | --- |
| `profile.ts` | identity, positioning, philosophy, timeline, interests, learning, availability, `CONFIDENCE_LABEL` | Atrium identity panel, About, Contact, Personal Quarters |
| `expertise.ts` | `skillGroups[] → skills[]` with confidence + link to related missions | Expertise page, Application Lab, Systems Core |
| `projects.ts` | missions, briefing, architecture stages, responsibilities, challenges, outcomes, caveats, media disclaimers, `slugById` | Project Archive, mission panels, `/projects` |
| `systems.ts` | node graph nodes/edges for the Systems Core | Systems Core, architecture panel |
| `infrastructure.ts` | deployment pipeline stages + ops terminals | Infrastructure room |
| `network.ts` | DNS record types, mail auth, TLS steps, proxy routes, disclaimers | Network Operations |
| `lab.ts` | application-lab stations | Application Lab |
| `discoveries.ts` | optional findings and where they live | HUD counter, discovery panels |
| `sectors.ts` | sector identity: number, code, name, summary, subtitle, classification, tags, accent | map, HUD, banners, sector pages |

## Rules enforced by review

1. **No invented credibility.** No degree, certification, employer, job title, testimonial,
   revenue or performance figure that the owner cannot evidence. `Confidence` labels
   (`professional` / `working` / `familiar` / `learning`) carry this distinction into the
   UI instead of marketing adjectives.
2. **Hardware practice is interest, not qualification.** Memory tuning and benchmarking
   are described as experimentation throughout `profile.ts`.
3. **AI assistance never replaces engineering judgement.** Copy describes decisions,
   debugging and trade-offs; it never implies generated code was shipped unread.
4. **Mission caveats stay visible.** Every project carries `caveats[]`; the case-study page
   renders them under "What is not claimed".
5. **Reconstructions are labelled.** `media[].disclaimer` marks illustrative diagrams and
   mock interfaces. No screenshot implies access to a client's internal systems.
6. **No live infrastructure data.** `network.ts` and `infrastructure.ts` only use `.test`
   domains, RFC 5737 documentation addresses, and placeholder hostnames.
7. **Contact details are placeholders until verified.** `profile.ts` keeps `verified: false`
   and the contact page states that the channel is not live. Point the `NEXT_PUBLIC_*`
   variables at real profiles when the owner approves them.

## Adding a mission

1. Append a record to `projects` in `src/content/projects.ts` (id `mission-00N`, unique
   `code`, `missionNo`, `slug` mapping in `slugById` and `projectBySlug`).
2. Add the exhibit label/interaction in `src/world/interactions/registry.ts`
   (`panel: { kind: "project", id: "mission-00N" }`) near the archive wall.
3. If the exhibit is a physical monolith, add it to `sectorProps` in
   `src/world/sectorData.ts` (`variant: "mission-00N"`).
4. Run `npm run verify` — the payload check fails loudly if the panel cannot resolve.

## Adding a skill group or skill

Append to `skillGroups` in `src/content/expertise.ts`. `confidence` is required; the
Expertise page colours it, and `relatedProjects` renders mission links. Nothing else
needs to change — the Application Lab and Systems Core read the same array.

## Adding a sector (rare)

The facility is built around six perimeter rooms plus the atrium. Adding a seventh room
requires geometry (a new angle and corridor), `sectors.ts`, `SECTOR_ANGLES`, a room
component, a room entry in the `sectorPlacements` table and registry entries. The
connectivity harness will tell you immediately whether the new room is actually walkable.

## Copy conventions

- Sentence case in prose, UPPERCASE for machine labels (they are rendered in the display
  font with wide tracking).
- ASCII punctuation in 3D text: `Text3D.sanitizeGlyphs()` converts typographic characters,
  but content is cleaner if you avoid them.
- Keep summaries under ~180 characters so they fit HUD panels and meta descriptions.
