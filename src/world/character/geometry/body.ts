/**
 * Body geometry.
 *
 * Every part is a lofted, sculpted surface (see `surface.ts`) rather than a
 * primitive: the torso flows from crotch to collarbone in one skin, the bust and
 * glutes are smooth inflations of that skin, and the limbs taper through muscle
 * bellies instead of reading as tubes.
 *
 * Local frames (matching the rig in `rig.ts`):
 *   torso   — spine origin (hip + 0.12), +y up, character faces −z
 *   arms    — shoulder / elbow / wrist joint, bone runs down −y
 *   legs    — hip / knee / ankle joint, bone runs down −y
 *   shoe    — ankle joint at the heel lift
 */
import * as THREE from "three";

import { cutFaces, loft, loftZ, merge, sculpt, type Section } from "./surface";

/* -------------------------------------------------------------------------- */
/* Torso                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Cross-sections in hip space (y = 0 at the hip joint, crotch at −0.17).
 * Widths are anatomical: hips 0.285 m across, waist 0.216, ribcage 0.26,
 * clavicles 0.26 — the hourglass of a fashion figure, not a cylinder.
 */
const TORSO: Section[] = [
  { y: -0.138, rx: 0.048, rz: 0.056, cz: 0.02, n: 2.2 },
  { y: -0.128, rx: 0.084, rz: 0.078, cz: 0.016, n: 2.3 },
  { y: -0.114, rx: 0.114, rz: 0.091, cz: 0.012, n: 2.45 },
  { y: -0.092, rx: 0.136, rz: 0.1, cz: 0.008, n: 2.5 },
  { y: -0.062, rx: 0.147, rz: 0.104, cz: 0.005, n: 2.6 },
  { y: -0.075, rx: 0.146, rz: 0.105, cz: 0.006, n: 2.6 },
  { y: -0.03, rx: 0.148, rz: 0.103, cz: 0.002, n: 2.6 },
  { y: 0.02, rx: 0.136, rz: 0.097, cz: 0, n: 2.5 },
  { y: 0.065, rx: 0.122, rz: 0.09, cz: -0.002, n: 2.4 },
  { y: 0.105, rx: 0.109, rz: 0.084, cz: -0.003, n: 2.4 },
  { y: 0.145, rx: 0.104, rz: 0.083, cz: -0.002, n: 2.4 },
  { y: 0.19, rx: 0.107, rz: 0.086, cz: 0, n: 2.4 },
  { y: 0.24, rx: 0.115, rz: 0.09, cz: 0.002, n: 2.5 },
  { y: 0.29, rx: 0.123, rz: 0.093, cz: 0.004, n: 2.5 },
  { y: 0.34, rx: 0.129, rz: 0.094, cz: 0.005, n: 2.5 },
  { y: 0.385, rx: 0.134, rz: 0.092, cz: 0.006, n: 2.5 },
  { y: 0.418, rx: 0.142, rz: 0.09, cz: 0.006, n: 2.55 },
  { y: 0.446, rx: 0.149, rz: 0.086, cz: 0.007, n: 2.6 },
  { y: 0.472, rx: 0.145, rz: 0.08, cz: 0.009, n: 2.5 },
  { y: 0.5, rx: 0.122, rz: 0.072, cz: 0.011, n: 2.3 },
  { y: 0.526, rx: 0.094, rz: 0.063, cz: 0.012, n: 2.2 },
  { y: 0.548, rx: 0.078, rz: 0.058, cz: 0.012, n: 2.1 },
  { y: 0.566, rx: 0.058, rz: 0.05, cz: 0.012, n: 2 },
];

