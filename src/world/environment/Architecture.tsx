"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";

import { M, ACCENT_HEX, type Accent } from "./materials";
import { screenTexture, type ScreenVariant } from "./proceduralUI";
import { useQuality } from "@/lib/quality";
import { ATRIUM, CORRIDOR, ROOM, dir, frameFor } from "@/world/worldLayout";
import { getSector, type SectorId } from "@/content/sectors";
import { Text } from "./Text3D";

export const FONT_DISPLAY = "/fonts/rajdhani-latin-600-normal.woff";
export const FONT_MONO = "/fonts/ibm-plex-mono-latin-400-normal.woff";

/** Shadow flags gated by the active quality profile. */
export function useShadow() {
  const q = useQuality();
  return useMemo(
    () => (q.shadows ? { castShadow: true, receiveShadow: true } : {}),
    [q.shadows],
  );
}

// ---------------------------------------------------------------------------
// Small structural helpers
// ---------------------------------------------------------------------------

export function EmissiveBar({
  length,
  position,
  rotation,
  accent = "cyan",
  intensity = 2.1,
  thickness = 0.045,
  vertical = false,
}: {
  length: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  accent?: Accent;
  intensity?: number;
  thickness?: number;
  vertical?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={vertical ? [thickness, length, thickness] : [length, thickness, thickness]} />
      <primitive object={M().accentMat(accent, intensity)} attach="material" />
    </mesh>
  );
}

export function Signage({
  title,
  subtitle,
  meta,
  position,
  rotation = [0, 0, 0],
  width = 6,
  accent = "cyan",
  size = 0.44,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  accent?: Accent;
  size?: number;
  align?: "center" | "left";
}) {
  const hex = ACCENT_HEX[accent];
  return (
    <group position={position} rotation={rotation}>
      {meta && (
        <Text
          font={FONT_MONO}
          fontSize={size * 0.28}
          color={hex}
          anchorX={align}
          anchorY="bottom"
          letterSpacing={0.22}
          position={[align === "left" ? -width / 2 : 0, size * 0.95, 0]}
          fillOpacity={0.85}
        >
          {meta}
        </Text>
      )}
      <Text
        font={FONT_DISPLAY}
        fontSize={size}
        color="#e6f6ff"
        anchorX={align}
        anchorY="middle"
        letterSpacing={0.1}
        maxWidth={width}
        textAlign={align}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          font={FONT_MONO}
          fontSize={size * 0.26}
          color="#9fb6c4"
          anchorX={align}
          anchorY="top"
          letterSpacing={0.16}
          maxWidth={width}
          textAlign={align}
          fillOpacity={0.8}
          position={[0, -size * 0.72, 0]}
        >
          {subtitle}
        </Text>
      )}
    </group>
  );
}

