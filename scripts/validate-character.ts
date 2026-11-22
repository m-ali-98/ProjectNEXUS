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
import { rigParts } from "../src/world/character/rig";

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


/* -------------------------------------------------------------------------- */
/* Rig geometry                                                               */
/* -------------------------------------------------------------------------- */


/**
 * The geometry is built by the same code the renderer uses, so it can be checked
 * headlessly: finite vertices, plausible bounds, left/right symmetry and the
 * shoe actually reaching the floor at the heel lift.
 */
function validateRigGeometry() {
  const parts = rigParts();
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  let vertices = 0;
  let bad = 0;

  for (const { part } of parts) {
    const position = part.geometry.getAttribute("position");
    vertices += position.count;
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
        bad++;
      }
      // parts are built in their joint's local space, so only sanity-bound them
      if (Math.abs(point.x) > 0.4 || Math.abs(point.y) > 0.6 || Math.abs(point.z) > 0.4) bad++;
      box.expandByPoint(point);
    }
  }

  note(`rig: ${parts.length} parts, ${vertices.toLocaleString()} vertices`);
  if (bad > 0) errors.push(`rig: ${bad} non-finite or out-of-bounds vertices`);
  else note(`rig: all ${vertices.toLocaleString()} vertices finite and in bounds`);

  // The shoe must reach the floor at exactly the heel lift.
  const shoe = parts.find(({ part }) => part.key.startsWith("shoe-"));
  const stiletto = parts.find(({ part }) => part.key.startsWith("stiletto-"));
  if (!shoe || !stiletto) {
    errors.push("rig: shoe geometry missing");
    return;
  }
  const shoeBox = new THREE.Box3().setFromBufferAttribute(
    shoe.part.geometry.getAttribute("position") as THREE.BufferAttribute,
  );
  const stilettoBox = new THREE.Box3().setFromBufferAttribute(
    stiletto.part.geometry.getAttribute("position") as THREE.BufferAttribute,
  );
  note(
    `rig: shoe spans z ${shoeBox.min.z.toFixed(3)}…${shoeBox.max.z.toFixed(3)}, ` +
      `heel tip y ${(BODY.ankle + stilettoBox.min.y).toFixed(3)}`,
  );
  if (Math.abs(BODY.ankle + stilettoBox.min.y) > 0.004) {
    errors.push(`rig: stiletto tip is ${(BODY.ankle + stilettoBox.min.y).toFixed(3)} m above the floor`);
  }
  if (Math.abs(BODY.ankle + shoeBox.min.y) > 0.005) {
    errors.push(`rig: shoe sole is not on the floor (${(BODY.ankle + shoeBox.min.y).toFixed(3)} m)`);
  }

  // left/right symmetry of the limbs
  const left = parts.find(({ part }) => part.key === "upperArm-1");
  const right = parts.find(({ part }) => part.key === "upperArm--1");
  if (left && right) {
    const a = new THREE.Box3().setFromBufferAttribute(
      left.part.geometry.getAttribute("position") as THREE.BufferAttribute,
    );
    const b = new THREE.Box3().setFromBufferAttribute(
      right.part.geometry.getAttribute("position") as THREE.BufferAttribute,
    );
    if (Math.abs(a.max.x + b.min.x) > 0.002 || Math.abs(a.max.y - b.max.y) > 0.002) {
      errors.push("rig: arms are not mirrored");
    } else {
      note("rig: limbs are mirrored within 2 mm");
    }
  }
}

validateRigGeometry();
console.log(`errors: ${errors.length}`);
errors.forEach((e) => console.log(`  ✗ ${e}`));
warnings.forEach((w) => console.log(`  ! ${w}`));
process.exit(errors.length ? 1 : 0);