/** Torso in spine space (the spine joint sits 0.12 m above the hip joint). */
export function torsoGeometry(): THREE.BufferGeometry {
  const geometry = loft(TORSO, {
    radial: 44,
    capStart: 0.01,
    flatEnd: true,
    domeRows: 3,
  });
  geometry.translate(0, -0.12, 0);

  sculpt(geometry, [
    // bust: two smooth inflations of the front of the ribcage
    { at: [0.05, 0.212, -0.076], radius: [0.058, 0.058, 0.056], amount: 0.042, falloff: 2.2, mirror: true },
    // sternum stays slightly recessed between them
    { at: [0, 0.214, -0.082], radius: [0.026, 0.05, 0.04], amount: -0.012, falloff: 2.2 },
    // glutes
    { at: [0.054, -0.04, 0.072], radius: [0.066, 0.068, 0.056], amount: 0.026, falloff: 2.3, mirror: true },
    // sacral dip between the glutes
    { at: [0, -0.045, 0.086], radius: [0.03, 0.06, 0.04], amount: -0.014, falloff: 2.2 },
    // shoulder blades
    { at: [0.062, 0.31, 0.062], radius: [0.06, 0.05, 0.05], amount: 0.012, falloff: 2.4, mirror: true },
    // abdomen and navel
    { at: [0, 0.105, -0.078], radius: [0.05, 0.06, 0.04], amount: 0.008, falloff: 2.4 },
    { at: [0, 0.075, -0.086], radius: [0.012, 0.014, 0.02], amount: -0.006, falloff: 2.6 },
    // collarbone hollow
    { at: [0, 0.4, -0.072], radius: [0.05, 0.022, 0.04], amount: -0.008, falloff: 2.4 },
    // trapezius slope from neck to shoulder
    { at: [0.078, 0.468, 0.024], radius: [0.06, 0.032, 0.052], amount: 0.025, falloff: 2.2, mirror: true },
  ]);

  return geometry;
}

/** Interpolates the torso silhouette at a height (hip space). */
function sectionAt(y: number): Section {
  if (y <= TORSO[0].y) return TORSO[0];
  if (y >= TORSO[TORSO.length - 1].y) return TORSO[TORSO.length - 1];
  for (let i = 0; i < TORSO.length - 1; i++) {
    const a = TORSO[i];
    const b = TORSO[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / (b.y - a.y || 1);
      return {
        y,
        rx: a.rx + (b.rx - a.rx) * t,
        rz: a.rz + (b.rz - a.rz) * t,
        cx: (a.cx ?? 0) + ((b.cx ?? 0) - (a.cx ?? 0)) * t,
        cz: (a.cz ?? 0) + ((b.cz ?? 0) - (a.cz ?? 0)) * t,
        n: (a.n ?? 2) + ((b.n ?? 2) - (a.n ?? 2)) * t,
      };
    }
  }
  return TORSO[0];
}

/**
 * A raised band that follows the torso silhouette exactly.
 *
 * Floating tori were the wrong idea: an ellipse cannot hug a superellipse, so the
 * seams poked through the suit as wires. This samples the same section table the
 * torso was lofted from and offsets it outward by a couple of millimetres.
 */
export function torsoTrim(y: number, halfHeight: number, grow = 1.02, inset = 0.004) {
  const sections: Section[] = [
    { ...sectionAt(y - halfHeight), y: y - halfHeight },
    { ...sectionAt(y - halfHeight), y: y - halfHeight, rx: sectionAt(y - halfHeight).rx * grow, rz: sectionAt(y - halfHeight).rz * grow },
    { ...sectionAt(y + halfHeight), y: y + halfHeight, rx: sectionAt(y + halfHeight).rx * grow, rz: sectionAt(y + halfHeight).rz * grow },
    { ...sectionAt(y + halfHeight), y: y + halfHeight },
  ];
  // rounded ends, so the band reads as a piping detail rather than a cut cylinder
  sections[0] = { ...sections[0], rx: sections[0].rx + inset * 0.4, rz: sections[0].rz + inset * 0.4, y: sections[0].y - 0.0015 };
  sections[3] = { ...sections[3], rx: sections[3].rx + inset * 0.4, rz: sections[3].rz + inset * 0.4, y: sections[3].y + 0.0015 };

  const geometry = loft(sections, { radial: 44 });
  geometry.translate(0, -0.12, 0);
  return geometry;
}

