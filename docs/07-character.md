# 07 — Character & camera

The protagonist is generated entirely in code: no rigged mesh, no texture files, no
downloads. Everything from the profile of her heel to the pore-level normal on her skin is
built by `src/world/character/*`, which means the avatar is part of the codebase and is
verified like any other system.

## How the model is built

An earlier version assembled the figure from cylinders and spheres. It looked exactly like
what it was: a mannequin. The current model is **lofted and sculpted** instead.

| Layer | What it does |
| --- | --- |
| `geometry/surface.ts` | The toolkit: `loft` (superellipse cross-sections), `loftZ` (front-to-back lasts), `sculpt` (Gaussian inflations along normals), `groove` (hair and fabric ribs), `tube` (strands, brows, lashes), `cutFaces` (vamp openings, face windows), `mirrorX`, `merge` |
| `geometry/body.ts` | Torso, neck, arms, hands, legs, shoe last, sole, stiletto, strap |
| `geometry/head.ts` | Skull + face field, eye lens and lids, brows, lips, ears, hair cap with a real hairline, back mass, side pieces |
| `rig.ts` | The declarative skeleton: joint nodes with local offsets and the meshes bound to material keys |
| `characterPose.ts` | Pure pose solver and the sole-contact ground solve |
| `Character.tsx` | Walks the rig tree, registers a group per joint, blends the pose at 14/s |

Nothing intersects anything else by accident: the eyes are shallow lenses sitting on a
recessed socket with skin patches for lids, the lips are small domes that follow the mouth
surface, and the hair shell is cut away over the face so it can never cover the eyes.

## Anatomy, in numbers

- Crown 1.755 m, chin 1.545 m, hip joint 0.905 m, knee 0.505 m, ankle 0.115 m.
- Shoulder joints 0.128 m either side; hips 0.062 m.
- Torso sections run from the crotch (−0.138 above the hip joint) to the neck base (+0.566),
  with the bust, glutes, shoulder blades, collarbone hollow and trapezius sculpted into the
  same surface.
- Thigh 0.4 m, shin 0.39 m, upper arm 0.29 m, forearm 0.26 m.
- Hands: lofted palm plus four two-phalange fingers and an opposed thumb.
- Shoes: a pump last lofted from heel counter to pointed toe with the vamp cut out, a thin
  sole edge and a curved stiletto whose tip lands exactly on y = 0.

## Seeing the model without a GPU

`scripts/preview-character.ts` walks the same rig with matrices and rasterises it with a
z-buffered software renderer, writing front, three-quarter, side and two face views to
`preview/`:

```bash
npx tsx scripts/preview-character.ts           # writes preview/*.png
```

This exists because the build environment has no GPU or browser: without it, silhouette
problems (spikes at joints, floating trim, a hair shell across the eyes) were invisible
until someone opened the site. It is a reference image, not the shipping renderer.

## Pose and grounding

`characterPose.ts` is pure: given `{ speed, run, turn, phase }` it returns joint angles,
which `Character.tsx` applies with `"YXZ"` order and a 14/s blend so state changes read as
weight rather than snapping.

Grounding is solved, not faked. Every frame the solver walks thigh → knee → ankle → sole
contact for both legs and drops the pelvis so the lowest sole sits at y = 0.
`scripts/validate-character.ts` steps the same forward kinematics over idle, walk, run and
sprint and asserts that:

- no sole sinks more than 2 cm below the floor (idle −0.005 m … sprint −0.017 m);
- the swing foot clears the floor (0.436 m at sprint);
- the crown stays at the documented height;
- every rig vertex is finite and inside its joint's bounds, both limbs are mirrored within
  2 mm, and the stiletto tip lands on the floor.

```bash
npx tsx scripts/validate-character.ts
```

## Third-person boom

`camera/thirdPerson.ts`: pivot 1.5 m up and 0.32 m to her right, 3.25 m back (min 0.85 m),
aimed 9 m along the view direction, pitch clamped to −0.62 … 0.98 rad. A 12-step probe
against the real colliders shortens the arm when geometry is behind her and keeps 0.32 m of
floor clearance. `PlayerController` eases toward the solved pose; `releaseCamera()` returns
the director's camera to the same boom.

The character turns toward her velocity when moving and toward the camera yaw when idle.

## Shading

- `MeshPhysicalMaterial` throughout: clearcoat suit with a woven normal map, sheen on the
  skin, leather uppers, a metal stiletto and a glossy cornea.
- The scene's PMREM environment map gives the suit and metal something to reflect.
- SSAO (ULTRA) anchors her to the floor; bloom picks up the cyan accent strips.

## Honest limitations

The figure is a well-formed stylised human, not a scanned or sculpted artist's model. Faces
are the hardest thing to fake procedurally: hers reads correctly in silhouette and at
gameplay distance, and is deliberately simple at extreme close range. Importing a rigged
character (GLB/FBX) would raise the ceiling, but it would also add a binary asset and break
the project's "everything here is generated" premise — that is an owner decision, not a
technical one. In the meantime the software preview and the rig validator make every change
reviewable.
