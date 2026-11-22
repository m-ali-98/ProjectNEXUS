"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BODY, SHOE_PROFILE, SUIT_SEAMS, TORSO_PROFILE } from "./characterData";
import { characterMaterials } from "./characterMaterials";

/** Smooth torso silhouette from the profile table. */
function useTorso() {
  return useMemo(() => {
    const curve = new THREE.SplineCurve(
      TORSO_PROFILE.map(([radius, y]) => new THREE.Vector2(radius, y)),
    );
    const samples = curve.getPoints(34);
    const geometry = new THREE.LatheGeometry(
      samples.map((p) => new THREE.Vector2(Math.max(0.0001, p.x), p.y)),
      48,
    );
    geometry.scale(1, 1, 0.66);
    geometry.computeVertexNormals();

    const radiusAt = (y: number) => {
      let best = samples[0];
      for (const p of samples) {
        if (Math.abs(p.y - y) < Math.abs(best.y - y)) best = p;
      }
      return best.x;
    };

    return { geometry, radiusAt };
  }, []);
}

/**
 * Torso: one lathed shell (so the waist, ribcage and hips form a continuous
 * curve), plus bust forms, seam rings, a belt and a restrained accent trim.
 * Local origin is the hip joint; the shell spans −0.13 m to +0.565 m.
 */
export function Torso() {
  const mats = characterMaterials();
  const { geometry, radiusAt } = useTorso();

  return (
    <group>
      <mesh geometry={geometry} material={mats.suit} castShadow receiveShadow />

      {/* bust forms, blended into the suit */}
      {[1, -1].map((side) => (
        <mesh
          key={`bust-${side}`}
          material={mats.suit}
          scale={[0.062, 0.052, 0.05]}
          position={[side * 0.052, 0.352, -0.072]}
          rotation={[0.18, 0, side * 0.22]}
        >
          <sphereGeometry args={[1, 22, 18]} />
        </mesh>
      ))}

      {/* shoulder blades / upper back volume */}
      <mesh material={mats.suit} scale={[0.13, 0.07, 0.055]} position={[0, 0.45, 0.06]}>
        <sphereGeometry args={[1, 22, 16]} />
      </mesh>

      {/* panel seams around the waist and hips */}
      {SUIT_SEAMS.map((y) => (
        <mesh
          key={`seam-${y}`}
          material={mats.suitEdge}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 0.66, 1]}
        >
          <torusGeometry args={[radiusAt(y) * 1.005, 0.0038, 6, 52]} />
        </mesh>
      ))}

      {/* centre zip line down the back */}
      <mesh material={mats.suitEdge} position={[0, 0.3, 0.099]}>
        <boxGeometry args={[0.008, 0.42, 0.006]} />
      </mesh>

      {/* chest yoke: a slightly wider panel across the collarbones */}
      <mesh material={mats.suitPanel} position={[0, 0.495, 0.03]} rotation={[-0.28, 0, 0]}>
        <cylinderGeometry args={[0.132, 0.145, 0.075, 30, 1, true]} />
      </mesh>

      {/* collar trim */}
      <mesh material={mats.suitEdge} position={[0, 0.545, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.062, 0.009, 8, 36]} />
      </mesh>
      <mesh material={mats.accent} position={[0, 0.549, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0605, 0.0016, 6, 40]} />
      </mesh>

      {/* belt at the waist */}
      <mesh material={mats.suitPanel} position={[0, 0.175, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.67, 1]}>
        <torusGeometry args={[radiusAt(0.175) * 1.02, 0.021, 8, 46]} />
      </mesh>
      <mesh material={mats.suitEdge} position={[0, 0.175, -0.098]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.038, 0.014]} />
      </mesh>

      {/* outer thigh trim: two narrow accent strips */}
      {[1, -1].map((side) => (
        <mesh
          key={`trim-${side}`}
          material={mats.accent}
          position={[side * 0.112, 0.06, 0]}
          rotation={[0, 0, side * 0.06]}
        >
          <boxGeometry args={[0.0028, 0.24, 0.004]} />
        </mesh>
      ))}

      {/* pelvis underside, keeps the lathe from looking hollow in low shots */}
      <mesh material={mats.suit} scale={[0.128, 0.05, 0.08]} position={[0, -0.09, 0]}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    </group>
  );
}

export function ShoulderCap() {
  const mats = characterMaterials();
  return (
    <mesh material={mats.suit} scale={[0.052, 0.048, 0.05]}>
      <sphereGeometry args={[1, 18, 14]} />
    </mesh>
  );
}

/** Upper arm; bone origin at the shoulder, bone runs down local −Y. */
export function UpperArm() {
  const mats = characterMaterials();
  return (
    <group>
      <mesh material={mats.suit} position={[0, -0.145, 0]} castShadow>
        <cylinderGeometry args={[BODY.upperArm, BODY.elbow, 0.29, 20, 1]} />
      </mesh>
      <mesh material={mats.suit} position={[0, -0.29, 0]}>
        <sphereGeometry args={[BODY.elbow, 16, 12]} />
      </mesh>
    </group>
  );
}

/** Forearm; bone origin at the elbow, bone runs to the wrist at −0.26. */
export function Forearm() {
  const mats = characterMaterials();
  return (
    <group>
      <mesh material={mats.suit} position={[0, -0.13, 0]} castShadow>
        <cylinderGeometry args={[BODY.elbow, BODY.wrist, 0.26, 18, 1]} />
      </mesh>
      {/* glove cuff */}
      <mesh material={mats.suitEdge} position={[0, -0.252, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BODY.wrist * 1.12, 0.006, 6, 24]} />
      </mesh>
      <mesh material={mats.accent} position={[0, -0.243, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BODY.wrist * 1.14, 0.0016, 5, 22]} />
      </mesh>
    </group>
  );
}

