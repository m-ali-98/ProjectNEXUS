# 07 — Character & camera

The protagonist is generated entirely in code: no rigged meshes, no texture files, no
downloads. Everything from the profile of her heel to the pore-level normal on her skin is
built by `src/world/character/*`, which means the avatar is a first-class part of the
codebase and is verified like any other system.

## Why procedural

The project ships without binary art (see [03 — Asset pipeline](03-assets.md)). A rigged
GLB would have been the shortcut, but it would have added a multi-megabyte asset, a
licence question and a loading state to a page whose whole premise is "everything here is
the author's own work". A parametric figure also lets the pose solver reason about the
exact same numbers the geometry uses, which is what makes the feet stay on the floor.

## Module map

| File | Responsibility |
| --- | --- |
| `characterData.ts` | Landmarks, torso lathe profile, suit seam rings, shoe profile, `HEEL_LIFT`, `CHARACTER_HEIGHT` |
| `characterPose.ts` | Pure FK solver: pose in → joint angles out, plus the sole-contact ground solve |
| `characterMaterials.ts` | The PBR set: skin, suit, suit panels, edges, hair, sclera/iris/cornea, lips, leather, metal |
| `Head.tsx` | Skull, face volumes, eyes with cornea, brow, lips, and the swingable hair mass |
| `Body.tsx` | Torso lathe, bust/back volumes, seams, belt, collar, yoke, back zip, arms, hands, legs, heels |
| `Character.tsx` | The rig: refs per joint, pose blending, follow, turn-to-velocity, blob shadow, practical lights |

## The figure

- **Proportions.** Crown at 1.755 m, hip joint at 0.905 m, shoulder joints at 1.435 m —
  fashion-illustration proportions (long legs, narrow waist, 0.168 m shoulder half-width)
  rather than a neutral mannequin.
- **Torso.** A lathe over a 26-point profile, scaled 2× from the profile units so the
  surface passes through the hips, waist, ribcage and shoulder line; bust and back
  volumes, `SUIT_SEAMS` rings at the waist, ribs and hips, a belt, a yoke and a back zip.
- **Limbs.** Thigh radius narrows 0.082 → 0.058 m down the leg, shin tapers into the
  ankle at 0.115 m above the floor (the heel lift). Arms are shoulder → elbow 0.29 m →
  wrist 0.26 m.
- **Hands.** A palm plus four two-segment fingers and an opposed thumb — enough to read
  as hands at gameplay distance without a rigged hand.
- **Head.** Skull, cheekbones and jaw volumes, eye sockets with sclera/iris/pupil/cornea,
  brows, lips, and a hair mass that swings (the `hairSwing` joint is driven by speed).
- **Heels.** One `SHOE_PROFILE` outline in ankle space — sole line, arch, stiletto tip —
  extruded sideways and rotated into place, plus a sole plate and accent strip. The same
  profile is what the validator grounds against, so the mesh and the physics can't drift.

## Pose and grounding

`characterPose.ts` is pure: given `{ speed, run, turn, phase, airtime }` it returns joint
angles for a named joint record, which `Character.tsx` applies with an `"YXZ"` rotation
order at a 14/s blend so state changes read as weight, not snapping.

Grounding is solved, not faked. For every frame the solver walks the chain
thigh → knee → ankle → sole contact point for both legs, finds the lowest sole vertex,
and drops the pelvis so that point sits at `y = 0`. `scripts/validate-character.ts` runs
the same FK over idle/walk/run/sprint cycles and asserts:

- no sole ever sinks more than 2 cm below the floor (measured idle −0.005 m … sprint
  −0.017 m);
- the swing foot clears the floor by ≥ 0.1 m (0.436 m at sprint);
- the crown stays at the documented height.

Run it with `npx tsx scripts/validate-character.ts`.

## Third-person boom

`camera/thirdPerson.ts` is the whole camera:

- pivot 1.5 m above her feet, offset 0.32 m to her right shoulder;
- arm length 3.25 m (min 0.85 m), aimed 9 m along the view direction;
- pitch clamp −0.62 … 0.98 rad;
- 12-step probe against `resolveCollisions` shortens the arm when geometry is behind her,
  and the solved position keeps 0.32 m of floor clearance.

`PlayerController` eases the live camera toward that pose (faster when the arm is already
short), so collision changes read as a smooth pull-in rather than a cut. When a panel is
focused the director owns the camera instead; on close, `releaseCamera()` returns it to
the boom.

The character turns toward her velocity when moving and toward the camera yaw when idle,
which is what keeps a keyboard-only player looking where the camera is looking.

## Render quality

The avatar exists to be looked at, so it carries most of the graphics upgrade:

- **Image-based lighting.** A PMREM-filtered drei `Environment` with lightformers gives
  the suit, hair and metal something real to reflect; `envMapIntensity` is tuned per
  material so skin stays matte while the leather and the chrome heel ring read wet.
- **Clearcoat and sheen.** The suit is a dark technical textile (clearcoat 0.72, sheen
  0.5) with a woven normal map, so highlights roll along the limbs instead of sitting as
  a flat specular blob.
- **Skin relief.** A generated pore-scale normal map plus light sheen and clearcoat
  breaks up the highlight across the chest, shoulders and face.
- **Contacts.** A canvas blob shadow under her, two travelling point lights that keep the
  local key on the figure, and a contact ring that only appears on HIGH/ULTRA.
- **Post.** SSAO (ULTRA) anchors her to the floor; bloom picks up the suit's cyan accent
  strips.

## Budget

The figure is ~140 meshes of low-poly primitives sharing 16 materials, with no skinning
and no per-frame allocations. The only per-quality differences are the contact ring (off
on PERFORMANCE) and the shadow flags handed down by `useShadow()`; the two short-range
practical lights stay on every profile because without them she loses her form against
the fog.
