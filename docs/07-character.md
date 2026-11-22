# 07 — Character & camera

The protagonist is the one imported asset in the project. Everything else — the facility,
props, textures, HUD, audio — is generated in code; a believable human being is not
something procedural primitives deliver, and an earlier version built from lofted surfaces
and sculpted primitives proved it (details in "What was replaced" below).

| | |
| --- | --- |
| Asset | *Woman Base Mesh* by [Grab3D](https://grab3d.com), CC0 1.0 |
| Source | [harikishanbs88/woman-base-character](https://github.com/harikishanbs88/woman-base-character) |
| Shipped file | `public/models/protagonist.glb` — 60 000 triangles, 1K maps, 2.7 MB |
| Licence copy | `public/models/LICENSE-woman-base-mesh.txt` |
| Modules | `src/world/character/protagonist.ts` (asset adapter), `Character.tsx` (behaviour) |
| Tools | `scripts/preview-model.ts` (offline renderer), `scripts/validate-character.ts` (checks) |

## What the asset provides

A 24-bone humanoid rig (Hips, spine chain, neck/head, shoulders/arms/hands, legs/feet/toes)
with two clips, `walk` and `run`, and a single skinned mesh with a base-colour atlas,
normal map and packed metallic-roughness map. Height 1.68 m. The mesh is authored in
centimetre units under an armature scaled to 0.01, so the skinned result is already correct
in metres at scale 1 — the component applies no scale, only a half turn, because the asset
faces +Z and the engine's forward is −Z.

The shipped file is the same asset after `scripts/optimise-model.sh`:

```bash
gltf-transform weld        rigged.glb           welded.glb
gltf-transform simplify    welded.glb           simplified.glb --ratio 0.2 --error 0.001
gltf-transform resize      simplified.glb       resized.glb    --width 1024 --height 1024
gltf-transform prune       resized.glb          public/models/protagonist.glb
```

305 702 → 60 000 triangles, 4K → 1K maps, 13 MB → 2.7 MB. The rig, joint weights and both
clips pass through untouched.

## The flight suit

She ships in gym clothes, and importing a second outfit would double the download. Instead
the suit is painted inside the asset's own `MeshPhysicalMaterial` (`createSuitMaterial`):

- **Which vertices are suit** comes from a per-vertex mask: skin is whatever the head and
  neck bones drive. Raw scanned weights are noisy, so the mask is Laplacian-smoothed over
  the mesh graph before it is used, and the fragment shader fades between skin and suit
  across a wide range so the mask boundary has no triangle stair-step to show.
- **The collar is analytic** (`collarAt`): a cut across rest space at y ≈ 1.40 m, with a
  soft top edge and a small pull-back at the back of the neck so the nape hair stays hair.
  A mask boundary can only be resolved at vertices, so at the collar it follows long
  triangle edges; the analytic cut gives the suit a clean top edge and covers the seam of
  the scanned neckline underneath.
- **Everything else is analytic, in rest space** (`PAINT_GLSL`): shoulder yoke, glove and
  boot regions, a waist line, a boot welt and a chest badge with a recessed slot. These are
  evaluated per fragment from the interpolated rest position, so they are crisp at any
  distance and stay glued to the limbs as she animates.
- The scanned face, hair and cloth folds survive underneath, because the shader modulates
  the suit colour by the atlas's local luminance rather than discarding the map.

`suitTintAt`, `trimAt` and `collarAt` each have a TypeScript mirror in the same module, so
the offline renderer draws exactly what the shader draws — keep the pairs in step.

`validate-character.ts` runs the material's `onBeforeCompile` against three's real
`ShaderLib.physical` source and asserts every injection landed, with balanced braces. A
silently missed replacement would ship an unpainted character.

## Animation and grounding

Three actions run continuously on one `AnimationMixer`; the frame loop owns the weights, so
a blend never restarts a clip mid-stride:

| Action | Clip | Weight | Time scale |
| --- | --- | --- | --- |
| `idle` | first two frames of `walk`, 1 s loop | 1 → 0 as speed rises | ~0.5 |
| `walk` | `walk` | fades in below 3 m/s, out above 5.2 | `speed / 2.1`, clamped 0.65–2.1 |
| `run` | `run` | complementary | `speed / 5.0`, clamped 0.8–1.6 |

Weights are additionally smoothed at 9/s, and the mixer slows to 15 % while airborne with
the pose held just off idle, plus a small forward lean.

**Grounding.** Every clip floats the soles a little: measured over the full cycle, `walk`
sits 21–33 mm high and `run` bottoms out at 11 mm. The component applies a per-clip offset
(`PROTAGONIST.ground`, blended with the same weights as the clips) and the validator
re-measures the result, so feet stay on the floor without a runtime raycast.

A breathing offset is added to `Spine01` after the mixer writes the pose, and it is scaled
with the reduced-motion setting.

## Reviewing it without a GPU

`scripts/preview-model.ts` loads the GLB through three's `GLTFLoader` inside jsdom (image
decoding stubbed, geometry and clips intact), deforms it with `SkinnedMesh.getVertexPosition`,
applies the same suit paint, and rasterises front / back / side / face views with a small
software renderer:

```bash
npx tsx scripts/preview-model.ts --anim walk --time 0.3   # preview-model/*.png
npx tsx scripts/preview-model.ts --scan --anim run        # sole/crown per frame
```

This is how the model, the suit and the framing were iterated on with no browser available.
The scans are also where the grounding numbers come from.

## Camera contract

The third-person boom (`world/camera/thirdPerson.ts`) is unchanged by the swap to a real
asset: it orbits a pivot 1.5 m above the player's feet, offset 0.32 m toward the right
shoulder, aims 9 m ahead and slightly down so the character sits low-centre, and shortens
through 12 steps when world collision would put geometry between the camera and the
character. Pitch is clamped to −0.62…0.98 rad and the camera never drops below 0.32 m.

Because the character is 1.68 m with her feet at the player's origin, the boom framing,
the intro shot and the interaction probe all needed no changes.

## What was replaced

The first protagonist was built from lofted cross-sections and sculpted primitives: a
57-part rig, a hand-written pose solver, a `loftZ` shoe last with a stiletto heel, an iris
built from a rotated disc, and a hair shell cut away over the face. It was verified down to
the millimetre — and it still read as a mannequin, because procedural primitives cannot
produce a face. The files (`rig.ts`, `characterPose.ts`, `characterData.ts`,
`characterMaterials.ts`, `geometry/*`, `scripts/preview-character.ts`) were deleted rather
than left as dead code; the geometry toolkit went with them.

Nothing else in the project depends on them, and `docs/02-architecture.md` no longer lists
them.