/** Neck, built in the neck joint frame (origin at the base of the neck). */
export function neckGeometry(): THREE.BufferGeometry {
  const sections: Section[] = [
    { y: -0.03, rx: 0.052, rz: 0.048, cz: 0.004, n: 2.2 },
    { y: 0.0, rx: 0.0405, rz: 0.041, cz: 0.002, n: 2.1 },
    { y: 0.04, rx: 0.0375, rz: 0.039, cz: -0.002, n: 2 },
    { y: 0.08, rx: 0.0365, rz: 0.038, cz: -0.006, n: 2 },
    { y: 0.115, rx: 0.038, rz: 0.039, cz: -0.008, n: 2 },
  ];
  return loft(sections, { radial: 28, flatStart: true, capEnd: 0.01, domeRows: 3 });
}

/* -------------------------------------------------------------------------- */
/* Arms                                                                        */
/* -------------------------------------------------------------------------- */

/** Upper arm, shoulder joint at the origin, elbow at −0.29. */
export function upperArmGeometry(): THREE.BufferGeometry {
  const sections: Section[] = [
    { y: 0.06, rx: 0.014, rz: 0.018, n: 2.1 },
    { y: 0.04, rx: 0.03, rz: 0.034, n: 2.2 },
    { y: 0.012, rx: 0.042, rz: 0.045, n: 2.2 },
    { y: -0.025, rx: 0.045, rz: 0.046, n: 2.2 },
    { y: -0.07, rx: 0.044, rz: 0.045, n: 2.2 },
    { y: -0.08, rx: 0.046, rz: 0.047, n: 2.1 },
    { y: -0.13, rx: 0.042, rz: 0.043, n: 2.1 },
    { y: -0.19, rx: 0.036, rz: 0.038, n: 2.1 },
    { y: -0.245, rx: 0.031, rz: 0.033, n: 2.1 },
    { y: -0.286, rx: 0.0285, rz: 0.031, n: 2.1 },
  ];
  const geometry = loft(sections, { radial: 28, capEnd: 0.01, domeRows: 3 });
  sculpt(geometry, [
    // deltoid cap
    { at: [0.012, 0.0, -0.004], radius: [0.05, 0.045, 0.05], amount: 0.012, falloff: 2.2 },
    // biceps / triceps bellies
    { at: [0.004, -0.125, -0.03], radius: [0.035, 0.06, 0.035], amount: 0.006, falloff: 2.4 },
    { at: [0.0, -0.1, 0.032], radius: [0.035, 0.06, 0.032], amount: 0.005, falloff: 2.4 },
  ]);
  return geometry;
}

/** Forearm, elbow at the origin, wrist at −0.26. */
export function forearmGeometry(): THREE.BufferGeometry {
  const sections: Section[] = [
    { y: 0.006, rx: 0.028, rz: 0.03, n: 2.1 },
    { y: -0.02, rx: 0.033, rz: 0.034, n: 2.1 },
    { y: -0.06, rx: 0.032, rz: 0.033, n: 2.1 },
    { y: -0.11, rx: 0.027, rz: 0.029, n: 2.1 },
    { y: -0.17, rx: 0.023, rz: 0.026, n: 2.1 },
    { y: -0.225, rx: 0.02, rz: 0.027, n: 2.2 },
    { y: -0.258, rx: 0.019, rz: 0.026, n: 2.3 },
  ];
  const geometry = loft(sections, { radial: 24, flatStart: true, flatEnd: true });
  sculpt(geometry, [
    // brachioradialis just under the elbow
    { at: [0.012, -0.035, -0.024], radius: [0.03, 0.05, 0.03], amount: 0.007, falloff: 2.3 },
    // ulna edge stays flat
    { at: [0.0, -0.12, 0.024], radius: [0.03, 0.05, 0.026], amount: -0.003, falloff: 2.4 },
  ]);
  return geometry;
}

/**
 * Hand, wrist at the origin, fingers running down −y and curling toward −z.
 * Palm is a lofted slab (wide in x, thin in z) rather than a scaled sphere.
 */