/** A framed emissive display surface. */
export function ScreenPanel({
  variant = "terminal",
  width = 4,
  height = 2.4,
  position,
  rotation = [0, 0, 0],
  accent = "cyan",
  frame = true,
  intensity = 1,
}: {
  variant?: ScreenVariant;
  width?: number;
  height?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  accent?: Accent;
  frame?: boolean;
  intensity?: number;
}) {
  const texture = useMemo(() => screenTexture(variant, ACCENT_HEX[accent]), [variant, accent]);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        toneMapped: false,
        color: new THREE.Color(intensity, intensity, intensity),
      }),
    [texture, intensity],
  );
  const shadow = useShadow();
  return (
    <group position={position} rotation={rotation}>
      {frame && (
        <>
          <mesh {...shadow} position={[0, 0, -0.045]}>
            <boxGeometry args={[width + 0.22, height + 0.22, 0.09]} />
            <primitive object={M().darkSteel} attach="material" />
          </mesh>
          <mesh position={[0, height / 2 + 0.16, 0.01]}>
            <boxGeometry args={[width + 0.22, 0.035, 0.05]} />
            <primitive object={M().accentMat(accent, 1.6)} attach="material" />
          </mesh>
        </>
      )}
      <mesh>
        <planeGeometry args={[width, height]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

export function WallSegment({
  width,
  height,
  depth = 0.5,
  position,
  material,
}: {
  width: number;
  height: number;
  depth?: number;
  position: [number, number, number];
  material?: THREE.Material;
}) {
  const shadow = useShadow();
  return (
    <mesh {...shadow} position={position}>
      <boxGeometry args={[width, height, depth]} />
      <primitive object={material ?? M().wall} attach="material" />
    </mesh>
  );
}

/** Vertical structural rib used along corridor and room walls. */
export function RibRow({
  count,
  spacing,
  height,
  z,
  x = 0,
  rotationY = 0,
  accent = "cyan",
  side = 1,
}: {
  count: number;
  spacing: number;
  height: number;
  z: number;
  x?: number;
  rotationY?: number;
  accent?: Accent;
  side?: 1 | -1;
}) {
  const total = (count - 1) * spacing;
  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const px = -total / 2 + spacedOffset(i, spacing);
        return (
          <group key={i} position={[px, 0, 0]}>
            <mesh position={[0, height / 2, side * 0.16]} castShadow={false}>
              <boxGeometry args={[0.12, height, 0.32]} />
              <primitive object={M().trim} attach="material" />
            </mesh>
            <mesh position={[0, height * 0.62, side * 0.33]}>
              <boxGeometry args={[0.035, height * 0.5, 0.02]} />
              <primitive object={M().accentMat(accent, 1.5)} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

const spacedOffset = (i: number, spacing: number) => i * spacing;

function railing(length: number, accent: Accent = "cyan") {
  return { length, accent };
}

export function Railing({
  length,
  position,
  rotation = [0, 0, 0],
  accent = "cyan",
}: {
  length: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  accent?: Accent;
}) {
  const posts = Math.max(2, Math.floor(length / 1.4));
  const config = railing(length, accent);
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[config.length, 0.06, 0.06]} />
        <primitive object={M().aluminum} attach="material" />
      </mesh>
      <mesh position={[0, 1.06, 0]}>
        <boxGeometry args={[config.length, 0.02, 0.09]} />
        <primitive object={M().accentMat(accent, 1.4)} attach="material" />
      </mesh>
      {Array.from({ length: posts + 1 }).map((_, i) => (
        <mesh key={i} position={[-config.length / 2 + (config.length / posts) * i, 0.52, 0]}>
          <boxGeometry args={[0.045, 1.02, 0.045]} />
          <primitive object={M().steel} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[config.length, 0.012, 0.012]} />
        <primitive object={M().wireCyanDim} attach="material" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Room shell — used by all six sectors
// ---------------------------------------------------------------------------

export function RoomShell({
  sector,
  height,
  accent = "cyan",
  wallMaterial,
  floorMaterial,
  ceilingAccent,
}: {
  sector: string;
  height: number;
  accent?: Accent;
  wallMaterial?: THREE.Material;
  floorMaterial?: THREE.Material;
  ceilingAccent?: Accent;
}) {
  const shadow = useShadow();
  const quality = useQuality();
  const W = ROOM.halfW;
  const D = ROOM.halfD;
  const dh = 2.7;
  const wall = wallMaterial ?? M().wall;
  const floorMat = floorMaterial ?? M().floor;

  const beams = useMemo(() => [-9.5, -3.2, 3.2, 9.5], []);

  return (
    <group>
      {/* floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        receiveShadow
      >
        <planeGeometry args={[W * 2, D * 2]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* reflective floor sheen strip down the aisle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[7, D * 1.72]} />
        <meshBasicMaterial
          color={ACCENT_HEX[accent]}
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* front wall with bulkhead doorway */}
      <WallSegment width={W - dh} height={height} position={[-(dh + (W - dh) / 2), height / 2, -D]} material={wall} />
      <WallSegment width={W - dh} height={height} position={[dh + (W - dh) / 2, height / 2, -D]} material={wall} />
      <WallSegment width={dh * 2} height={height - 3.9} position={[0, 3.9 + (height - 3.9) / 2, -D]} material={wall} />

      {/* back wall + side walls */}
      <WallSegment width={W * 2} height={height} position={[0, height / 2, D]} material={wall} />
      <WallSegment width={D * 2} height={height} position={[-W, height / 2, 0]} material={wall} />
      <WallSegment width={D * 2} height={height} position={[W, height / 2, 0]} material={wall} />

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[W * 2, D * 2]} />
        <primitive object={M().wallDark} attach="material" />
      </mesh>

      {/* ceiling beams */}
      {beams.map((z) => (
        <group key={z}>
          <mesh {...shadow} position={[0, height - 0.34, z]}>
            <boxGeometry args={[W * 2 - 0.4, 0.5, 0.42]} />
            <primitive object={M().darkSteel} attach="material" />
          </mesh>
          <mesh position={[0, height - 0.62, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, W * 2 - 1.2, 8]} />
            <primitive object={M().steel} attach="material" />
          </mesh>
        </group>
      ))}

      {/* light strips */}
      {[-6.4, 6.4].map((x) =>
        [-7.5, 0, 7.5].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, height - 0.68, z]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.14, 4.6, 0.14]} />
            <primitive object={M().accentMat(ceilingAccent ?? accent, 1.9)} attach="material" />
          </mesh>
        )),
      )}

      {/* side wall ribs */}
      <RibRow count={9} spacing={4} height={height * 0.82} z={-D + 0.3} x={0} rotationY={0} accent={accent} />
      <RibRow count={7} spacing={4} height={height * 0.82} z={0} x={-W + 0.3} rotationY={Math.PI / 2} accent={accent} side={1} />
      <RibRow count={7} spacing={4} height={height * 0.82} z={0} x={W - 0.3} rotationY={-Math.PI / 2} accent={accent} side={1} />

      {/* baseboard emissive lines */}
      <mesh position={[-(dh + (W - dh) / 2), 0.09, -D + 0.28]}>
        <boxGeometry args={[W - dh, 0.045, 0.05]} />
        <primitive object={M().accentMat(accent, 1.4)} attach="material" />
      </mesh>
      <mesh position={[dh + (W - dh) / 2, 0.09, -D + 0.28]}>
        <boxGeometry args={[W - dh, 0.045, 0.05]} />
        <primitive object={M().accentMat(accent, 1.4)} attach="material" />
      </mesh>
      <mesh position={[0, 0.09, D - 0.28]}>
        <boxGeometry args={[W * 2, 0.045, 0.05]} />
        <primitive object={M().accentMat(accent, 1.15)} attach="material" />
      </mesh>
      <mesh position={[-W + 0.28, 0.09, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[D * 2, 0.045, 0.05]} />
        <primitive object={M().accentMat(accent, 1.15)} attach="material" />
      </mesh>
      <mesh position={[W - 0.28, 0.09, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[D * 2, 0.045, 0.05]} />
        <primitive object={M().accentMat(accent, 1.15)} attach="material" />
      </mesh>

      {/* corridor throat */}
      <group position={[0, 0, -D - 0.05]}>
        <mesh position={[0, 3.5, -0.05]}>
          <boxGeometry args={[dh * 2 + 0.5, 0.35, 0.5]} />
          <primitive object={M().trim} attach="material" />
        </mesh>
        <mesh position={[0, 0.02, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[dh * 2, 1.2]} />
          <primitive object={M().hazard} attach="material" />
        </mesh>
      </group>

      {/* entrance portal frame */}
      <group position={[0, 0, -D + 0.1]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * (dh + 0.28), 0, 0]}>
            <mesh {...shadow} position={[0, 2, 0]}>
              <boxGeometry args={[0.5, 4, 0.7]} />
              <primitive object={M().darkSteel} attach="material" />
            </mesh>
            <mesh position={[s * -0.28, 2.4, 0]}>
              <boxGeometry args={[0.06, 2.6, 0.1]} />
              <primitive object={M().accentMat(accent, 2.2)} attach="material" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 4.1, 0]}>
          <boxGeometry args={[dh * 2 + 1.1, 0.4, 0.8]} />
          <primitive object={M().darkSteel} attach="material" />
        </mesh>
        <Signage
          title={getSector(sector as never).name.toUpperCase()}
          meta={`SECTOR ${getSector(sector as never).number}`}
          position={[0, 4.6, 0.3]}
          rotation={[0, Math.PI, 0]}
          width={7}
          accent={accent}
          size={0.5}
        />
      </group>

      {quality.volumetric && (
        <>
          <LightShaft position={[-8, 0, -3]} height={height} radius={1.8} accent={accent} />
          <LightShaft position={[8, 0, 4]} height={height} radius={1.5} accent={accent} />
        </>
      )}
    </group>
  );
}

