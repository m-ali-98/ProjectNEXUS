/**
 * Pure animation math for the protagonist.
 *
 * Nothing here touches React or three.js objects: it maps a small set of
 * gameplay inputs to joint angles, which `Character.tsx` copies onto the rig.
 * Keeping it pure means the pose can be unit-tested headlessly (see
 * `scripts/validate-character.ts`).
 *
 * Convention: +X rotation pitches a limb forward (toward the character's
 * facing direction, local −Z), +Y is twist, +Z is roll. Angles are radians.
 */

export type PoseInputs = {
  /** Seconds since mount. */
  time: number;
  /** Horizontal speed in m/s. */
  speed: number;
  sprinting: boolean;
  moving: boolean;
  /** Signed yaw rate, radians/second. */
  turnRate: number;
  /** 0 disables all oscillation (reduced motion). */
  motion: number;
  /** Yaw/pitch of the camera, used for the head look. */
  lookYaw: number;
  lookPitch: number;
};

export type Pose = {
  root: { y: number; rotX: number; rotY: number; rotZ: number };
  hips: { rotX: number; rotY: number; rotZ: number };
  spine: { rotX: number; rotY: number; rotZ: number };
  chest: { rotX: number; rotY: number; rotZ: number };
  neck: { rotX: number; rotY: number; rotZ: number };
  head: { rotX: number; rotY: number; rotZ: number };
  shoulderL: { rotX: number; rotY: number; rotZ: number };
  shoulderR: { rotX: number; rotY: number; rotZ: number };
  elbowL: { rotX: number; rotY: number; rotZ: number };
  elbowR: { rotX: number; rotY: number; rotZ: number };
  wristL: { rotX: number; rotY: number; rotZ: number };
  wristR: { rotX: number; rotY: number; rotZ: number };
  thighL: { rotX: number; rotY: number; rotZ: number };
  thighR: { rotX: number; rotY: number; rotZ: number };
  kneeL: { rotX: number };
  kneeR: { rotX: number };
  ankleL: { rotX: number };
  ankleR: { rotX: number };
  /** Extra kick applied to the hair strands and the suit cape-line. */
  hairSwing: number;
};

const TAU = Math.PI * 2;

/** Bone lengths used for the ground-contact solve (hip→knee, knee→ankle). */
const THIGH_LENGTH = 0.4;
const SHIN_LENGTH = 0.39;

/** Ball-of-foot contact point in ankle space (matches SHOE_PROFILE). */
const SOLE_Y = -0.115;
const SOLE_Z = -0.06;

/**
 * Height of the sole's contact point for a given leg pose, ignoring the pelvis
 * height. The pelvis is then dropped by the smaller of the two so the stance
 * foot stays planted.
 */
function soleHeight(thigh: number, knee: number, ankle: number) {
  const ankleY =
    0.905 - THIGH_LENGTH * Math.cos(thigh) - SHIN_LENGTH * Math.cos(thigh + knee);
  const total = thigh + knee + ankle;
  return ankleY + (SOLE_Y * Math.cos(total) - SOLE_Z * Math.sin(total));
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (current: number, target: number, rate: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-rate * dt));

/** Distance-driven gait phase so the feet stay in sync with actual movement. */
export function gaitPhase(previous: number, speed: number, delta: number, sprinting: boolean) {
  const stride = sprinting ? 2.05 : 1.55; // metres per half cycle, roughly
  return (previous + (speed * delta) / stride) % TAU;
}

export function idlePhase(previous: number, delta: number) {
  return (previous + delta * 0.55) % TAU;
}

/**
 * Poses the character.
 *
 * Movement is a two-bone approximation: the thigh swings, the knee flexes on the
 * back half of the swing, the ankle counter-rotates to keep the heel from
 * sinking into the floor. There is no IK, so the numbers are tuned to look
 * planted for speeds between 0 and 7 m/s rather than to be exact.
 */
