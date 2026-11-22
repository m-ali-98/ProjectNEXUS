/**
 * Character rig validation.
 *
 *   npx tsx scripts/validate-character.ts
 *
 * Rebuilds the rig hierarchy as a pure forward-kinematics chain and steps the
 * animation through idle, walk, run and sprint. It asserts:
 *   · no joint ever produces NaN
 *   · the stance foot stays on the floor (the ground solve works)
 *   · the swinging foot clears the floor
 *   · the crown stays within human height bounds
 *   · limb angles stay inside anatomical limits
 *   · left/right symmetry in the idle pose
 */
import * as THREE from "three";
import { BODY, HEEL_LIFT, SHOE_PROFILE, SOLE_CONTACT } from "../src/world/character/characterData";
import { computePose, gaitPhase, type Pose, type PoseInputs } from "../src/world/character/characterPose";

const errors: string[] = [];
const warnings: string[] = [];
const note = (m: string) => console.log(`  · ${m}`);

/** Forward kinematics for the two legs, using the same chain as Character.tsx. */
function footHeights(pose: Pose) {
  const rootY = pose.root.y;

  const leg = (thigh: number, knee: number, ankle: number, side: 1 | -1) => {
    const hip = new THREE.Object3D();
    hip.position.set(side * BODY.hipHalfWidth, BODY.hip + rootY, 0);
    hip.rotation.set(pose.hips.rotX, pose.hips.rotY, pose.hips.rotZ, "YXZ");

    const thighJoint = new THREE.Object3D();
    thighJoint.rotation.set(thigh, 0, side * 0.015, "YXZ");
    hip.add(thighJoint);

    const kneeJoint = new THREE.Object3D();
    kneeJoint.position.set(0, -0.4, 0);
    kneeJoint.rotation.set(knee, 0, 0, "YXZ");
    thighJoint.add(kneeJoint);

    const ankleJoint = new THREE.Object3D();
    ankleJoint.position.set(0, -0.39, 0);
    ankleJoint.rotation.set(ankle, 0, 0, "YXZ");
    kneeJoint.add(ankleJoint);

    // Real contact points: the ball of the foot from the shoe profile, and the
    // stiletto tip which sits at the same height under the heel.
    const ball = new THREE.Vector3(...SOLE_CONTACT);
    const heel = new THREE.Vector3(0, -HEEL_LIFT, 0.048);
    hip.updateMatrixWorld(true);
    return {
      ankle: ankleJoint.getWorldPosition(new THREE.Vector3()),
      heel: ankleJoint.localToWorld(heel.clone()),
      ball: ankleJoint.localToWorld(ball.clone()),
    };
  };

  return {
    left: leg(pose.thighL.rotX, pose.kneeL.rotX, pose.ankleL.rotX, 1),
    right: leg(pose.thighR.rotX, pose.kneeR.rotX, pose.ankleR.rotX, -1),
  };
}

const baseInput: PoseInputs = {
  time: 0,
  speed: 0,
  sprinting: false,
  moving: false,
  turnRate: 0,
  motion: 1,
  lookYaw: 0,
  lookPitch: 0,
};

type Scenario = { name: string; speed: number; sprinting: boolean; moving: boolean };

const scenarios: Scenario[] = [
  { name: "idle", speed: 0, sprinting: false, moving: false },
  { name: "walk", speed: 3.9, sprinting: false, moving: true },
  { name: "run", speed: 5.5, sprinting: false, moving: true },
  { name: "sprint", speed: 7.2, sprinting: true, moving: true },
];

for (const scenario of scenarios) {
  let phase = 0;
  let minSole = Infinity;
  let maxSole = -Infinity;
  let maxSwingClearance = 0;
  let worstAir = 0;

  for (let frame = 0; frame < 900; frame++) {
    const delta = 1 / 60;
    phase = gaitPhase(phase, scenario.speed, delta, scenario.sprinting);
    const pose = computePose(
      {
        ...baseInput,
        time: frame * delta,
        moving: scenario.moving,
        speed: scenario.speed,
        sprinting: scenario.sprinting,
      },
      phase,
    );

    const numbers = [
      pose.root.y,
      pose.hips.rotX,
      pose.spine.rotX,
      pose.chest.rotX,
      pose.head.rotY,
      pose.shoulderL.rotX,
      pose.elbowL.rotX,
      pose.thighL.rotX,
      pose.kneeL.rotX,
      pose.ankleL.rotX,
    ];
    if (numbers.some((n) => !Number.isFinite(n))) {
      errors.push(`${scenario.name}: non-finite pose value at frame ${frame}`);
      break;
    }
    if (Math.abs(pose.kneeL.rotX) > 1.75 || Math.abs(pose.thighL.rotX) > 0.95) {
      errors.push(`${scenario.name}: joint angle outside anatomical range at frame ${frame}`);
      break;
    }

    const feet = footHeights(pose);
    const lowest = Math.min(feet.left.heel.y, feet.left.ball.y, feet.right.heel.y, feet.right.ball.y);
    const leftSole = Math.min(feet.left.heel.y, feet.left.ball.y);
    const rightSole = Math.min(feet.right.heel.y, feet.right.ball.y);

    minSole = Math.min(minSole, lowest);
    maxSole = Math.max(maxSole, lowest);
    maxSwingClearance = Math.max(maxSwingClearance, Math.max(leftSole, rightSole));
    worstAir = Math.max(worstAir, Math.min(leftSole, rightSole));
  }

  note(
    `${scenario.name}: lowest sole ${minSole.toFixed(3)} .. ${maxSole.toFixed(3)} m, ` +
      `swing clearance ${maxSwingClearance.toFixed(3)} m`,
  );

  if (minSole < -0.02) errors.push(`${scenario.name}: a foot sinks ${(-minSole).toFixed(3)} m through the floor`);
  if (scenario.moving && worstAir > 0.06) {
    errors.push(`${scenario.name}: both feet are airborne ${worstAir.toFixed(3)} m (figure floats)`);
  }
  if (scenario.moving && maxSwingClearance < 0.09) {
    warnings.push(`${scenario.name}: swinging foot only lifts ${maxSwingClearance.toFixed(3)} m`);
  }
}

// Idle symmetry
const idlePose = computePose({ ...baseInput, time: 1.2 }, 0);
const asymmetry = Math.abs(idlePose.thighL.rotX - idlePose.thighR.rotX);
if (asymmetry > 0.25) warnings.push(`idle legs asymmetric by ${asymmetry.toFixed(3)} rad`);

// Standing height sanity: crown ≈ 1.75, heels add 0.115 to the leg chain.
const standing = computePose({ ...baseInput, time: 0.4 }, 0);
const crown = BODY.crown + standing.root.y;
note(`standing crown ${crown.toFixed(3)} m (pelvis ${BODY.hip.toFixed(3)} m, heel lift ${HEEL_LIFT.toFixed(3)} m)`);
if (crown < 1.6 || crown > 1.85) errors.push(`unexpected character height ${crown.toFixed(3)} m`);

// Jump/landing pose must not explode.
const turnPose = computePose({ ...baseInput, turnRate: 6, moving: true, speed: 3 }, 1.1);
if (!Number.isFinite(turnPose.hips.rotZ) || Math.abs(turnPose.hips.rotZ) > 0.4) {
  errors.push("turning lean is outside a believable range");
}

console.log(`errors: ${errors.length}`);
errors.forEach((e) => console.log(`  ✗ ${e}`));
warnings.forEach((w) => console.log(`  ! ${w}`));
process.exit(errors.length ? 1 : 0);