export function LightShaft({
  position,
  height,
  radius,
  accent = "cyan",
  opacity = 1,
}: {
  position: [number, number, number];
  height: number;
  radius: number;
  accent?: Accent;
  opacity?: number;
}) {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(ACCENT_HEX[accent]),
        transparent: true,
        opacity: 0.05 * opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [accent, opacity],
  );
  return (
    <mesh position={[position[0], height / 2, position[2]]} material={material}>
      <cylinderGeometry args={[radius * 0.45, radius, height, 18, 1, true]} />
    </mesh>
  );
}

export function CeilingLamp({
  position,
  accent = "cyan",
  intensity = 1.6,
}: {
  position: [number, number, number];
  accent?: Accent;
  intensity?: number;
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.1, 16]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      <mesh position={[0, -0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 20]} />
        <primitive object={M().accentMat(accent, intensity)} attach="material" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Central atrium shell
// ---------------------------------------------------------------------------

export function AtriumShell({ height = ATRIUM.height }: { height?: number }) {
  const shadow = useShadow();
  const quality = useQuality();
  const doorHalf = ATRIUM.doorGap / 2;
  const halfSide = ATRIUM.side / 2;
  const segLen = halfSide - doorHalf;
  const ring = useRef<THREE.Group>(null);
  const ring2 = useRef<THREE.Group>(null);
  const ring3 = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (quality.id === "performance") return;
    const t = state.clock.elapsedTime;
    if (ring.current) ring.current.rotation.y = t * 0.035;
    if (ring2.current) ring2.current.rotation.y = -t * 0.022;
    if (ring3.current) ring3.current.rotation.y = t * 0.012;
  });

  const sides = useMemo(() => [0, 60, 120, 180, 240, 300], []);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <circleGeometry args={[ATRIUM.radius + 2, 6]} />
        <primitive object={M().floorAtrium} attach="material" />
      </mesh>

      {/* polished sheen: a blurred planar reflection, ULTRA only */}
      {quality.floorReflections && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
          <circleGeometry args={[ATRIUM.radius + 2, 6]} />
          <MeshReflectorMaterial
            resolution={512}
            mixBlur={2.4}
            mixStrength={0.5}
            blur={[420, 130]}
            mirror={0.65}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            depthToBlurRatioBias={0.25}
            distortion={0.12}
            metalness={0.55}
            roughness={0.55}
            color="#0b1118"
            transparent
            opacity={0.62}
          />
        </mesh>
      )}

      {/* centre inlay ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[4.6, 4.9, 64]} />
        <meshBasicMaterial color={ACCENT_HEX.cyan} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[12.2, 12.34, 96]} />
        <meshBasicMaterial color={ACCENT_HEX.cyan} transparent opacity={0.22} toneMapped={false} />
      </mesh>

      {sides.map((angleDeg) => {
        const pos = dir(angleDeg).multiplyScalar(ATRIUM.apothem);
        const frame = frameFor("atrium");
        const rotY = angleDeg * (Math.PI / 180) + Math.PI / 2;
        const meta = getSector(
          (
            [
              "application-lab",
              "systems-core",
              "infrastructure",
              "network-operations",
              "project-archive",
              "personal-quarters",
            ] as const
          )[sides.indexOf(angleDeg)],
        );
        void frame;
        return (
          <group key={angleDeg} position={[pos.x, 0, pos.z]} rotation={[0, rotY, 0]}>
            {/* wall bays either side of the doorway */}
            <mesh {...shadow} position={[-(doorHalf + segLen / 2), height / 2, 0]}>
              <boxGeometry args={[segLen, height, ATRIUM.wallThickness]} />
              <primitive object={M().wallFine} attach="material" />
            </mesh>
            <mesh {...shadow} position={[doorHalf + segLen / 2, height / 2, 0]}>
              <boxGeometry args={[segLen, height, ATRIUM.wallThickness]} />
              <primitive object={M().wallFine} attach="material" />
            </mesh>
            <mesh {...shadow} position={[0, 4.1 + (height - 4.1) / 2, 0]}>
              <boxGeometry args={[doorHalf * 2, height - 4.1, ATRIUM.wallThickness]} />
              <primitive object={M().wallFine} attach="material" />
            </mesh>

            {/* wall detail: vertical fins + emissive line */}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = -(segLen / 2) + (segLen / 5) * i;
              const side = i % 2 === 0 ? 1 : -1;
              return (
                <group key={i}>
                  <mesh position={[x + side * 0.2, height * 0.55, 0.34]}>
                    <boxGeometry args={[0.14, height * 0.72, 0.16]} />
                    <primitive object={M().trim} attach="material" />
                  </mesh>
                  <mesh position={[x + side * 0.2, height * 0.4, 0.43]}>
                    <boxGeometry args={[0.03, height * 0.34, 0.02]} />
                    <primitive object={M().accentMat(meta.accent, 1.3)} attach="material" />
                  </mesh>
                </group>
              );
            })}

            {/* doorway frame + signage */}
            <group position={[0, 0, 0]}>
              {[-1, 1].map((s) => (
                <group key={s} position={[s * (doorHalf + 0.3), 0, 0.1]}>
                  <mesh {...shadow} position={[0, 2.05, 0]}>
                    <boxGeometry args={[0.62, 4.1, 1.0]} />
                    <primitive object={M().darkSteel} attach="material" />
                  </mesh>
                  <mesh position={[0, 2.2, -0.42]}>
                    <boxGeometry args={[0.05, 3.2, 0.05]} />
                    <primitive object={M().accentMat(meta.accent, 2.2)} attach="material" />
                  </mesh>
                </group>
              ))}
              <mesh {...shadow} position={[0, 4.2, 0]}>
                <boxGeometry args={[doorHalf * 2 + 1.3, 0.55, 1.1]} />
                <primitive object={M().darkSteel} attach="material" />
              </mesh>
              <mesh position={[0, 4.2, -0.56]}>
                <boxGeometry args={[doorHalf * 2 + 1.1, 0.06, 0.04]} />
                <primitive object={M().accentMat(meta.accent, 2.4)} attach="material" />
              </mesh>
              <Signage
                title={meta.name.toUpperCase()}
                meta={`SECTOR ${meta.number}`}
                position={[0, 4.95, -0.58]}
                rotation={[0, Math.PI, 0]}
                width={7}
                accent={meta.accent}
                size={0.52}
              />
              <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[doorHalf * 2, 1.1]} />
                <primitive object={M().hazard} attach="material" />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* columns on the outer ring */}
      {[30, 90, 150, 210, 270, 330].map((angleDeg) => {
        const p = dir(angleDeg).multiplyScalar(12.4);
        return (
          <group key={angleDeg} position={[p.x, 0, p.z]}>
            <mesh {...shadow} position={[0, height / 2, 0]} castShadow>
              <boxGeometry args={[2.0, height, 2.0]} />
              <primitive object={M().concrete} attach="material" />
            </mesh>
            <mesh position={[0, height * 0.5, 0]}>
              <boxGeometry args={[2.14, 0.18, 2.14]} />
              <primitive object={M().darkSteel} attach="material" />
            </mesh>
            {[0.35, 0.5, 0.65, 0.8].map((h, i) => (
              <mesh key={i} position={[0, height * h, 1.03]}>
                <boxGeometry args={[0.8, 0.04, 0.04]} />
                <primitive object={M().accentMat("cyan", 1.8)} attach="material" />
              </mesh>
            ))}
            {/* buttress fins */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 1.2, height * 0.28, 0]}>
                <boxGeometry args={[0.5, height * 0.56, 1.6]} />
                <primitive object={M().graphite} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* mezzanine ring + glass bridges */}
      <group position={[0, 9.2, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 6, "XYZ"]} position={[0, 0, 0]}>
          <ringGeometry args={[13.6, 16.4, 6, 1]} />
          <primitive object={M().grate} attach="material" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 6]} position={[0, 0.06, 0]}>
          <ringGeometry args={[16.3, 16.45, 6]} />
          <meshBasicMaterial color={ACCENT_HEX.cyan} transparent opacity={0.4} toneMapped={false} />
        </mesh>
        {[0, 60, 120, 180, 240, 300].map((a) => {
          const p = dir(a).multiplyScalar(15);
          return (
            <Railing
              key={a}
              length={6.3}
              position={[p.x, 0.02, p.z]}
              rotation={[0, (a + 90) * (Math.PI / 180), 0]}
              accent="cyan"
            />
          );
        })}
        {/* suspended glass bridge across the void */}
        <group rotation={[0, Math.PI / 6, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[27, 0.18, 3.2]} />
            <primitive object={M().glassThick} attach="material" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 0.5, s * 1.6]}>
              <boxGeometry args={[27, 0.9, 0.06]} />
              <primitive object={M().glass} attach="material" />
            </mesh>
          ))}
          {[-10, -5, 0, 5, 10].map((x) => (
            <mesh key={x} position={[x, 0.55, 0]}>
              <boxGeometry args={[0.08, 0.08, 3.2]} />
              <primitive object={M().aluminum} attach="material" />
            </mesh>
          ))}
        </group>
      </group>

      {/* suspended rotating architectural rings */}
      <group ref={ring} position={[0, 12.2, 0]}>
        <mesh rotation={[Math.PI / 2.1, 0, 0]}>
          <torusGeometry args={[9.4, 0.055, 6, 96]} />
          <primitive object={M().wireCyan} attach="material" />
        </mesh>
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 9.4, 0, Math.sin(a) * 9.4]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.5, 0.05, 0.05]} />
              <primitive object={M().accentMat("cyan", 1.6)} attach="material" />
            </mesh>
          );
        })}
      </group>
      <group ref={ring2} position={[0, 14.4, 0]}>
        <mesh rotation={[Math.PI / 2.4, 0.4, 0]}>
          <torusGeometry args={[6.8, 0.04, 6, 80]} />
          <primitive object={M().wireCyanDim} attach="material" />
        </mesh>
      </group>
      <group ref={ring3} position={[0, 7.4, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[11.6, 0.03, 5, 100]} />
          <primitive object={M().wireCyanDim} attach="material" />
        </mesh>
      </group>

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <circleGeometry args={[ATRIUM.radius + 1.5, 6]} />
        <primitive object={M().wallDark} attach="material" />
      </mesh>
      {/* radiating ceiling ribs */}
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <mesh
            key={a}
            position={[Math.cos(rad) * 9.8, height - 0.35, -Math.sin(rad) * 9.8]}
            rotation={[0, rad, 0]}
          >
            <boxGeometry args={[19.6, 0.7, 0.5]} />
            <primitive object={M().darkSteel} attach="material" />
          </mesh>
        );
      })}
      {/* oculus */}
      <group position={[0, height - 0.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[5.4, 4.6, 0.8, 32, 1, true]} />
          <primitive object={M().trim} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <ringGeometry args={[3.3, 4.7, 48]} />
          <primitive object={M().ledWhite} attach="material" />
        </mesh>
        <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.3, 40]} />
          <meshBasicMaterial color="#0a2028" toneMapped={false} />
        </mesh>
        {quality.volumetric && <LightShaft position={[0, 0, 0]} height={height} radius={6.2} accent="white" opacity={0.9} />}
      </group>

      {/* ceiling lamps */}
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const p = dir(a).multiplyScalar(8.5);
        return <CeilingLamp key={a} position={[p.x, height - 1.2, p.z]} accent="white" intensity={1.2} />;
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Corridors connecting the atrium to each sector
// ---------------------------------------------------------------------------