export function computePose(input: PoseInputs, phase: number): Pose {
  const { time, speed, sprinting, moving, turnRate, motion, lookYaw, lookPitch } = input;

  // 0..1 blend between idle and full gait, plus a sprint emphasis.
  const gait = moving ? clamp(speed / 4.2, 0.25, 1) : 0;
  const run = sprinting ? clamp((speed - 3.4) / 3.6, 0, 1) : 0;
  const amp = gait * motion;

  const swing = Math.sin(phase);
  const swing2 = Math.sin(phase + Math.PI);
  const bounce = Math.abs(Math.cos(phase));

  // ---- idle ---------------------------------------------------------------
  const breathe = Math.sin(time * 1.35) * motion;
  const weightShift = Math.sin(time * 0.43) * motion;
  const sway = Math.sin(time * 0.31 + 0.6) * motion;

  // ---- legs ---------------------------------------------------------------
  const thighSwing = 0.42 + run * 0.26; // radians at full stride
  const thighL = swing * thighSwing * amp;
  const thighR = swing2 * thighSwing * amp;

  // Knees flex while the leg travels forward (after passing under the body).
  const kneeFlexL = Math.max(0, -Math.sin(phase - 0.35)) * (0.95 + run * 0.45) * amp;
  const kneeFlexR = Math.max(0, -Math.sin(phase + Math.PI - 0.35)) * (0.95 + run * 0.45) * amp;

  // Ankles keep the sole roughly level, and lift the toe on heel-strike.
  const ankleL = -thighL * 0.42 + kneeFlexL * 0.34 - 0.06 * amp;
  const ankleR = -thighR * 0.42 + kneeFlexR * 0.34 - 0.06 * amp;

  // ---- arms ---------------------------------------------------------------
  const armSwing = (0.38 + run * 0.5) * amp;
  const elbowBase = 0.18 + run * 0.95 + gait * 0.16;
  const elbowPump = Math.max(0, Math.sin(phase + (sprinting ? 0 : 0.4))) * 0.45 * amp;

  // ---- torso --------------------------------------------------------------
  const lean = (0.035 + run * 0.2 + gait * 0.03) * motion;
  const counterTwist = -swing * 0.1 * amp;
  const hipTwist = swing * 0.055 * amp;
  const hipRoll = sway * 0.02 + swing * 0.03 * amp;

  // Ground solve: the pelvis drops so the lower sole touches the floor. This is
  // what stops the whole figure floating when both thighs are at maximum swing.
  const hipDrop = -Math.min(
    soleHeight(thighL, -kneeFlexL, ankleL),
    soleHeight(thighR, -kneeFlexR, ankleR),
  );

  // ---- head ---------------------------------------------------------------
  const headYaw = clamp(lookYaw, -0.85, 0.85) * 0.72 + Math.sin(time * 0.37) * 0.03 * motion;
  const headPitch = clamp(lookPitch, -0.7, 0.7) * 0.55 - run * 0.08;

  const turnLean = clamp(turnRate * 0.12, -0.16, 0.16);

  return {
    root: {
      y: moving
        ? hipDrop + bounce * 0.004 * amp
        : Math.sin(time * 0.9) * 0.004 * motion,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
    },
    hips: {
      rotX: lean * 0.35,
      rotY: hipTwist,
      rotZ: hipRoll + turnLean * 0.4,
    },
    spine: {
      rotX: lean * 0.4,
      rotY: counterTwist * 0.5,
      rotZ: -hipRoll * 0.6 - turnLean * 0.25,
    },
    chest: {
      rotX: lean * 0.45 - breathe * 0.012,
      rotY: counterTwist,
      rotZ: -hipRoll * 0.5 + turnLean * 0.3,
    },
    neck: {
      rotX: -lean * 0.5 + breathe * 0.01,
      rotY: headYaw * 0.35,
      rotZ: 0,
    },
    head: {
      rotX: headPitch - lean * 0.55,
      rotY: headYaw * 0.65,
      rotZ: weightShift * 0.02,
    },
    shoulderL: {
      rotX: -swing * armSwing,
      rotY: 0,
      rotZ: 0.16 + run * 0.12,
    },
    shoulderR: {
      rotX: -swing2 * armSwing,
      rotY: 0,
      rotZ: -0.16 - run * 0.12,
    },
    elbowL: { rotX: elbowBase + elbowPump, rotY: 0, rotZ: 0.05 },
    elbowR: { rotX: elbowBase + Math.max(0, Math.sin(phase + Math.PI + (sprinting ? 0 : 0.4))) * 0.45 * amp, rotY: 0, rotZ: -0.05 },
    wristL: { rotX: -elbowBase * 0.25, rotY: 0, rotZ: 0 },
    wristR: { rotX: -elbowBase * 0.25, rotY: 0, rotZ: 0 },
    thighL: { rotX: thighL, rotY: 0, rotZ: 0.015 + swing * 0.01 * amp },
    thighR: { rotX: thighR, rotY: 0, rotZ: -0.015 - swing * 0.01 * amp },
    kneeL: { rotX: -kneeFlexL },
    kneeR: { rotX: -kneeFlexR },
    ankleL: { rotX: ankleL },
    ankleR: { rotX: ankleR },
    hairSwing: (0.05 + run * 0.12) * Math.sin(phase * 0.5 + time * 1.7) * motion + weightShift * 0.02,
  };
}

/** Smoothly approach a pose from the previous frame (prevents snapping). */
export function blendPose(current: Pose, target: Pose, rate: number, delta: number): Pose {
  const b = (a: number, t: number) => damp(a, t, rate, delta);
  const j = (
    c: { rotX: number; rotY?: number; rotZ?: number },
    t: { rotX: number; rotY?: number; rotZ?: number },
  ) => ({
    rotX: b(c.rotX, t.rotX),
    rotY: b(c.rotY ?? 0, t.rotY ?? 0) as number,
    rotZ: b(c.rotZ ?? 0, t.rotZ ?? 0) as number,
  });

  return {
    root: { y: b(current.root.y, target.root.y), rotX: 0, rotY: 0, rotZ: 0 },
    hips: j(current.hips, target.hips),
    spine: j(current.spine, target.spine),
    chest: j(current.chest, target.chest),
    neck: j(current.neck, target.neck),
    head: j(current.head, target.head),
    shoulderL: j(current.shoulderL, target.shoulderL),
    shoulderR: j(current.shoulderR, target.shoulderR),
    elbowL: j(current.elbowL, target.elbowL),
    elbowR: j(current.elbowR, target.elbowR),
    wristL: j(current.wristL, target.wristL),
    wristR: j(current.wristR, target.wristR),
    thighL: j(current.thighL, target.thighL),
    thighR: j(current.thighR, target.thighR),
    kneeL: { rotX: b(current.kneeL.rotX, target.kneeL.rotX) },
    kneeR: { rotX: b(current.kneeR.rotX, target.kneeR.rotX) },
    ankleL: { rotX: b(current.ankleL.rotX, target.ankleL.rotX) },
    ankleR: { rotX: b(current.ankleR.rotX, target.ankleR.rotX) },
    hairSwing: b(current.hairSwing, target.hairSwing),
  };
}
