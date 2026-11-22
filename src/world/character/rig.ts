/**
 * Declarative rig for the protagonist.
 *
 * The rig is data: a tree of joint nodes, each carrying meshes bound to a
 * material key. `Character.tsx` renders it and writes the pose angles onto the
 * joint groups; `scripts/preview-character.ts` walks the same tree with matrices
 * to rasterise an offline reference image. One source of truth, so the preview
 * cannot drift from what ships.
 */
import * as THREE from "three";

import { BODY } from "./characterData";
import {
  ankleStrapGeometry,
  forearmGeometry,
  handGeometry,
  neckGeometry,
  shinGeometry,
  shoeUpperGeometry,
  soleGeometry,
  stilettoGeometry,
  thighGeometry,
  torsoGeometry,
  torsoTrim,
  upperArmGeometry,
} from "./geometry/body";
import {
  earGeometry,
  eyeGeometries,
  eyelidGeometry,
  hairGeometries,
  headGeometry,
  HEAD,
  lipGeometries,
} from "./geometry/head";
import { mirrorX } from "./geometry/surface";

export type MaterialKey =
  | "skin"
  | "skinDeep"
  | "suit"
  | "suitPanel"
  | "suitEdge"
  | "accent"
  | "hair"
  | "hairTip"
  | "sclera"
  | "iris"
  | "pupil"
  | "cornea"
  | "lips"
  | "brow"
  | "leather"
  | "metal";

export type Part = {
  key: string;
  geometry: THREE.BufferGeometry;
  material: MaterialKey;
  /** Casts a shadow in the world (disabled for the tiny face pieces). */
  shadow?: boolean;
};

export type JointName =
  | "hips"
  | "spine"
  | "chest"
  | "neck"
  | "head"
  | "shoulderL"
  | "shoulderR"
  | "elbowL"
  | "elbowR"
  | "wristL"
  | "wristR"
  | "thighL"
  | "thighR"
  | "kneeL"
  | "kneeR"
  | "ankleL"
  | "ankleR";

export type RigNode = {
  name: string;
  joint?: JointName;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Uniform scale, used to size the head without re-authoring its geometry. */
  scale?: number;
  parts: Part[];
  children: RigNode[];
};

const SHOULDER_X = 0.128;
const HIP_X = BODY.hipHalfWidth;
/** Head geometry is authored at 1.0; this brings it to the figure's proportions. */
const HEAD_SCALE = 1.1;

/** Belt, seams, zip and trim, in the torso's own frame (spine-local). */
function suitDetails(): Part[] {
  const parts: Part[] = [];

  // belt: a wide band across the waist, plus a buckle at the front
  parts.push({ key: "belt", geometry: torsoTrim(0.026, 0.016, 1.03), material: "suitPanel", shadow: true });
  parts.push({
    key: "buckle",
    geometry: new THREE.BoxGeometry(0.04, 0.03, 0.01).translate(0, 0.03, -0.092),
    material: "suitEdge",
  });
  parts.push({
    key: "buckle-accent",
    geometry: new THREE.BoxGeometry(0.024, 0.0035, 0.003).translate(0, 0.03, -0.0985),
    material: "accent",
  });

  // piping: waist, under-bust and hip panels
  parts.push({ key: "seam-waist", geometry: torsoTrim(0.062, 0.0018, 1.008), material: "suitEdge" });

  // collar
  parts.push({ key: "collar", geometry: torsoTrim(0.431, 0.007, 1.045), material: "suitEdge" });
  parts.push({ key: "collar-accent", geometry: torsoTrim(0.4345, 0.0016, 1.05), material: "accent" });

  // centre zip down the back
  parts.push({
    key: "zip",
    geometry: new THREE.BoxGeometry(0.005, 0.38, 0.005).translate(0, 0.19, 0.088),
    material: "suitEdge",
  });

  // accent strips down the outer hips, following the silhouette
  for (const side of [1, -1]) {
    parts.push({
      key: `hip-strip-${side}`,
      geometry: new THREE.BoxGeometry(0.0022, 0.17, 0.004).translate(side * 0.138, -0.03, -0.03),
      material: "accent",
    });
  }

  return parts;
}

