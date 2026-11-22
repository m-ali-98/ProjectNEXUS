# Architecture

## Route map

| Route | Rendering | Role |
| --- | --- | --- |
| `/` | static shell + client world | The facility. Server HTML ships a `sr-only` indexable version of the content |
| `/portfolio` | static | One-page conventional portfolio (the "Exit to conventional portfolio" target) |
| `/about` | static | Biography, timeline, philosophy, honesty statements |
| `/expertise` | static | Capability map grouped by system layer, with confidence labels |
| `/projects` | static | Mission index |
| `/projects/[slug]` | static (4 params) | Case study: briefing, architecture, responsibilities, challenges, limits |
| `/contact` | static | Contact page with the real form |
| `/api/contact` | dynamic | Validation, honeypot, rate limit, mail transport |
| `/sitemap.xml`, `/robots.txt` | static | Generated from `src/content/projects.ts` and `NEXT_PUBLIC_SITE_URL` |
| `/icon.svg` | static | Facility mark |

Every professional fact is reachable without WebGL, without JavaScript-driven 3D, and
without a pointer device.

## Directory structure

```
src/
  app/                  routes, metadata, sitemap, robots, contact API
  components/
    GameShell.tsx       mounts the canvas + every overlay, owns WebGL detection
    hud/Hud.tsx         reticle, prompts, sector identity, controls, hotkeys
    overlays/           boot/intro, panels, facility map, pause/settings, toasts
    interface/          shared UI primitives, contact form, chat reconstruction
    site/              header/footer for the conventional pages
  content/              single source of truth for every sentence shown anywhere
  lib/                  quality profiles, progress maths
  stores/nexusStore.ts  the single Zustand store
  world/
    worldLayout.ts      geometry constants, colliders, collision solver, transforms
    WorldCanvas.tsx     <Canvas> configuration (camera, dpr, shadows, gl flags)
    WorldManager.tsx    scene graph, IBL, atmosphere, sector streaming, systems
    environment/        procedural textures/materials, architecture, fixtures, effects
    sectors/            7 room components + shared room shell + holographic core
    player/             pointer lock, player state, third-person controller
    character/          protagonist: GLB asset adapter (suit shader, clips, grounding), Character
    camera/             thirdPerson boom, shot director, cinematics, intro camera
    interactions/       interaction registry, focus raycasts, in-world markers
    effects/PostFX.tsx  quality-gated SSAO/bloom/grade/aberration/vignette/grain
    audio/audioEngine.ts procedural Web Audio buses
```

## Content is data, never markup

`src/content/*` holds typed records: `profile`, `expertise`, `projects`, `systems`,
`infrastructure`, `network`, `lab`, `discoveries`, `sectors`. Both the 3D facility and
the conventional pages read from these modules, so a fact can never drift between the
two. In-world objects store an **id** (`panel: { kind: "project", id: "mission-001" }`)
and resolve their labels/payloads at render time — no duplicated copy in JSX.

`src/world/interactions/registry.ts` is the bridge: each interactive object declares

```ts
{ id, sector, position, radius, kind, label, verb, panel?, action?, discoveryId? }
```

Panels are a discriminated union (`PanelState`) rendered by `PanelHost`, which also
calls `focusOnInteraction` so the camera frames the exhibit while reading.

## World geometry

The facility is one connected volume, not a menu of scenes.

```
ATRIUM.apothem 17 m, hexagonal, 18 m tall, 5.4 m doorway gaps
CORRIDOR      5.4 m wide × 14 m long × 4.6 m high
ROOM          36 × 26 m, 6.8 m ceiling
ROOM_DISTANCE 17 + 14 + 13 = 44 m from the atrium centre
```

- Sector angles: 0°, 60°, 120°, 180°, 240°, 300°; room rotation is `angle + 90°`, so a
  room's local **−z** wall faces the atrium doorway and local **+z** points back into
  the room.
- World position for angle *a* is `dir(a) = (cos a, 0, −sin a)`.
- `localToWorld(id, x, y, z)` / `frameFor(id)` are the only transform helpers; every
  sector, prop collider and interaction anchor uses them, which is why the geometry
  verifier can prove reachability.

### Collision

No physics engine is used. `resolveCollisions(position, radius, isPortalOpen)` resolves
against:

- analytic wall segments (with doorway gaps and closed-bulkhead gates),
- axis-aligned prop boxes generated from the same `sectorProps` table that positions the
  furniture,
- room and atrium boundaries.

The player controller applies acceleration/damping, gravity, floor snap and a sprint
multiplier, then calls the solver twice (X then Z) so sliding along walls feels correct.
`PLAYER.radius = 0.42`, eye height 1.68 m, walk 3.9 m/s, sprint 7.2 m/s.

### Streaming

`SectorStreamer` mounts a sector's component only while the player is inside 62 m of it
(polled every 0.4 s) with a small hysteresis margin. Sector components are therefore
pure: no timers, no store writes on mount. Distant rooms are unmounted, so their
geometry and materials are disposed by R3F.

## Camera contract

The game is third person: the camera rides a spring arm behind the protagonist and she is
the subject of every framing.