export function handGeometry(): THREE.BufferGeometry {
  const palm: Section[] = [
    { y: 0.008, rx: 0.0185, rz: 0.025, n: 2.4 },
    { y: -0.01, rx: 0.025, rz: 0.023, n: 2.8 },
    { y: -0.034, rx: 0.0315, rz: 0.02, cz: -0.002, n: 3 },
    { y: -0.056, rx: 0.0335, rz: 0.018, cz: -0.004, n: 3.2 },
    { y: -0.07, rx: 0.0315, rz: 0.016, cz: -0.005, n: 3.2 },
  ];
  const palmGeometry = loft(palm, { radial: 26, capStart: 0.012, capEnd: 0.008, domeRows: 3 });
  sculpt(palmGeometry, [
    // thenar pad at the base of the thumb
    { at: [0.022, -0.03, -0.012], radius: [0.02, 0.024, 0.014], amount: 0.005, falloff: 2.2 },
    // knuckle ridge
    { at: [0, -0.072, -0.008], radius: [0.03, 0.012, 0.012], amount: 0.003, falloff: 2.2 },
  ]);

  const parts: THREE.BufferGeometry[] = [palmGeometry];

  // four fingers: two phalanges each, tapered, curled slightly forward
  const fingers = [
    { x: -0.0205, len: 0.029, r: 0.0064, curl: 0.34 },
    { x: -0.0068, len: 0.032, r: 0.0068, curl: 0.3 },
    { x: 0.0066, len: 0.03, r: 0.0065, curl: 0.32 },
    { x: 0.0195, len: 0.023, r: 0.0057, curl: 0.38 },
  ];

  for (const finger of fingers) {
    const root = new THREE.Vector3(finger.x, -0.066, -0.007);
    const knuckle = new THREE.Vector3(finger.x, -0.075 - finger.len, -0.006 - finger.curl * finger.len);
    const tip = new THREE.Vector3(
      finger.x,
      knuckle.y - finger.len * 0.72,
      knuckle.z - 0.009 - finger.curl * 0.04,
    );
    const seg = (a: THREE.Vector3, b: THREE.Vector3, radius: number) => {
      const length = a.distanceTo(b);
      const geometry = loft(
        [
          { y: 0, rx: radius, rz: radius, n: 2 },
          { y: -length * 0.5, rx: radius * 0.94, rz: radius * 0.94, n: 2 },
          { y: -length, rx: radius * 0.86, rz: radius * 0.86, n: 2 },
        ],
        { radial: 12, capStart: radius * 0.9, capEnd: radius * 0.92, domeRows: 2 },
      );
      const direction = b.clone().sub(a);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, -1, 0),
        direction.clone().normalize(),
      );
      geometry.applyQuaternion(quaternion);
      geometry.translate(a.x, a.y, a.z);
      return geometry;
    };
    parts.push(seg(root, knuckle, finger.r));
    parts.push(seg(knuckle, tip, finger.r * 0.88));
  }

  // thumb: opposed, angled across the palm
  const thumbRoot = new THREE.Vector3(0.03, -0.026, -0.014);
  const thumbMid = new THREE.Vector3(0.05, -0.052, -0.03);
  const thumbTip = new THREE.Vector3(0.052, -0.07, -0.046);
  const thumbSegment = (a: THREE.Vector3, b: THREE.Vector3, radius: number) => {
    const length = a.distanceTo(b);
    const geometry = loft(
      [
        { y: 0, rx: radius, rz: radius, n: 2 },
        { y: -length, rx: radius * 0.82, rz: radius * 0.82, n: 2 },
      ],
      { radial: 12, capStart: radius * 0.9, capEnd: radius * 0.95, domeRows: 2 },
    );
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, -1, 0),
      b.clone().sub(a).normalize(),
    );
    geometry.applyQuaternion(quaternion);
    geometry.translate(a.x, a.y, a.z);
    return geometry;
  };
  parts.push(thumbSegment(thumbRoot, thumbMid, 0.0088));
  parts.push(thumbSegment(thumbMid, thumbTip, 0.0074));

  return merge(parts);
}

