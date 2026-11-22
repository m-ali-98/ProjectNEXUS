"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { M, ACCENT_HEX, type Accent } from "./materials";
import { FONT_DISPLAY, FONT_MONO, useShadow } from "./Architecture";
import { screenTexture, type ScreenVariant } from "./proceduralUI";
import { useQuality } from "@/lib/quality";
import type { LocalProp } from "@/world/sectorData";
import { sectorProps } from "@/world/sectorData";
import { Text } from "./Text3D";

// ---------------------------------------------------------------------------
// Console — the standard operable terminal
// ---------------------------------------------------------------------------

export function Console({
  accent = "cyan",
  variant = "terminal",
  width = 2.3,
  label,
  children,
}: {
  accent?: Accent;
  variant?: ScreenVariant;
  width?: number;
  label?: string;
  children?: React.ReactNode;
}) {
  const shadow = useShadow();
  const texture = useMemo(() => screenTexture(variant, ACCENT_HEX[accent]), [variant, accent]);
  const screenMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
    [texture],
  );
  const depth = 0.85;
  return (
    <group>
      {/* body */}
      <mesh {...shadow} position={[0, 0.46, 0]}>
        <boxGeometry args={[width * 0.78, 0.92, depth * 0.7]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      {/* top surface */}
      <mesh {...shadow} position={[0, 0.95, 0.06]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[width, 0.1, depth]} />
        <primitive object={M().carbon} attach="material" />
      </mesh>
      {/* front edge light */}
      <mesh position={[0, 0.9, depth / 2 + 0.01]}>
        <boxGeometry args={[width * 0.94, 0.025, 0.02]} />
        <primitive object={M().accentMat(accent, 1.8)} attach="material" />
      </mesh>
      {/* angled screen */}
      <group position={[0, 1.42, -0.34]} rotation={[-0.32, 0, 0]}>
        <mesh {...shadow} position={[0, 0, -0.04]}>
          <boxGeometry args={[width * 0.92, 0.86, 0.07]} />
          <primitive object={M().trim} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[width * 0.82, 0.72]} />
          <primitive object={screenMat} attach="material" />
        </mesh>
        <mesh position={[0, 0.47, 0.02]}>
          <boxGeometry args={[width * 0.9, 0.03, 0.03]} />
          <primitive object={M().accentMat(accent, 2.2)} attach="material" />
        </mesh>
      </group>
      <mesh position={[0, 1.42, -0.44]}>
        <boxGeometry args={[0.1, 0.9, 0.1]} />
        <primitive object={M().steel} attach="material" />
      </mesh>
      {/* keyboard */}
      <mesh position={[0, 1.02, 0.16]}>
        <boxGeometry args={[width * 0.62, 0.03, 0.34]} />
        <primitive object={M().graphite} attach="material" />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-width * 0.26 + i * (width * 0.13), 1.04, 0.16]}>
          <boxGeometry args={[width * 0.1, 0.012, 0.28]} />
          <primitive object={M().rubber} attach="material" />
        </mesh>
      ))}
      {/* kick plate */}
      <mesh position={[0, 0.05, depth / 2 - 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.6, 0.34]} />
        <primitive object={M().grate} attach="material" />
      </mesh>
      {label && (
        <Text
          font={FONT_MONO}
          fontSize={0.11}
          color={ACCENT_HEX[accent]}
          position={[0, 0.72, depth / 2 + 0.012]}
          anchorX="center"
          letterSpacing={0.18}
        >
          {label}
        </Text>
      )}
      {children}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Development station — larger dual-screen workstation
// ---------------------------------------------------------------------------