Three systems can touch the camera; the rule that keeps them stable:

- `director` owns the camera **only** while a shot is active (including `hold`).
- `IntroCamera` runs the arrival shot and releases on completion or on skip.
- `PlayerController` writes the camera every frame **unless** `director.active`: it takes
  the solved boom pose (or the player's eye while a panel is focused) and eases toward it.
- Opening a panel calls `focusOnInteraction`, which sets a holding shot; closing calls
  `closePanelAndResume`, which releases the camera and re-locks the pointer.

The boom is solved by `camera/thirdPerson.ts` (`thirdPersonPose`): pivot 1.5 m up and
0.32 m to her right, 3.25 m back, aimed 9 m along the view direction. A 12-step probe
against the real collider set shortens the arm (down to 0.85 m) and keeps 0.32 m of floor
clearance, so a wall behind her pulls the camera in instead of clipping through it.
Details and the reasoning behind the numbers: [07 — Character & camera](07-character.md).

`cameraRef` (in `world/camera/director.ts`) is the single handle non-React code uses to
reach the live `PerspectiveCamera`.

## Render pipeline

`WorldManager` sets the scene once (`fogExp2`, drei `Environment` IBL with lightformers,
ambient/hemisphere fill) and `WorldCanvas` configures the renderer: ACES filmic tone
mapping, sRGB output, PCF soft shadows, device-pixel-ratio range from the quality profile.
Geometry is PBR throughout — `MeshStandardMaterial` for architecture, `MeshPhysicalMaterial`
with clearcoat/sheen for the character — and every surface detail (floor grids, hex plates,
panel relief, concrete grain, fabric weave, skin pores) is generated as a canvas texture
or normal map at runtime. `PostFX` composes the post chain:

| Pass | ULTRA | HIGH | PERFORMANCE |
| --- | --- | --- | --- |
| SSAO (contact shadows) | ✓ 65 % res | — | — |
| Bloom (mipmap blur) | ✓ | ✓ | — |
| Saturation/contrast grade | ✓ | ✓ | — |
| Chromatic aberration | 0.0006 | 0.00028 | — |
| Vignette + grain | ✓ | ✓ | — |
| MSAA on composer target | 4× | 2× | — |
| Planar floor reflections | ✓ | — | — |

The composer is skipped entirely on PERFORMANCE, which renders straight to the canvas;
`AdaptiveResolution` still trims the DPR if the frame budget slips.

## State

One Zustand store (`src/stores/nexusStore.ts`), split into:

- session: `phase` (`boot | intro | ready`), `entered`, `sector`, `visited`, `discovered`,
  `examined`, `activated`
- presentation: `panel`, `overlay`, `paused`, `pointerLocked`, `transitioning`,
  `transitionLabel`, `fade`, `banner`, `toast`, `focused`
- tour: `tourActive`, `tourStep`
- settings (persisted, versioned): `quality`, `sensitivity`, `invertY`, `fov`, `motion`,
  `master`, `music`, `sfx`, `muted`
- flags: `audioArmed`, `webglFailed`

Progress (`visited`/`examined`) is session-only by design; settings persist in
localStorage under `nexus-settings-v1`.

## Quality profiles

`QUALITY_PROFILES` (ultra / high / performance) is the only place renderer knobs are
defined: DPR range, shadow map size, bloom intensity/threshold, reflections,
volumetric shafts, particle counts, dust motes, IBL resolution, anisotropy and per-room
light budget. `useQuality()` returns the active profile and every component reads from it;
there is no second source of truth. First visit auto-detects a profile from device
memory/cores/reduced-motion, then remembers the choice (`nexus-quality-set`).

Two systems consume that profile continuously:

- `LimitedLights` slices each room's point-light rig to `lightCount` (4 / 3 / 2), so the
  performance profile actually removes lights instead of only lowering quality flags.
- `AdaptiveResolution` samples the frame rate over 1.5 s windows and moves the renderer
  pixel ratio inside the profile's `dpr` range — down below 50 FPS, slowly back up above
  58 FPS. It is user-disableable in Settings. The canvas keeps its CSS size; only the
  drawing buffer changes.

## Audio

`audioEngine.ts` synthesises ambience and UI cues with Web Audio (no third-party
samples, nothing autoplays). The graph is created only after an explicit gesture
("Enter facility"), and exposes per-bus gain (master / music / sfx), mute and a
sector-aware ambience bed.

## Accessibility

- Intro is skippable at any moment, and is remembered for the session.
- `Skip to text version` (first focusable element) reveals the same content as a plain
  page via `:target` styling.
- Every panel is a labelled `dialog`, closable with Escape, restored focus to the
  triggering object.
- HUD hotkeys: `Esc` pause, `M` map, `H` help, `F` fullscreen, `Q` quality cycle.
- Reduced motion follows `prefers-reduced-motion` and a manual toggle, which also
  disables scanline/sweep animations and shortens camera moves.
- No information exists only inside the 3D scene.
- Panel framing never clips through geometry: `exhibitPose` slides the inspection camera
  back toward the player's eyes until it is clear, and the verifier asserts it for all 51
  exhibit panels.