/* -------------------------------------------------------------------------- */
/* Legs                                                                        */
/* -------------------------------------------------------------------------- */

/** Thigh, hip joint at the origin, knee at −0.40. */
export function thighGeometry(): THREE.BufferGeometry {
  const sections: Section[] = [
    { y: 0.13, rx: 0.032, rz: 0.046, cz: 0.008, n: 2.2 },
    { y: 0.1, rx: 0.052, rz: 0.068, cz: 0.006, n: 2.3 },
    { y: 0.06, rx: 0.07, rz: 0.084, cz: 0.005, n: 2.4 },
    { y: 0.02, rx: 0.077, rz: 0.09, cz: 0.004, n: 2.45 },
    { y: -0.04, rx: 0.081, rz: 0.094, cz: 0.003, n: 2.5 },
    { y: -0.11, rx: 0.076, rz: 0.088, cz: 0.002, n: 2.5 },
    { y: -0.18, rx: 0.069, rz: 0.08, cz: 0.002, n: 2.4 },
    { y: -0.25, rx: 0.061, rz: 0.072, cz: 0.001, n: 2.3 },
    { y: -0.31, rx: 0.054, rz: 0.062, cz: 0, n: 2.2 },
    { y: -0.36, rx: 0.049, rz: 0.054, cz: -0.001, n: 2.1 },
    { y: -0.398, rx: 0.0465, rz: 0.05, cz: 0, n: 2.1 },
  ];
  const geometry = loft(sections, { radial: 30, flatStart: true, capEnd: 0.012, domeRows: 3 });
  sculpt(geometry, [
    // quadriceps sweep (front, outer)
    { at: [0.03, -0.13, -0.062], radius: [0.05, 0.09, 0.05], amount: 0.008, falloff: 2.4 },
    // hamstring
    { at: [0.0, -0.14, 0.062], radius: [0.055, 0.09, 0.045], amount: 0.006, falloff: 2.4 },
    // inner thigh hollow above the knee
    { at: [-0.05, -0.3, 0.0], radius: [0.04, 0.07, 0.05], amount: -0.006, falloff: 2.4 },
  ]);
  return geometry;
}

/** Shin, knee joint at the origin, ankle at −0.39. */
export function shinGeometry(): THREE.BufferGeometry {
  const sections: Section[] = [
    { y: -0.004, rx: 0.0445, rz: 0.0485, n: 2.1 },
    { y: -0.03, rx: 0.051, rz: 0.058, cz: 0.004, n: 2.2 },
    { y: -0.075, rx: 0.055, rz: 0.066, cz: 0.009, n: 2.3 },
    { y: -0.125, rx: 0.054, rz: 0.066, cz: 0.012, n: 2.3 },
    { y: -0.175, rx: 0.047, rz: 0.054, cz: 0.009, n: 2.2 },
    { y: -0.235, rx: 0.035, rz: 0.038, cz: 0.004, n: 2.1 },
    { y: -0.3, rx: 0.026, rz: 0.028, cz: 0, n: 2.1 },
    { y: -0.355, rx: 0.0215, rz: 0.023, cz: -0.001, n: 2.1 },
    { y: -0.39, rx: 0.0205, rz: 0.022, cz: -0.001, n: 2.1 },
  ];
  const geometry = loft(sections, { radial: 26, flatStart: true, flatEnd: true });
  sculpt(geometry, [
    // calf belly, biased to the outside
    { at: [0.012, -0.12, 0.062], radius: [0.045, 0.08, 0.045], amount: 0.012, falloff: 2.2 },
    // tibia edge
    { at: [0.0, -0.16, -0.044], radius: [0.03, 0.09, 0.03], amount: -0.003, falloff: 2.4 },
  ]);
  return geometry;
}

/* -------------------------------------------------------------------------- */
/* Shoe                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Shoe last, lofted front-to-back.
 *
 * Cross-sections run from the heel counter (z +0.052) to the toe (z −0.19). Each
 * one is an ellipse whose centre drops toward the floor as it moves forward — that
 * is what gives a pump its arch. Above the vamp line the shell is cut away, so the
 * foot enters the shoe instead of the shoe being a solid block.
 */