/** Hair shell and strands, on their own node so they can swing. */
function hairParts(): Part[] {
  const hair = hairGeometries();
  return [
    { key: "hair-cap", geometry: hair.cap, material: "hair", shadow: true },
    { key: "hair-back", geometry: hair.back, material: "hair", shadow: true },
    { key: "hair-sweepL", geometry: hair.sweepL, material: "hairTip" },
    { key: "hair-sweepR", geometry: hair.sweepR, material: "hairTip" },
  ];
}

function headParts(): Part[] {
  const eyes = eyeGeometries();
  const lips = lipGeometries();
  const parts: Part[] = [
    { key: "skull", geometry: headGeometry(), material: "skin", shadow: true },
  ];

  for (const side of [1, -1] as const) {
    const x = side * HEAD.eyeX;
    /** Mirrors a piece for the other eye, then moves it into place. */
    const at = (geometry: THREE.BufferGeometry, dx = 0, dy = 0, dz = 0) => {
      const copy = side === -1 ? mirrorX(geometry) : geometry.clone();
      copy.translate(x + dx, HEAD.eyeY + dy, HEAD.eyeZ + dz);
      return copy;
    };

    parts.push({ key: `sclera-${side}`, geometry: at(eyes.sclera), material: "sclera" });
    parts.push({ key: `iris-${side}`, geometry: at(eyes.iris), material: "iris" });
    parts.push({ key: `pupil-${side}`, geometry: at(eyes.pupil), material: "pupil" });
    parts.push({ key: `catchlight-${side}`, geometry: at(eyes.catchlight), material: "cornea" });
    parts.push({ key: `rim-${side}`, geometry: at(eyes.rim), material: "brow" });
    parts.push({ key: `lid-${side}`, geometry: at(eyelidGeometry()), material: "skin" });
    parts.push({ key: `crease-${side}`, geometry: at(eyes.crease), material: "skinDeep" });
    parts.push({
      key: `brow-${side}`,
      geometry: at(eyes.brow, 0, 0.0255, -0.0015),
      material: "brow",
    });

    const ear = earGeometry();
    parts.push({ key: `ear-${side}`, geometry: side === 1 ? ear : mirrorX(ear), material: "skin" });
  }

  parts.push({
    key: "lip-upper",
    geometry: lips.upper.translate(0, HEAD.mouthY + 0.001, HEAD.mouthZ),
    material: "lips",
  });
  parts.push({
    key: "lip-lower",
    geometry: lips.lower.translate(0, HEAD.mouthY - 0.0052, HEAD.mouthZ + 0.0008),
    material: "lips",
  });
  parts.push({
    key: "lip-line",
    geometry: lips.line.translate(0, HEAD.mouthY, HEAD.mouthZ),
    material: "skinDeep",
  });

  return parts;
}

function armNodes(side: 1 | -1): RigNode {
  const upward = (geometry: THREE.BufferGeometry) => (side === 1 ? geometry : mirrorX(geometry));
  return {
    name: side === 1 ? "shoulderL" : "shoulderR",
    joint: side === 1 ? "shoulderL" : "shoulderR",
    position: [side * SHOULDER_X, 0.155, 0],
    rotation: [-0.02, 0, side * 0.07],
    parts: [
      { key: `upperArm-${side}`, geometry: upward(upperArmGeometry()), material: "suit", shadow: true },
    ],
    children: [
      {
        name: side === 1 ? "elbowL" : "elbowR",
        joint: side === 1 ? "elbowL" : "elbowR",
        position: [0, -0.29, 0],
        parts: [
          { key: `forearm-${side}`, geometry: upward(forearmGeometry()), material: "suit", shadow: true },
          {
            key: `cuff-${side}`,
            geometry: new THREE.TorusGeometry(0.0215, 0.0045, 8, 30)
              .rotateX(Math.PI / 2)
              .translate(0, -0.248, 0),
            material: "suitEdge",
          },
        ],
        children: [
          {
            name: side === 1 ? "wristL" : "wristR",
            joint: side === 1 ? "wristL" : "wristR",
            position: [0, -0.26, 0],
            parts: [
              { key: `hand-${side}`, geometry: upward(handGeometry()), material: "skin", shadow: true },
            ],
            children: [],
          },
        ],
      },
    ],
  };
}