export function Station({ accent = "cyan", index = 0 }: { accent?: Accent; index?: number }) {
  const shadow = useShadow();
  const quality = useQuality();
  const screens = useMemo(
    () => [
      screenTexture(index % 2 === 0 ? "terminal" : "plot", ACCENT_HEX[accent]),
      screenTexture(index % 3 === 0 ? "network" : "terminal", "#9fd8e6"),
    ],
    [accent, index],
  );
  const mats = useMemo(
    () => screens.map((t) => new THREE.MeshBasicMaterial({ map: t, toneMapped: false })),
    [screens],
  );

  return (
    <group>
      <mesh {...shadow} position={[0, 0.42, 0]}>
        <boxGeometry args={[2.2, 0.84, 0.8]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh {...shadow} position={[0, 0.86, 0.04]}>
        <boxGeometry args={[2.6, 0.08, 1.15]} />
        <primitive object={M().carbon} attach="material" />
      </mesh>
      <mesh position={[0, 0.82, 0.6]}>
        <boxGeometry args={[2.5, 0.02, 0.03]} />
        <primitive object={M().accentMat(accent, 1.6)} attach="material" />
      </mesh>
      {/* dual displays */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={x} position={[x, 1.52, -0.42]} rotation={[-0.24, i === 0 ? 0.14 : -0.14, 0]}>
          <mesh {...shadow} position={[0, 0, -0.05]}>
            <boxGeometry args={[1.16, 0.74, 0.06]} />
            <primitive object={M().trim} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[1.08, 0.66]} />
            <primitive object={mats[i]} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0.02]}>
            <boxGeometry args={[1.16, 0.025, 0.03]} />
            <primitive object={M().accentMat(accent, 2.0)} attach="material" />
          </mesh>
        </group>
      ))}
      {/* monitor post */}
      <mesh position={[0, 1.12, -0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.08]} />
        <primitive object={M().steel} attach="material" />
      </mesh>
      <mesh position={[0, 1.0, 0.08]}>
        <boxGeometry args={[1.5, 0.03, 0.36]} />
        <primitive object={M().graphite} attach="material" />
      </mesh>
      {/* under-desk glow + drawers */}
      <mesh position={[0, 0.14, 0.38]}>
        <boxGeometry args={[2.0, 0.03, 0.03]} />
        <primitive object={M().accentMat(accent, 1.4)} attach="material" />
      </mesh>
      <mesh position={[1.0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.6]} />
        <primitive object={M().graphite} attach="material" />
      </mesh>
      {/* holographic projection above the desk */}
      {quality.id !== "performance" && (
        <group position={[0, 2.35, 0.05]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.38, 28]} />
            <meshBasicMaterial color={ACCENT_HEX[accent]} transparent opacity={0.45} toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <boxGeometry args={[0.8, 0.5, 0.005]} />
            <meshBasicMaterial
              color={ACCENT_HEX[accent]}
              transparent
              opacity={0.09}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Server rack
// ---------------------------------------------------------------------------

export function ServerRack({ accent = "amber", seed = 0 }: { accent?: Accent; seed?: number }) {
  const shadow = useShadow();
  const tex = useMemo(() => screenTexture("server", ACCENT_HEX[accent]), [accent]);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(0.85, 0.9, 0.9) }),
    [tex],
  );
  const blink = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!blink.current) return;
    const t = state.clock.elapsedTime;
    blink.current.children.forEach((child, i) => {
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const active = Math.sin(t * (1.4 + i * 0.37) + seed + i) > 0.2;
      m.opacity = active ? 0.95 : 0.18;
    });
  });

  return (
    <group>
      {/* cabinet */}
      <mesh {...shadow} position={[0, 1.3, 0]}>
        <boxGeometry args={[1.8, 2.6, 1.2]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      {/* front face with server texture */}
      <mesh position={[0, 1.32, 0.605]}>
        <planeGeometry args={[1.56, 2.3]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* frame trim */}
      {[-0.94, 0.94].map((x) => (
        <mesh key={x} position={[x, 1.3, 0.55]}>
          <boxGeometry args={[0.06, 2.6, 0.14]} />
          <primitive object={M().aluminum} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 2.66, 0.55]}>
        <boxGeometry args={[1.94, 0.08, 0.16]} />
        <primitive object={M().aluminum} attach="material" />
      </mesh>
      <mesh position={[0, 0.06, 0.56]}>
        <boxGeometry args={[1.94, 0.12, 0.18]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      {/* rack label */}
      <Text
        font={FONT_MONO}
        fontSize={0.1}
        color="#9fb6c4"
        position={[0, 2.5, 0.62]}
        anchorX="center"
        letterSpacing={0.16}
      >
        {`RK-${String(seed + 1).padStart(2, "0")}`}
      </Text>
      {/* status LED column */}
      <group ref={blink}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0.8, 0.42 + i * 0.26, 0.62]}>
            <boxGeometry args={[0.05, 0.09, 0.02]} />
            <meshBasicMaterial
              color={i % 4 === 0 ? ACCENT_HEX.amber : ACCENT_HEX.cyan}
              transparent
              opacity={0.7}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      {/* cable tray out the top */}
      <mesh position={[0, 2.86, -0.2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.0, 0.1, 0.5]} />
        <primitive object={M().grate} attach="material" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Pipeline pylon (Infrastructure deployment stages)
// ---------------------------------------------------------------------------

export function PipelinePylon({
  index = 1,
  label = "",
  code = "",
  accent = "amber",
}: {
  index?: number;
  label?: string;
  code?: string;
  accent?: Accent;
}) {
  const shadow = useShadow();
  const tex = useMemo(() => screenTexture("pipeline", ACCENT_HEX[accent]), [accent]);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    [tex],
  );
  return (
    <group>
      <mesh {...shadow} position={[0, 0.42, 0]}>
        <boxGeometry args={[1.5, 0.84, 1.5]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <boxGeometry args={[1.62, 0.08, 1.62]} />
        <primitive object={M().carbon} attach="material" />
      </mesh>
      {/* angled stage surface */}
      <group position={[0, 1.06, 0]} rotation={[-0.55, 0, 0]}>
        <mesh>
          <planeGeometry args={[1.3, 1.1]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </group>
      <mesh position={[0, 0.16, 0.77]}>
        <boxGeometry args={[1.4, 0.03, 0.03]} />
        <primitive object={M().accentMat(accent, 2.0)} attach="material" />
      </mesh>
      {/* stage number */}
      <Text
        font={FONT_DISPLAY}
        fontSize={0.62}
        color={ACCENT_HEX[accent]}
        position={[0, 1.85, 0]}
        anchorX="center"
        rotation={[0, 0, 0]}
        fillOpacity={0.9}
      >
        {String(index).padStart(2, "0")}
      </Text>
      <Text
        font={FONT_MONO}
        fontSize={0.1}
        color="#c8dae5"
        position={[0, 1.6, 0]}
        anchorX="center"
        letterSpacing={0.14}
        maxWidth={2.2}
        textAlign="center"
      >
        {label.toUpperCase()}
      </Text>
      <Text
        font={FONT_MONO}
        fontSize={0.075}
        color={ACCENT_HEX[accent]}
        position={[0, 0.68, 0.8]}
        anchorX="center"
        letterSpacing={0.2}
      >
        {code}
      </Text>
      {/* energy riser between stages is drawn by the sector */}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Project monolith
// ---------------------------------------------------------------------------

export function ProjectMonolith({
  missionNo,
  title,
  code,
  accent = "cyan",
  variant = "archive",
}: {
  missionNo: string;
  title: string;
  code: string;
  accent?: Accent;
  variant?: ScreenVariant;
}) {
  const shadow = useShadow();
  const tex = useMemo(() => screenTexture(variant, ACCENT_HEX[accent]), [variant, accent]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = 0.02 + Math.sin(state.clock.elapsedTime * 0.6 + Number(missionNo)) * 0.012;
  });
  return (
    <group>
      <mesh {...shadow} position={[0, 0.18, 0]}>
        <boxGeometry args={[5.2, 0.36, 2.0]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <boxGeometry args={[4.9, 0.02, 1.8]} />
        <primitive object={M().accentMat(accent, 1.1)} attach="material" />
      </mesh>
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} {...shadow} position={[x, 1.9, 0]}>
          <boxGeometry args={[0.22, 3.3, 0.9]} />
          <primitive object={M().graphite} attach="material" />
        </mesh>
      ))}
      <mesh {...shadow} position={[0, 3.3, 0]}>
        <boxGeometry args={[5.1, 0.24, 0.9]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      <group ref={group} position={[0, 0.05, 0]}>
        {/* display plate */}
        <mesh position={[0, 2.05, 0.12]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[4.3, 2.3, 0.1]} />
          <primitive object={M().carbon} attach="material" />
        </mesh>
        <mesh position={[0, 2.08, 0.19]} rotation={[-0.08, 0, 0]}>
          <planeGeometry args={[4.0, 2.0]} />
          <primitive object={mat} attach="material" />
        </mesh>
        <mesh position={[0, 3.16, 0.2]}>
          <boxGeometry args={[4.3, 0.03, 0.03]} />
          <primitive object={M().accentMat(accent, 2.4)} attach="material" />
        </mesh>
      </group>
      <Text
        font={FONT_DISPLAY}
        fontSize={0.86}
        color="#eaf8ff"
        position={[-2.3, 2.95, 0.62]}
        anchorX="left"
        letterSpacing={0.06}
      >
        {`MISSION ${missionNo}`}
      </Text>
      <Text
        font={FONT_MONO}
        fontSize={0.14}
        color={ACCENT_HEX[accent]}
        position={[-2.3, 2.55, 0.62]}
        anchorX="left"
        letterSpacing={0.18}
      >
        {code}
      </Text>
      <Text
        font={FONT_DISPLAY}
        fontSize={0.3}
        color="#b9cfdc"
        position={[-2.3, 0.62, 0.42]}
        anchorX="left"
        maxWidth={4.4}
      >
        {title.toUpperCase()}
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Holo table / pedestal / bench / cooler / crate
// ---------------------------------------------------------------------------

export function HoloTable({ accent = "cyan", w = 5.4, d = 2.6, h = 0.95 }: { accent?: Accent; w?: number; d?: number; h?: number }) {
  const shadow = useShadow();
  const quality = useQuality();
  const scan = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!scan.current) return;
    const t = (state.clock.elapsedTime * 0.35) % 1;
    scan.current.position.z = -d / 2 + t * d;
  });
  return (
    <group>
      <mesh {...shadow} position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.03, 0]}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
        <primitive object={M().carbon} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.075, 0]}>
        <planeGeometry args={[w - 0.5, d - 0.5]} />
        <primitive object={M().holo} attach="material" />
      </mesh>
      {/* edge lights */}
      {[
        [0, h + 0.06, d / 2],
        [0, h + 0.06, -d / 2],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[w, 0.03, 0.03]} />
          <primitive object={M().accentMat(accent, 2.0)} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, h + 0.06, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.02]} />
        <primitive object={M().ledWhite} attach="material" />
      </mesh>
      {quality.id !== "performance" && (
        <mesh ref={scan} position={[0, h + 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w - 0.6, 0.16]} />
          <meshBasicMaterial
            color={ACCENT_HEX[accent]}
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* projection column above the table */}
      <group position={[0, h + 1.35, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.7, 1.25, 1.9, 20, 1, true]} />
          <meshBasicMaterial
            color={ACCENT_HEX[accent]}
            transparent
            opacity={0.055}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export function Pedestal({
  accent = "cyan",
  w = 3.2,
  d = 3.2,
  h = 1.0,
}: {
  accent?: Accent;
  w?: number;
  d?: number;
  h?: number;
}) {
  const shadow = useShadow();
  return (
    <group>
      <mesh {...shadow} position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <primitive object={M().graphite} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.02, 0]}>
        <boxGeometry args={[w + 0.2, 0.04, d + 0.2]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(w, d) * 0.24, Math.min(w, d) * 0.3, 48]} />
        <primitive object={M().accentMat(accent, 2.0)} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.min(w, d) * 0.22, 32]} />
        <meshBasicMaterial color="#04090c" />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * (w / 2 + 0.04), 0.5, Math.sin(a) * (d / 2 + 0.04)]}>
            <boxGeometry args={[0.05, 0.8, 0.05]} />
            <primitive object={M().accentMat(accent, 1.4)} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}

