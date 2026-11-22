"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BODY } from "./characterData";
import { characterMaterials } from "./characterMaterials";
import { playerState } from "@/world/player/playerState";

/**
 * Head and face.
 *
 * Built from ellipsoids and thin arcs: skull, cheekbones, jaw, chin, brow ridge,
 * nose with a tip, two eyeballs with iris/pupil/cornea and a catchlight, lid
 * rims, brows and lips. Everything is scaled into a single ~0.2 m head so the
 * silhouette reads at third-person distance, where the face is only a few pixels
 * tall but the profile still matters.
 *
 * Local origin is the head's centre of rotation at the top of the neck; the
 * character faces local −Z.
 */
export function HeadModel() {
  const mats = characterMaterials();

  const eye = (side: 1 | -1) => (
    <group key={side} position={[side * BODY.eyeSeparation, 0.012, -BODY.eyeForward * 0.86]}>
      {/* eyeball */}
      <mesh material={mats.sclera}>
        <sphereGeometry args={[BODY.eyeRadius, 24, 20]} />
      </mesh>
      {/* iris */}
      <mesh position={[0, 0, -BODY.eyeRadius * 0.9]} rotation={[0, 0, 0]} material={mats.iris}>
        <circleGeometry args={[0.0068, 20]} />
      </mesh>
      {/* pupil */}
      <mesh position={[0, 0, -BODY.eyeRadius * 0.94]} material={mats.pupil}>
        <circleGeometry args={[0.0031, 16]} />
      </mesh>
      {/* catchlight: a tiny emissive dot, the cheapest way to make eyes look alive */}
      <mesh position={[0.0026, 0.0034, -BODY.eyeRadius * 0.97]}>
        <circleGeometry args={[0.0012, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {/* cornea */}
      <mesh material={mats.cornea}>
        <sphereGeometry args={[BODY.eyeRadius * 1.02, 20, 16]} />
      </mesh>
      {/* upper lid rim */}
      <mesh
        position={[0, 0.0055, -0.004]}
        rotation={[Math.PI * 0.06, 0, side * 0.12]}
        material={mats.skin}
      >
        <torusGeometry args={[BODY.eyeRadius * 0.98, 0.0019, 6, 20, Math.PI * 1.05]} />
      </mesh>
      {/* lower lid rim */}
      <mesh position={[0, -0.005, -0.003]} rotation={[Math.PI * 0.94, 0, side * 0.1]} material={mats.skinDeep}>
        <torusGeometry args={[BODY.eyeRadius * 0.96, 0.0014, 6, 18, Math.PI * 0.8]} />
      </mesh>
      {/* brow */}
      <mesh
        position={[side * 0.001, 0.0215, -BODY.eyeForward * 0.9]}
        rotation={[0.25, 0, side * 0.28]}
        material={mats.brow}
      >
        <torusGeometry args={[0.0125, 0.0018, 5, 14, Math.PI * 0.62]} />
      </mesh>
    </group>
  );

  return (
    <group>
      {/* skull */}
      <mesh material={mats.skin} scale={[0.092, 0.113, 0.104]} position={[0, 0.012, 0]}>
        <sphereGeometry args={[1, 32, 28]} />
      </mesh>
      {/* back of the skull */}
      <mesh material={mats.skin} scale={[0.086, 0.094, 0.09]} position={[0, 0.022, 0.028]}>
        <sphereGeometry args={[1, 24, 20]} />
      </mesh>
      {/* cheekbones */}
      {[1, -1].map((side) => (
        <mesh
          key={`cheek-${side}`}
          material={mats.skin}
          scale={[0.028, 0.021, 0.024]}
          position={[side * 0.049, -0.012, -0.062]}
        >
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
      ))}
      {/* jaw + chin */}
      <mesh material={mats.skin} scale={[0.062, 0.05, 0.058]} position={[0, -0.055, -0.028]}>
        <sphereGeometry args={[1, 24, 18]} />
      </mesh>
      <mesh material={mats.skin} scale={[0.021, 0.017, 0.02]} position={[0, -0.077, -0.062]}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      {/* brow ridge */}
      <mesh material={mats.skin} scale={[0.078, 0.018, 0.03]} position={[0, 0.033, -0.07]}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      {/* nose bridge + tip + nostrils */}
      <mesh
        material={mats.skin}
        position={[0, -0.004, -0.092]}
        rotation={[0.34, 0, 0]}
        scale={[0.0095, 0.03, 0.012]}
      >
        <sphereGeometry args={[1, 16, 14]} />
      </mesh>
      <mesh material={mats.skin} scale={[0.0145, 0.013, 0.013]} position={[0, -0.028, -0.096]}>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh
          key={`nostril-${side}`}
          material={mats.skinDeep}
          scale={[0.005, 0.004, 0.005]}
          position={[side * 0.0115, -0.034, -0.088]}
        >
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
      {/* philtrum + lips */}
      <mesh material={mats.lips} scale={[0.0235, 0.0072, 0.009]} position={[0, -0.052, -0.083]}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh material={mats.lips} scale={[0.0215, 0.0095, 0.0105]} position={[0, -0.063, -0.082]}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh material={mats.skinDeep} scale={[0.02, 0.0016, 0.004]} position={[0, -0.0575, -0.089]}>
        <sphereGeometry args={[1, 16, 8]} />
      </mesh>
      {/* ears */}
      {[1, -1].map((side) => (
        <group key={`ear-${side}`} position={[side * 0.088, -0.005, 0.008]} rotation={[0, side * 0.25, 0]}>
          <mesh material={mats.skin} scale={[0.008, 0.026, 0.017]}>
            <sphereGeometry args={[1, 14, 12]} />
          </mesh>
          <mesh material={mats.skinDeep} scale={[0.004, 0.016, 0.01]} position={[side * 0.003, 0, 0.002]}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
        </group>
      ))}
      {eye(1)}
      {eye(-1)}
    </group>
  );
}

/**
 * Long hair: a sculpted cap, a back mass and swept strand tubes. The group
 * sways a little with acceleration so it does not look welded to the skull.
 */
export function Hair() {
  const mats = characterMaterials();
  const group = useRef<THREE.Group>(null);

  const strands = useMemo(() => {
    const out: { curve: THREE.CatmullRomCurve3; radius: number; tip: boolean }[] = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const side = t * 2 - 1; // -1..1 across the head
      const back = Math.abs(side) * 0.6 + 0.4; // more strands at the back
      const top = new THREE.Vector3(side * 0.075, 0.075, 0.02 + back * 0.055);
      const mid = new THREE.Vector3(
        side * (0.098 + Math.abs(side) * 0.012),
        -0.02 - Math.abs(side) * 0.02,
        0.082 + back * 0.02,
      );
      const end = new THREE.Vector3(
        side * (0.11 + Math.abs(side) * 0.03),
        -0.24 - (i % 3) * 0.035,
        0.055 + back * 0.03 - Math.abs(side) * 0.02,
      );
      const tip = new THREE.Vector3(end.x * 1.06, end.y - 0.075, end.z - 0.012);
      out.push({
        curve: new THREE.CatmullRomCurve3([top, mid, end, tip]),
        radius: 0.0095 - Math.abs(side) * 0.0012,
        tip: i % 2 === 0,
      });
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = playerState.speed * 0.02 + Math.sin(performance.now() * 0.0012) * 0.012;
    group.current.rotation.x += (target - group.current.rotation.x) * Math.min(1, delta * 4);
    group.current.rotation.z = Math.sin(performance.now() * 0.0007) * 0.02;
  });

  return (
    <group ref={group}>
      {/* crown cap */}
      <mesh material={mats.hair} scale={[0.104, 0.098, 0.108]} position={[0, 0.028, 0.008]}>
        <sphereGeometry args={[1, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      </mesh>
      {/* back mass falling to the shoulder blades */}
      <mesh material={mats.hair} scale={[0.098, 0.15, 0.075]} position={[0, -0.1, 0.07]}>
        <sphereGeometry args={[1, 24, 20]} />
      </mesh>
      {/* side sweep left and right */}
      {[1, -1].map((side) => (
        <mesh
          key={`sweep-${side}`}
          material={mats.hair}
          scale={[0.026, 0.1, 0.05]}
          position={[side * 0.088, -0.055, 0.045]}
          rotation={[0, 0, side * 0.1]}
        >
          <sphereGeometry args={[1, 18, 16]} />
        </mesh>
      ))}
      {strands.map((strand, i) => (
        <mesh key={i} material={strand.tip ? mats.hairTip : mats.hair}>
          <tubeGeometry args={[strand.curve, 14, strand.radius, 6, false]} />
        </mesh>
      ))}
    </group>
  );
}
