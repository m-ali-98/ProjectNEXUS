/**
 * Character rig data — proportions in metres.
 *
 * The protagonist is built entirely from procedural geometry (no external
 * assets). All measurements assume the heel raises the pelvis by HEEL_LIFT, so
 * `ankle.y = HEEL_LIFT` and the sole meets the floor at y = 0.
 */

export const HEEL_LIFT = 0.115;

export const BODY = {
  // vertical landmarks (metres above the floor)
  floor: 0,
  ankle: HEEL_LIFT,
  knee: 0.505,
  hip: 0.905,
  waist: 1.10,
  bust: 1.28,
  shoulder: 1.435,
  neck: 1.505,
  chin: 1.565,
  headCenter: 1.645,
  crown: 1.755,

  // limb radii
  thighTop: 0.082,
  thighBottom: 0.058,
  calfTop: 0.058,
  calfBottom: 0.032,
  upperArm: 0.046,
  elbow: 0.037,
  wrist: 0.026,

  // widths
  hipHalfWidth: 0.078,
  shoulderHalfWidth: 0.175,
  footLength: 0.235,
  footWidth: 0.078,

  // head
  headRadius: 0.098,
  eyeRadius: 0.0135,
  eyeSeparation: 0.037,
  eyeHeight: 1.655,
  eyeForward: 0.079,
} as const;

/** The silhouette of the torso, sampled as a lathe profile. */
export const TORSO_PROFILE: [radius: number, heightAboveHip: number][] = [
  [0.0, -0.13],
  [0.115, -0.115],
  [0.146, -0.06],
  [0.156, 0.005],
  [0.152, 0.06],
  [0.126, 0.115],
  [0.108, 0.17],
  [0.114, 0.225],
  [0.132, 0.29],
  [0.145, 0.36],
  [0.147, 0.43],
  [0.138, 0.485],
  [0.104, 0.53],
  [0.072, 0.555],
  [0.0, 0.565],
];

/** Circumference of the panel seams on the bodysuit. */
export const SUIT_SEAMS = [0.06, 0.17, 0.235, 0.35, 0.47];

export const CHARACTER_HEIGHT = BODY.crown + 0.09; // hair volume above the crown

/**
 * Shoe silhouette in ankle-local space: (z, y) with −z forward.
 * The lowest point is the ball of the foot at y = −HEEL_LIFT, so the sole meets
 * the floor exactly when the leg is straight.
 */
export const SHOE_PROFILE: [z: number, y: number][] = [
  [0.055, 0.105],
  [0.064, 0.03],
  [0.05, -0.072],
  [0.02, -0.106],
  [-0.06, -HEEL_LIFT],
  [-0.13, -0.104],
  [-0.185, -0.072],
  [-0.205, -0.048],
  [-0.188, -0.026],
  [-0.11, 0.006],
  [-0.055, 0.062],
  [-0.004, 0.094],
];

/** Ball-of-foot contact point used by the ground solve. */
export const SOLE_CONTACT: [x: number, y: number, z: number] = [0, -HEEL_LIFT, -0.06];