export function Bench({ accent = "amber" }: { accent?: Accent }) {
  const shadow = useShadow();
  return (
    <group>
      <mesh {...shadow} position={[0, 0.92, 0]}>
        <boxGeometry args={[3.4, 0.12, 1.3]} />
        <primitive object={M().aluminum} attach="material" />
      </mesh>
      {[-1.5, 1.5].map((x) =>
        [-0.55, 0.55].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.45, z]}>
            <boxGeometry args={[0.08, 0.9, 0.08]} />
            <primitive object={M().steel} attach="material" />
          </mesh>
        )),
      )}
      {/* disassembled hardware */}
      <mesh position={[-0.8, 1.04, 0]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[1.0, 0.06, 0.7]} />
        <primitive object={M().carbon} attach="material" />
      </mesh>
      <mesh position={[-0.8, 1.16, 0]} rotation={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.2, 20]} />
        <primitive object={M().steel} attach="material" />
      </mesh>
      <mesh position={[-0.8, 1.27, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.02, 20]} />
        <primitive object={M().accentMat(accent, 1.6)} attach="material" />
      </mesh>
      <mesh position={[0.9, 1.04, -0.1]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.9, 0.14, 0.5]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      {/* parts tray */}
      <mesh position={[1.3, 0.99, 0.4]}>
        <boxGeometry args={[0.7, 0.05, 0.4]} />
        <primitive object={M().graphite} attach="material" />
      </mesh>
      {/* task lamp */}
      <mesh position={[1.4, 1.4, -0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
        <primitive object={M().steel} attach="material" />
      </mesh>
      <mesh position={[1.15, 1.85, -0.4]} rotation={[0.4, 0, 0.6]}>
        <coneGeometry args={[0.2, 0.28, 16, 1, true]} />
        <primitive object={M().ledWhite} attach="material" />
      </mesh>
    </group>
  );
}

