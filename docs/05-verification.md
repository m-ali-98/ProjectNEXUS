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

### `scripts/validate-character.ts` (not part of `verify`)

Replays the character's forward kinematics over idle, walk, run and sprint cycles and
asserts the footwear actually plants: no sole sinks more than 2 cm below the floor, the
swing foot clears it, and the crown height matches `characterData.ts`. It then walks the
real rig geometry (the same meshes the renderer mounts) and checks that every vertex is
finite and inside its joint's bounds, that the two sides are mirrored within 2 mm, and that
the stiletto tip reaches y = 0.

`scripts/preview-character.ts` is the visual counterpart: it rasterises the same rig with a
software renderer into `preview/*.png`, which is how the model is inspected in an
environment with no GPU.

```bash
npx tsx scripts/validate-character.ts
```

Current result: errors 0 — deepest sole −0.017 m (sprint), swing clearance 0.436 m,
crown 1.756 m, 57 rig parts / 23 803 vertices all finite, stiletto tip at 0.000 m.

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