export function Corridors({ accentFor }: { accentFor: (angle: number) => Accent }) {
  const shadow = useShadow();
  const angles = [0, 60, 120, 180, 240, 300];
  const W = CORRIDOR.width / 2;
  const len = CORRIDOR.length;

  return (
    <group>
      {angles.map((angleDeg) => {
        const inner = dir(angleDeg).multiplyScalar(ATRIUM.apothem);
        const mid = inner.clone().addScaledVector(dir(angleDeg), len / 2);
        const rotY = angleDeg * (Math.PI / 180) + Math.PI / 2;
        const accent = accentFor(angleDeg);

        return (
          <group key={angleDeg} position={[mid.x, 0, mid.z]} rotation={[0, rotY, 0]}>
            {/* floor + ceiling */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
              <planeGeometry args={[CORRIDOR.width, len]} />
              <primitive object={M().floor} attach="material" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CORRIDOR.height, 0]}>
              <planeGeometry args={[CORRIDOR.width, len]} />
              <primitive object={M().wallDark} attach="material" />
            </mesh>
            {/* walls */}
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh
                  {...shadow}
                  position={[s * (W + CORRIDOR.wallThickness / 2), CORRIDOR.height / 2, 0]}
                >
                  <boxGeometry args={[CORRIDOR.wallThickness, CORRIDOR.height, len]} />
                  <primitive object={M().wallFine} attach="material" />
                </mesh>
                <mesh position={[s * (W - 0.02), 0.12, 0]}>
                  <boxGeometry args={[0.04, 0.05, len]} />
                  <primitive object={M().accentMat(accent, 1.7)} attach="material" />
                </mesh>
                {/* ribs */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <mesh
                    key={i}
                    position={[s * (W - 0.06), CORRIDOR.height / 2, -len / 2 + (len / 4) * i]}
                  >
                    <boxGeometry args={[0.16, CORRIDOR.height - 0.2, 0.16]} />
                    <primitive object={M().trim} attach="material" />
                  </mesh>
                ))}
              </group>
            ))}
            {/* ceiling strip lights */}
            {[-3.2, 0, 3.2].map((z) => (
              <mesh key={z} position={[0, CORRIDOR.height - 0.12, z]}>
                <boxGeometry args={[1.4, 0.06, 0.1]} />
                <primitive object={M().accentMat(accent, 1.7)} attach="material" />
              </mesh>
            ))}
            {/* door frame at the sector end */}
            <group position={[0, 0, len / 2 - 0.1]}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * (W + 0.2), 2.1, 0]}>
                  <boxGeometry args={[0.4, 4.2, 0.6]} />
                  <primitive object={M().darkSteel} attach="material" />
                </mesh>
              ))}
              <mesh position={[0, 4.1, 0]}>
                <boxGeometry args={[CORRIDOR.width + 0.9, 0.4, 0.7]} />
                <primitive object={M().darkSteel} attach="material" />
              </mesh>
              <mesh position={[0, 3.55, -0.36]}>
                <boxGeometry args={[CORRIDOR.width - 0.5, 0.05, 0.03]} />
                <primitive object={M().accentMat(accent, 2.0)} attach="material" />
              </mesh>
            </group>
            {/* floor guide line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
              <planeGeometry args={[0.12, len]} />
              <meshBasicMaterial
                color={ACCENT_HEX[accent]}
                transparent
                opacity={0.35}
                toneMapped={false}
              />
            </mesh>
            {Array.from({ length: 3 }).map((_, i) => (
              <mesh key={i} position={[0, CORRIDOR.height - 0.5, -len / 3 + (len / 3) * i]}>
                <boxGeometry args={[CORRIDOR.width - 0.4, 0.28, 0.28]} />
                <primitive object={M().graphite} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Bulkhead doors (sector entrances)
// ---------------------------------------------------------------------------

export function BulkheadDoor({
  sector,
  height,
  accent,
  open,
}: {
  sector: string;
  height: number;
  accent: Accent;
  open: boolean;
}) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const target = useRef(0);

  useFrame((_, dt) => {
    target.current += ((open ? 1 : 0) - target.current) * Math.min(1, dt * 3.2);
    const offset = target.current * 2.55;
    if (left.current) left.current.position.x = -1.32 - offset;
    if (right.current) right.current.position.x = 1.32 + offset;
  });

  return (
    <group position={[0, 0, -ROOM.halfD + 0.3]}>
      <mesh position={[0, 2.2, 0]} ref={left}>
        <boxGeometry args={[2.64, 4.2, 0.36]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      <mesh position={[0, 2.2, 0]} ref={right}>
        <boxGeometry args={[2.64, 4.2, 0.36]} />
        <primitive object={M().darkSteel} attach="material" />
      </mesh>
      {/* hazard chevrons on each leaf */}
      {[-1.32, 1.32].map((x) => (
        <mesh key={x} position={[x, 0.9, 0.19]}>
          <planeGeometry args={[2.3, 0.4]} />
          <primitive object={M().hazard} attach="material" />
        </mesh>
      ))}
      {/* seal frame */}
      <mesh position={[0, 4.28, 0]}>
        <boxGeometry args={[6.6, 0.3, 0.6]} />
        <primitive object={M().trim} attach="material" />
      </mesh>
      <mesh position={[0, 4.1, 0.24]}>
        <boxGeometry args={[5.6, 0.05, 0.04]} />
        <primitive object={M().accentMat(accent, 2.2)} attach="material" />
      </mesh>
      {[-3.05, 3.05].map((x) => (
        <mesh key={x} position={[x, 2.1, 0.24]}>
          <boxGeometry args={[0.06, 4.0, 0.04]} />
          <primitive object={M().accentMat(accent, 1.8)} attach="material" />
        </mesh>
      ))}
      <Signage
        title={`${getSector(sector as SectorId).code} / ${getSector(sector as SectorId).name.toUpperCase()}`}
        subtitle={open ? "OPEN — PRESS E TO CYCLE" : "SEALED — PRESS E TO CYCLE"}
        position={[0, Math.min(height - 1.7, 5.1), 0.34]}
        width={6}
        accent={accent}
        size={0.3}
      />
    </group>
  );
}