export function Cooler({ accent = "cyan" }: { accent?: Accent }) {
  const shadow = useShadow();
  const fan = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (fan.current) fan.current.rotation.z += dt * 2.2;
  });
  return (
    <group>
      <mesh {...shadow} position={[0, 2.1, 0]}>
        <boxGeometry args={[2.6, 4.2, 2.2]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, 2.1, 1.11]}>
        <boxGeometry args={[2.2, 3.6, 0.02]} />
        <primitive object={M().grate} attach="material" />
      </mesh>
      {[1.2, 2.4, 3.6].map((y) => (
        <group key={y} position={[0, y, 1.14]}>
          <mesh>
            <ringGeometry args={[0.62, 0.74, 28]} />
            <primitive object={M().trim} attach="material" />
          </mesh>
          {y === 1.2 ? (
            <mesh ref={fan} position={[0, 0, 0.01]}>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]} position={[0, 0, 0.01]}>
                  <boxGeometry args={[0.95, 0.16, 0.015]} />
                  <primitive object={M().steel} attach="material" />
                </mesh>
              ))}
            </mesh>
          ) : (
            <mesh rotation={[0, 0, 0.4]} position={[0, 0, 0.01]}>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]} position={[0, 0, 0.01]}>
                  <boxGeometry args={[0.95, 0.16, 0.015]} />
                  <primitive object={M().steel} attach="material" />
                </mesh>
              ))}
            </mesh>
          )}
          <mesh position={[0, 0, 0.03]}>
            <ringGeometry args={[0.6, 0.64, 32]} />
            <primitive object={M().accentMat(accent, 1.5)} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 4.24, 0]}>
        <boxGeometry args={[1.2, 0.2, 0.9]} />
        <primitive object={M().aluminum} attach="material" />
      </mesh>
    </group>
  );
}

