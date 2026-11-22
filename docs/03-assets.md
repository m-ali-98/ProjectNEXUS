# Asset pipeline

## What ships today

The repository contains **no binary 3D assets**. Everything in the facility is generated
at runtime:

| Asset class | Source | Produced by |
| --- | --- | --- |
| Panels, screens, labels, stencils, paper, hazard stripes | Canvas 2D drawing | `src/world/environment/textures.ts`, `proceduralUI.ts` |
| Surfaces (concrete, brushed steel, dark steel, trim, glass, emissive accents) | `MeshStandardMaterial` + generated maps | `src/world/environment/materials.ts` |
| Architecture (atrium shell, corridors, bulkheads, room shells) | Primitive geometry | `environment/Architecture.tsx` |
| Furniture (consoles, desks, crates, pylons, server racks, chairs) | Primitive geometry | `environment/Fixtures.tsx` |
| Holograms, node graphs, pipeline, globe, streaming paths | Lines, instanced points, additive planes | `sectors/*.tsx`, `environment/Effects.tsx` |
| Text | `troika-three-text` through `environment/Text3D.tsx` | self-hosted WOFF subsets |
| Fonts | `public/fonts/*.woff` (Rajdhani 500/600/700, IBM Plex Mono 400/500) | Fontsource, copied in |

Consequences: zero download cost for geometry, no texture memory spikes, and every
surface remains themable from `materials.ts`. It also means the environment is
**stylised industrial**, not photoreal — that is a deliberate identity choice, and the
Blender work below is what would raise fidelity further.

### Text and glyph coverage

Only latin subsets are self-hosted. Characters outside them make troika fetch a fallback
font from a third-party CDN at runtime, so `Text3D.sanitizeGlyphs()` maps the typographic
characters we use (`—`, `→`, `·`, `×`, `…`) to ASCII. If you add copy containing new
symbols, either extend that map or add a matching font subset — do not let a label pull a
font over the network.

## Adding Blender assets

The scene is built to accept loaded geometry without restructuring:

1. **Author** in Blender. Apply modifiers, keep one material per surface family, use
   real-world scale in metres and +Y up on export.
2. **Export to glTF 2.0 (.glb).** Enable Draco for meshes > ~50k triangles or Meshopt
   compression for animation-heavy assets; keep textures ≤ 2K and prefer KTX2/Basis for
   PBR map sets.
3. **Place** files in `public/models/<sector>/<name>.glb` (add `public/draco/` and
   `public/basis/` when using those compressions).
4. **Load** with `useGLTF("/models/...")` inside the sector component. Sector components
   are mounted/unmounted by `SectorStreamer`, so loading is automatically lazy and
   disposal is handled by R3F.
5. **Register interactions** for anything the model represents: add an entry to
   `src/world/interactions/registry.ts` with the world position, radius and panel, then
   add its collider to the prop table if the player must not walk through it.

Self-host the decoders so no runtime request leaves the origin:

```ts
// world/WorldCanvas.tsx (module scope, client only)
useGLTF.setDecoderPath("/draco/");
useKTX2.setTranscoderPath("/basis/");
```

```tsx
// inside a sector
const { nodes, materials } = useGLTF("/models/archive/shelf.glb");
<primitive object={nodes.Shelf} />
```

Compress assets at build time (outside the app build) with:

```bash
# Draco
npx gltf-pipeline -i raw.glb -o shelf.glb -d
# Meshopt
npx gltfpack -i raw.glb -o shelf.glb -cc -tc
# KTX2 (needs toktx/basisu)
toktx --t2 --genmipmap shelf_albedo.ktx2 shelf_albedo.png
```

Add resulting files to `public/` only; do not commit large `.blend` sources — keep them
in the asset store or Git LFS.

## Current production backlog (honest status)

| Item | Status |
| --- | --- |
| Procedural facility | **Shipped** |
| Self-hosted fonts, no CDN text fetches | **Shipped** |
| KTX2 / Draco / Meshopt decoders wired up | **Not enabled** — no compressed assets exist yet; the hook points are documented above |
| Blender-authored hero props (core, racks, archive wall) | **Planned** — current versions are primitive-built with the same silhouettes and material families |
| Recorded ambience | **Planned** — current audio is synthesised in `audioEngine.ts` |
| Screenshots/renders of the facility | **Not shipped** — case studies explicitly label reconstructions instead of implying captured internal systems |

## Naming and size rules

- `public/models/**` — `kebab-case`, no spaces, one prop per file.
- Keep each `.glb` under ~4 MB compressed; split large assemblies per prop.
- Textures: base colour + ORM packed + normal (KTX2 preferred). Reuse material families
  from `materials.ts` where possible so one material instance serves many props.
- Never place assets in `src/` — `public/` is the only wired asset root.