export function shoeUpperGeometry(): THREE.BufferGeometry {
  const sections = [
    { z: 0.05, cy: -0.014, rx: 0.023, ry: 0.03, n: 2.4 },
    { z: 0.036, cy: -0.028, rx: 0.028, ry: 0.044, n: 2.5 },
    { z: 0.012, cy: -0.042, rx: 0.0315, ry: 0.05, n: 2.6 },
    { z: -0.014, cy: -0.052, rx: 0.033, ry: 0.053, n: 2.8 },
    { z: -0.042, cy: -0.061, rx: 0.034, ry: 0.052, n: 3 },
    { z: -0.072, cy: -0.068, rx: 0.0335, ry: 0.047, n: 3 },
    { z: -0.1, cy: -0.074, rx: 0.031, ry: 0.04, n: 3 },
    { z: -0.125, cy: -0.079, rx: 0.027, ry: 0.032, n: 2.8 },
    { z: -0.148, cy: -0.084, rx: 0.0205, ry: 0.023, n: 2.6 },
    { z: -0.165, cy: -0.087, rx: 0.012, ry: 0.014, n: 2.3 },
    { z: -0.176, cy: -0.089, rx: 0.005, ry: 0.006, n: 2.2 },
  ];

  const shell = loftZ(sections, { radial: 34, capStart: 0.006, capEnd: 0.004, domeRows: 3 });

  // Vamp line: high at the heel, dipping over the instep toward the toes.
  const vamp = (z: number) => {
    if (z > 0.0) return 0.06;
    const t = Math.min(1, -z / 0.15);
    return 0.046 - t * 0.12;
  };

  return cutFaces(shell, (p: THREE.Vector3) => p.z < 0.02 && p.y > vamp(p.z));
}

/** Thin sole edge under the ball of the foot, following the last. */
export function soleGeometry(): THREE.BufferGeometry {
  const sections = [
    { z: -0.02, cy: -0.1075, rx: 0.027, ry: 0.0065, n: 3.4 },
    { z: -0.06, cy: -0.1135, rx: 0.0315, ry: 0.0065, n: 3.6 },
    { z: -0.095, cy: -0.1135, rx: 0.029, ry: 0.006, n: 3.4 },
    { z: -0.13, cy: -0.1075, rx: 0.021, ry: 0.005, n: 3 },
    { z: -0.158, cy: -0.1015, rx: 0.011, ry: 0.0035, n: 2.6 },
  ];
  return loftZ(sections, { radial: 26, capStart: 0.004, capEnd: 0.003 });
}

/** Curved stiletto spike from under the heel to the floor. */
export function stilettoGeometry(): THREE.BufferGeometry {
  const sections = [
    { z: 0.05, cy: -0.03, rx: 0.015, ry: 0.022, n: 2.5 },
    { z: 0.048, cy: -0.055, rx: 0.013, ry: 0.021, n: 2.4 },
    { z: 0.046, cy: -0.075, rx: 0.0098, ry: 0.016, n: 2.3 },
    { z: 0.045, cy: -0.095, rx: 0.0062, ry: 0.011, n: 2.2 },
    { z: 0.044, cy: -0.108, rx: 0.004, ry: 0.0065, n: 2.2 },
    { z: 0.044, cy: -0.111, rx: 0.003, ry: 0.004, n: 2.2 },
  ];
  return loftZ(sections, { radial: 18, capStart: 0.004, capEnd: 0.0015 });
}


/** Ankle strap around the top of the pump. */
export function ankleStrapGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.TorusGeometry(0.029, 0.004, 8, 36);
  geometry.rotateX(Math.PI / 2);
  geometry.scale(1.12, 1, 1.35);
  geometry.translate(0, -0.004, 0.008);
  return geometry;
}

/* -------------------------------------------------------------------------- */
/* Armature helpers used by the rig                                             */
/* -------------------------------------------------------------------------- */

export { TORSO };