/** Hand: palm, four fingers with two phalanges, and a thumb. */
export function Hand({ side }: { side: 1 | -1 }) {
  const mats = characterMaterials();
  const fingers = [
    { x: -0.026, len: 0.038, r: 0.0072 },
    { x: -0.009, len: 0.043, r: 0.0076 },
    { x: 0.008, len: 0.041, r: 0.0072 },
    { x: 0.024, len: 0.033, r: 0.0064 },
  ];

  return (
    <group>
      {/* wrist */}
      <mesh material={mats.skin} position={[0, -0.015, 0]}>
        <sphereGeometry args={[BODY.wrist, 14, 12]} />
      </mesh>
      {/* palm */}
      <mesh material={mats.skin} position={[0, -0.055, 0]} scale={[1, 1.25, 0.62]}>
        <sphereGeometry args={[0.031, 18, 14]} />
      </mesh>
      {/* fingers */}
      {fingers.map((finger, i) => (
        <group key={i} position={[finger.x * side, -0.084, -0.002]} rotation={[0.06, 0, finger.x * 2.2 * side]}>
          <mesh material={mats.skin} position={[0, -finger.len * 0.5, 0]}>
            <capsuleGeometry args={[finger.r, finger.len * 0.72, 4, 10]} />
          </mesh>
          <mesh material={mats.skin} position={[0, -finger.len - 0.012, -0.004]} rotation={[0.22, 0, 0]}>
            <capsuleGeometry args={[finger.r * 0.86, 0.02, 4, 10]} />
          </mesh>
        </group>
      ))}
      {/* thumb */}
      <group position={[side * 0.028, -0.05, -0.012]} rotation={[0.3, 0, side * 0.85]}>
        <mesh material={mats.skin} position={[0, -0.02, 0]}>
          <capsuleGeometry args={[0.0082, 0.026, 4, 10]} />
        </mesh>
      </group>
    </group>
  );
}

/** Thigh; bone origin at the hip joint, runs to the knee at −0.40. */
export function Thigh() {
  const mats = characterMaterials();
  return (
    <group>
      <mesh material={mats.suit} position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[BODY.thighTop, BODY.thighBottom, 0.4, 22, 1]} />
      </mesh>
      {/* hip blend */}
      <mesh material={mats.suit} position={[0, -0.02, 0]}>
        <sphereGeometry args={[BODY.thighTop, 18, 14]} />
      </mesh>
      {/* thigh seam */}
      <mesh material={mats.suitEdge} position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.077, 0.0032, 6, 30]} />
      </mesh>
      <mesh material={mats.suit} position={[0, -0.4, 0]}>
        <sphereGeometry args={[BODY.thighBottom, 16, 12]} />
      </mesh>
    </group>
  );
}

/** Shin; bone origin at the knee, runs to the ankle at −0.39. */
export function Shin() {
  const mats = characterMaterials();
  return (
    <group>
      <mesh material={mats.suit} position={[0, -0.195, 0]} castShadow>
        <cylinderGeometry args={[BODY.calfTop, BODY.calfBottom, 0.39, 20, 1]} />
      </mesh>
      {/* calf muscle */}
      <mesh material={mats.suit} scale={[0.062, 0.085, 0.055]} position={[0, -0.14, 0.016]}>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      {/* ankle cuff */}
      <mesh material={mats.suitEdge} position={[0, -0.372, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BODY.calfBottom * 1.1, 0.005, 6, 20]} />
      </mesh>
    </group>
  );
}

/**
 * Stiletto heel.
 *
 * Local origin is the ankle joint (y = 0.115 world). The upper is an extruded
 * side profile (SHOE_PROFILE) so the arch, toe and counter read correctly from
 * the side; the stiletto is a vertical spike in the ankle frame that reaches
 * exactly the floor.
 */
export function Heel({ side }: { side: 1 | -1 }) {
  const mats = characterMaterials();

  const upper = useMemo(() => {
    const shape = new THREE.Shape();
    SHOE_PROFILE.forEach(([z, y], i) => {
      if (i === 0) shape.moveTo(z, y);
      else shape.lineTo(z, y);
    });
    shape.closePath();

    const width = 0.078;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 8,
    });
    // Shape x → world z, extrusion → world x.
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(width / 2, 0, 0);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  return (
    <group>
      {/* ankle strap */}
      <mesh material={mats.leather} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <torusGeometry args={[0.036, 0.0085, 8, 24]} />
      </mesh>
      <mesh material={mats.suitEdge} position={[side * 0.034, 0.0, 0]}>
        <boxGeometry args={[0.012, 0.012, 0.01]} />
      </mesh>

      {/* shoe upper */}
      <mesh geometry={upper} material={mats.leather} castShadow receiveShadow />

      {/* sole plate */}
      <mesh material={mats.suitEdge} position={[0, -0.1125, -0.085]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.074, 0.006, 0.15]} />
      </mesh>

      {/* stiletto: vertical in the ankle frame, tip at world y = 0 */}
      <mesh material={mats.metal} position={[0, -0.062, 0.045]} rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.0085, 0.0045, 0.108, 12, 1]} />
      </mesh>
      <mesh material={mats.metal} position={[0, -0.1135, 0.0475]}>
        <cylinderGeometry args={[0.0052, 0.0038, 0.011, 10]} />
      </mesh>

      {/* restrained accent on the arch */}
      <mesh material={mats.accent} position={[0, -0.1005, -0.09]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.06, 0.0022, 0.004]} />
      </mesh>
    </group>
  );
}
