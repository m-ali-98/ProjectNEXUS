# Verification

The facility is checked without a browser. Five harnesses run in Node against the real
application code — no mocks of the store, content, collision solver or cinematics.

```bash
npm run verify          # all five
npm run verify:world
npm run verify:connectivity
npm run verify:session
npm run verify:render
npm run verify:ui
```

`verify:render` and `verify:ui` need `jsdom` and `@react-three/test-renderer`, both
listed in `devDependencies`, and pass `--tsconfig scripts/tsconfig.smoke.json` so JSX
compiles outside Next.

## What each harness proves

### `scripts/validate-world.ts` (`verify:world`)

| Check | Failure it catches |
| --- | --- |
| Every sector spawn point is free of collision geometry | A player materialising inside a wall |
| Every interaction has a standing position within its radius (16 directions × 3 distances) | Exhibits that cannot be approached — i.e. a panel that can never open |
| Non-portal interactions are ≥ 1.2 m apart | Two labels fighting for one raycast |
| Every panel payload id resolves (`project`, `systemNode`, `pipeline`, `infraTerminal`, `labStation`, `dnsRecord`, `mailAuth`, `discovery`) | A panel that opens empty because content was renamed |
| Room centres do not overlap | Interpenetrating rooms |
| Each exhibit's inspection camera pose is outside geometry and at head height | Panels that open with the camera inside a wall or a console |

Current result: 7/7 spawns clear, 76/76 interactions reachable, 51/51 exhibit poses clear
(4 needed the automatic pull-back), 0 warnings, 0 errors.

### `scripts/validate-connectivity.ts` (`verify:connectivity`)

Flood-fills the walkable floor at 0.4 m resolution using the exact
`resolveCollisions` implementation the player uses, with bulkheads open, then:

- asserts each sector spawn and ≥ 90 % of its open floor is reachable,
- re-floods with bulkheads closed and asserts the sealed area is smaller.

Current result: 37 928 walkable cells with doors open, 7 736 sealed, every sector 100 %
reachable. This is the formal proof that the seven sectors are one connected facility
rather than six separate scenes.

### `scripts/simulate-session.ts` (`verify:session`)

Drives `activateInteraction(id, camera)` for **all 76 registered interactions** and
asserts the resulting state:

- 51 panels open, pause the world, and close cleanly,
- 12 travel interactions do not open panels,
- the map action opens the map,
- each of the 5 discoverable exhibits is recorded exactly once and every recorded id
  exists in `content/discoveries.ts`,
- `travelToSector` / `returnToAtrium` move the player, clear `transitioning`, reset
  `fade` and drop the stale transition label,
- the audio engine is inert (no throw) without a Web Audio context.

### `scripts/smoke-render.mts` (`verify:render`)

Mounts each sector component and the corridor shell through
`@react-three/test-renderer` in jsdom and advances frames. This catches JSX mistakes that
TypeScript cannot see: bad geometry args, invalid material props, undefined refs, hooks
used outside a canvas, and text that would trigger a font fetch.

The case list also mounts `Character` (the third-person protagonist rig) on its own, so a
broken joint, material or shoe profile fails here rather than in the browser.

Current result: ~2 300 meshes across the seven rooms, the corridors and the character
mount without a single error.

It also verified the glyph policy: before `Text3D` sanitising was added, in-world labels
containing `—` or `→` made troika request a fallback font from `cdn.jsdelivr.net`; after
it, no external font request occurs.

### `scripts/smoke-ui.mts` (`verify:ui`)

Client-renders (jsdom + `createRoot`) every overlay and every panel payload against a
real store state, checking both that it renders and that key content is present:
25 panel states, boot/intro overlay, facility map, pause menu, transition overlay with a
live label, sector banner, toast, tour caption, mobile controls and the WebGL fallback.
34 assertions, all passing.

### `scripts/validate-character.ts`

The protagonist is an imported skinned asset rather than generated geometry, so the checks
moved with it. The validator loads the shipped GLB through the same loader the app uses and
asserts:

- the file exists, is under the 4 MB budget and ships with its CC0 licence text;
- the mesh is inside the 80 000-triangle budget, the skeleton has the expected bones and
  both `walk` and `run` clips are present;
- **foot contact**: stepping each clip in 12 increments, the lowest skinned vertex stays
  within 20 mm of the floor and never more than 30 mm above it once the per-clip grounding
  offset the game applies is included, and the crown stays near 1.68 m;
- **suit paint**: the per-vertex mask covers 45–80 % of the mesh (i.e. the suit is painted,
  the head is not);
- **shader injection**: the material's `onBeforeCompile` is run against three's real
  `ShaderLib.physical` source and every expected injection is present, with balanced
  braces. A silently missed replacement would ship an unpainted character, so this is
  checked rather than assumed.

`scripts/preview-model.ts` is the visual counterpart: it loads the GLB in jsdom, skins it
in software, applies the same suit paint and rasterises front / back / side / face views to
`preview-model/*.png` — how the model is reviewed in an environment with no GPU. Its
`--scan` mode walks a clip and prints sole and crown heights, which is where the grounding
offsets come from.

```bash
npx tsx scripts/validate-character.ts
npx tsx scripts/preview-model.ts --anim walk --time 0.3
npx tsx scripts/preview-model.ts --scan --anim run
```

Current result: errors 0 — 2.71 MB, 60 000 triangles, 24 bones, `run` + `walk` clips,
sole 0.000 / −0.003 / −0.002 m and crowns 1.69 / 1.69 / 1.66 m for idle / walk / run, suit
covering 63 % of the mesh, shader injections all present.

## What is not automated

| Gap | Why | How to check manually |
| --- | --- | --- |
| Visual appearance | No GPU/browser in the build environment | `npm run dev`, walk the atrium, compare against the design tokens and check the third-person framing |
| Character fidelity | Subjective beyond the grounding assertions | `npm run dev`: idle, walk and sprint her through the atrium; check hands, face and heels up close in a panel shot |
| Pointer lock, mouse feel | Requires a real input device | Chrome/Firefox: click to engage, `Esc` releases |
| Frame rate | Hardware dependent | Open Settings → Quality, try all three profiles |
| Touch controls | Requires a touch device or emulation | DevTools device mode |
| Mail delivery | Needs provider credentials | Set the Resend variables, `GET /api/contact` should report `configured: true` |
| Screen reader output | Requires assistive tech | Tab to "Skip to text version", confirm the plain-text page appears |

## CI suggestion

```yaml
name: verify
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run verify
      - run: npm run build
```

## Known environment limits found during verification

- `window.matchMedia`, `XMLHttpRequest` and `document.pointerLockElement` must be
  stubbed in Node; the harness does this in `scripts/smoke-*.mts`.
- `@sparticuz/chromium` could not run in the build sandbox (missing `libnspr4`/`libnss3`),
  so no real-browser automation is included. The harnesses above are the substitute and
  are the reason the world, interactions and panels are verified rather than assumed.