export function Crate({ accent = "amber", w = 1.6, d = 1.6, h = 1.2 }: { accent?: Accent; w?: number; d?: number; h?: number }) {
  const shadow = useShadow();
  return (
    <group>
      <mesh {...shadow} position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <primitive object={M().graphite} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.8, d * 0.8]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      <mesh position={[0, h * 0.55, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.7, 0.06, 0.02]} />
        <primitive object={M().accentMat(accent, 1.3)} attach="material" />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}-${sz}`} position={[(sx * w) / 2, h / 2, (sz * d) / 2]}>
            <boxGeometry args={[0.08, h, 0.08]} />
            <primitive object={M().steel} attach="material" />
          </mesh>
        )),
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Fixture dispatcher
// ---------------------------------------------------------------------------

function accentForSector(sector: string): Accent {
  switch (sector) {
    case "systems-core":
      return "blue";
    case "infrastructure":
    case "personal-quarters":
      return "amber";
    default:
      return "cyan";
  }
}

export function SectorFixtures({ sector }: { sector: keyof typeof sectorProps }) {
  const items = sectorProps[sector];
  const accent = accentForSector(sector);

  return (
    <group>
      {items.map((prop: LocalProp, index) => {
        const position: [number, number, number] = [prop.x, 0, prop.z];
        const rotation: [number, number, number] = [0, prop.rotY ?? 0, 0];
        return (
          <group key={prop.id} position={position} rotation={rotation}>
            {prop.type === "console" && <Console accent={accent} variant="terminal" />}
            {prop.type === "station" && <Station accent={accent} index={index} />}
            {prop.type === "rack" && <ServerRack accent="amber" seed={index} />}
            {/* pylons are composed by the Infrastructure sector from pipeline data */}
            {prop.type === "monolith" && <MonolithByVariant prop={prop} />}
            {prop.type === "pedestal" && (
              <Pedestal accent={accent} w={prop.w} d={prop.d} h={prop.h ?? 1} />
            )}
            {prop.type === "table" && (
              <HoloTable accent={accent} w={prop.w ?? 5} d={prop.d ?? 2.4} h={prop.h ?? 0.95} />
            )}
            {prop.type === "bench" && <Bench accent={accent} />}
            {prop.type === "cooler" && <Cooler accent={accent} />}
            {prop.type === "crate" && (
              <Crate accent={accent} w={prop.w} d={prop.d} h={prop.h} />
            )}
          </group>
        );
      })}
    </group>
  );
}

function MonolithByVariant({ prop }: { prop: LocalProp }) {
  if (!prop.variant?.startsWith("mission-")) {
    return <GenericMonolith title={prop.text ?? "ARCHIVE"} />;
  }
  const mission = prop.variant?.split("-")[1] ?? "001";
  const titles: Record<string, string> = {
    "001": "Khuzestan Yeast Platform",
    "002": "React Native Chat",
    "003": "Production Infrastructure",
    "004": "Business Automation",
  };
  const codes: Record<string, string> = {
    "001": "KHY-PLATFORM",
    "002": "RN-CHAT",
    "003": "OPS-DEPLOY",
    "004": "BIZ-AUTO",
  };
  return (
    <ProjectMonolith
      missionNo={mission}
      title={titles[mission] ?? "Mission"}
      code={codes[mission] ?? "MISSION"}
      accent="cyan"
    />
  );
}


function GenericMonolith({ title }: { title: string }) {
  const shadow = useShadow();
  return (
    <group>
      <mesh {...shadow} position={[0, 0.18, 0]}>
        <boxGeometry args={[4.4, 0.36, 1.9]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[4.0, 3.2, 0.55]} />
        <primitive object={M().graphite} attach="material" />
      </mesh>
      <mesh position={[0, 1.9, 0.29]}>
        <planeGeometry args={[3.6, 2.8]} />
        <primitive object={M().panelAmber} attach="material" />
      </mesh>
      <mesh position={[0, 3.42, 0.3]}>
        <boxGeometry args={[4.0, 0.03, 0.03]} />
        <primitive object={M().ledAmber} attach="material" />
      </mesh>
      <Text
        font={FONT_DISPLAY}
        fontSize={0.34}
        color="#f7e2c4"
        position={[0, 1.9, 0.32]}
        anchorX="center"
        anchorY="middle"
        maxWidth={3.3}
        textAlign="center"
        letterSpacing={0.08}
      >
        {title}
      </Text>
      <mesh position={[0, 0.62, 0.24]}>
        <boxGeometry args={[4.2, 0.05, 0.05]} />
        <primitive object={M().ledAmber} attach="material" />
      </mesh>
    </group>
  );
}