function legNodes(side: 1 | -1): RigNode {
  const mirror = (geometry: THREE.BufferGeometry) => (side === 1 ? geometry : mirrorX(geometry));
  return {
    name: side === 1 ? "thighL" : "thighR",
    joint: side === 1 ? "thighL" : "thighR",
    position: [side * HIP_X, 0, 0],
    rotation: [0, 0, side * 0.012],
    parts: [
      { key: `thigh-${side}`, geometry: mirror(thighGeometry()), material: "suit", shadow: true },
    ],
    children: [
      {
        name: side === 1 ? "kneeL" : "kneeR",
        joint: side === 1 ? "kneeL" : "kneeR",
        position: [0, -0.4, 0],
        parts: [
          { key: `shin-${side}`, geometry: mirror(shinGeometry()), material: "suit", shadow: true },
        ],
        children: [
          {
            name: side === 1 ? "ankleL" : "ankleR",
            joint: side === 1 ? "ankleL" : "ankleR",
            position: [0, -0.39, 0],
            parts: [
              {
                key: `shoe-${side}`,
                geometry: mirror(shoeUpperGeometry()),
                material: "leather",
                shadow: true,
              },
              { key: `sole-${side}`, geometry: mirror(soleGeometry()), material: "suitEdge" },
              { key: `stiletto-${side}`, geometry: mirror(stilettoGeometry()), material: "metal", shadow: true },
              { key: `strap-${side}`, geometry: mirror(ankleStrapGeometry()), material: "leather" },
            ],
            children: [],
          },
        ],
      },
    ],
  };
}

/**
 * Builds the whole rig. Geometry construction is the expensive part (~40 lofts
 * with several thousand vertices each), so the result is cached per module.
 */
let cached: RigNode | null = null;

export function buildRig(): RigNode {
  if (cached) return cached;

  const rig: RigNode = {
    name: "root",
    position: [0, 0, 0],
    parts: [],
    children: [
      {
        name: "hips",
        joint: "hips",
        position: [0, BODY.hip, 0],
        parts: [],
        children: [
          {
            name: "spine",
            joint: "spine",
            position: [0, 0.12, 0],
            parts: [
              { key: "torso", geometry: torsoGeometry(), material: "suit", shadow: true },
              ...suitDetails(),
            ],
            children: [
              {
                name: "chest",
                joint: "chest",
                position: [0, 0.2, 0],
                parts: [],
                children: [
                  {
                    name: "neck",
                    joint: "neck",
                    position: [0, 0.226, 0],
                    parts: [
                      { key: "neck", geometry: neckGeometry(), material: "skin", shadow: true },
                    ],
                    children: [
                      {
                        name: "head",
                        joint: "head",
                        position: [0, 0.152, 0],
                        scale: HEAD_SCALE,
                        parts: headParts(),
                        children: [
                          {
                            name: "hair",
                            position: [0, 0, 0],
                            parts: hairParts(),
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                  armNodes(1),
                  armNodes(-1),
                ],
              },
            ],
          },
          legNodes(1),
          legNodes(-1),
        ],
      },
    ],
  };

  cached = rig;
  return rig;
}

/** Every geometry in the rig, for validation and the offline renderer. */
export function rigParts(node: RigNode = buildRig()): { node: RigNode; part: Part }[] {
  const out: { node: RigNode; part: Part }[] = node.parts.map((part) => ({ node, part }));
  for (const child of node.children) out.push(...rigParts(child));
  return out;
}

/** Material base colours used by the offline preview renderer. */
export const PART_COLOURS: Record<MaterialKey, [number, number, number]> = {
  skin: [0.7, 0.49, 0.4],
  skinDeep: [0.6, 0.41, 0.34],
  suit: [0.11, 0.13, 0.16],
  suitPanel: [0.14, 0.17, 0.21],
  suitEdge: [0.17, 0.21, 0.25],
  accent: [0.28, 0.9, 1],
  hair: [0.19, 0.13, 0.1],
  hairTip: [0.24, 0.17, 0.13],
  sclera: [0.93, 0.92, 0.9],
  iris: [0.28, 0.45, 0.36],
  pupil: [0.02, 0.02, 0.03],
  cornea: [0.9, 0.95, 1],
  lips: [0.62, 0.27, 0.26],
  brow: [0.15, 0.11, 0.09],
  leather: [0.09, 0.1, 0.11],
  metal: [0.72, 0.76, 0.8],
};
