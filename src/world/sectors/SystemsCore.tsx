"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard, Line } from "@react-three/drei";

import { Sector } from "./Sector";
import { FONT_MONO, ScreenPanel, Signage } from "@/world/environment/Architecture";
import { DustField, EnergyConduit, HoloRing } from "@/world/environment/Effects";
import { M } from "@/world/environment/materials";
import { systemNodes } from "@/content/systems";
import { SYSTEM_NODE_RADIUS, systemNodeLocalPosition } from "@/world/sectorData";
import { useQuality } from "@/lib/quality";
import { Text } from "@/world/environment/Text3D";

const LAYER_COLOR: Record<string, string> = {
  client: "#46e6ff",
  edge: "#5aa8ff",
  service: "#8ff0ff",
  data: "#f2a93b",
  external: "#ff9d5c",
};

function SystemGraph() {
  const quality = useQuality();
  const nodesRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Group>(null);

  const positions = useMemo(
    () =>
      systemNodes.map((_, i) => {
        const p = systemNodeLocalPosition(i, systemNodes.length);
        return { ...p, vec: new THREE.Vector3(p.x, p.y, p.z) };
      }),
    [],
  );

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: { key: string; a: THREE.Vector3; b: THREE.Vector3; strong: boolean }[] = [];
    systemNodes.forEach((node, i) => {
      node.connections.forEach((target) => {
        const j = systemNodes.findIndex((n) => n.id === target);
        if (j < 0) return;
        const key = [i, j].sort().join("-");
        if (seen.has(key)) return;
        seen.add(key);
        // Only draw links between adjacent ring positions to avoid a hairball.
        const diff = Math.min(Math.abs(i - j), systemNodes.length - Math.abs(i - j));
        if (diff > 2) return;
        list.push({ key, a: positions[i].vec, b: positions[j].vec, strong: diff === 1 });
      });
    });
    return list;
  }, [positions]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (nodesRef.current) {
      nodesRef.current.children.forEach((child, i) => {
        child.position.y = 2.35 + (i % 3) * 0.85 + Math.sin(t * 0.8 + i) * 0.09;
      });
    }
    if (pulseRef.current) pulseRef.current.rotation.y = t * 0.18;
  });

  return (
    <group>
      {/* floor ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[SYSTEM_NODE_RADIUS - 0.35, SYSTEM_NODE_RADIUS + 0.35, 96]} />
        <meshBasicMaterial color="#5aa8ff" transparent opacity={0.1} toneMapped={false} />
      </mesh>
      <HoloRing radius={SYSTEM_NODE_RADIUS} position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} accent="blue" speed={0.05} opacity={0.22} />

      {/* node orbs */}
      <group ref={nodesRef}>
        {systemNodes.map((node, i) => {
          const p = systemNodeLocalPosition(i, systemNodes.length);
          const color = LAYER_COLOR[node.layer] ?? "#46e6ff";
          return (
            <group key={node.id} position={[p.x, p.y, p.z]}>
              <mesh>
                <sphereGeometry args={[0.2, 20, 20]} />
                <meshStandardMaterial
                  color="#061014"
                  emissive={color}
                  emissiveIntensity={2.4}
                  roughness={0.25}
                  metalness={0.4}
                  toneMapped={false}
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.52, 20, 20]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.09}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[Math.PI / 2.2, i * 0.5, 0]}>
                <torusGeometry args={[0.42, 0.008, 4, 48]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
              </mesh>
              <Billboard>
                <Text
                  font={FONT_MONO}
                  fontSize={0.115}
                  color={color}
                  anchorX="center"
                  anchorY="bottom"
                  letterSpacing={0.16}
                  position={[0, 0.52, 0]}
                  maxWidth={2.6}
                  textAlign="center"
                >
                  {node.label.toUpperCase()}
                </Text>
                <Text
                  font={FONT_MONO}
                  fontSize={0.075}
                  color="#7f96a4"
                  anchorX="center"
                  anchorY="top"
                  letterSpacing={0.2}
                  position={[0, -0.3, 0]}
                >
                  {node.code}
                </Text>
              </Billboard>
            </group>
          );
        })}
      </group>

      {/* links */}
      {edges.map((edge) => (
        <Line
          key={edge.key}
          points={[
            [edge.a.x, edge.a.y, edge.a.z],
            [edge.b.x, edge.b.y, edge.b.z],
          ]}
          color="#5aa8ff"
          lineWidth={edge.strong ? 1.2 : 0.8}
          transparent
          opacity={edge.strong ? 0.42 : 0.2}
        />
      ))}

      {/* animated data flow on the strongest links */}
      {quality.id !== "performance" &&
        edges
          .filter((e) => e.strong)
          .slice(0, 6)
          .map((edge, i) => (
            <EnergyConduit
              key={`flow-${edge.key}`}
              from={edge.a}
              to={edge.b}
              accent="blue"
              thickness={0.008}
              pulses={1}
              speed={0.24}
              offset={i * 0.17}
            />
          ))}

      {/* rotating structural rings above the graph */}
      <group ref={pulseRef}>
        <HoloRing radius={4.6} position={[0, 6.1, 0]} rotation={[Math.PI / 2.1, 0.2, 0]} accent="blue" speed={0.12} opacity={0.3} />
        <HoloRing radius={3.4} position={[0, 6.9, 0]} rotation={[Math.PI / 2.5, -0.3, 0]} accent="cyan" speed={-0.08} opacity={0.22} />
      </group>

      {/* central vertical energy spine */}
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.05, 0.18, 4.6, 12, 1, true]} />
        <meshBasicMaterial
          color="#a8e8ff"
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, 24]} />
        <primitive object={M().accentMat("blue", 1.6)} attach="material" />
      </mesh>
    </group>
  );
}

export function SystemsCore() {
  return (
    <Sector id="systems-core">
      <SystemGraph />

      <ScreenPanel
        variant="network"
        width={12}
        height={4.2}
        position={[0, 4.6, 12.35]}
        rotation={[0, Math.PI, 0]}
        accent="blue"
      />
      <Signage
        title="SYSTEMS CORE"
        subtitle="Application architecture and integration — every node is inspectable"
        meta="SECTOR 02"
        position={[0, 7.4, 12.1]}
        rotation={[0, Math.PI, 0]}
        width={15}
        size={0.6}
        accent="blue"
      />

      {/* side reference panels */}
      <ScreenPanel variant="terminal" width={4.2} height={2.2} position={[-17.6, 3.2, 2]} rotation={[0, Math.PI / 2, 0]} accent="blue" frame />
      <ScreenPanel variant="plot" width={4.2} height={2.2} position={[17.6, 3.2, -2]} rotation={[0, -Math.PI / 2, 0]} accent="cyan" frame />

      <DustField radius={14} height={9} count={400} accent="blue" opacity={0.32} />

      <ambientLight intensity={0.34} color="#9dc4dd" />
      <pointLight position={[0, 2.4, 0]} intensity={22} distance={16} color="#5aa8ff" decay={2} />
      <pointLight position={[-11, 5, -8]} intensity={12} distance={18} color="#46e6ff" decay={2} />
      <pointLight position={[11, 5, 8]} intensity={10} distance={18} color="#f2a93b" decay={2} />
    </Sector>
  );
}
