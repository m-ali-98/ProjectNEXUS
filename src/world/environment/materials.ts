import * as THREE from "three";
import {
  floorGridTexture,
  hazardTexture,
  hexFloorTexture,
  normalTexture,
  panelTexture,
  roughnessNoise,
} from "./textures";

export type Accent = "cyan" | "blue" | "amber" | "red" | "white";

export const ACCENT_HEX: Record<Accent, string> = {
  cyan: "#46e6ff",
  blue: "#5aa8ff",
  amber: "#f2a93b",
  red: "#ff5a52",
  white: "#dceaff",
};

type MatSet = ReturnType<typeof buildMaterials>;
let set: MatSet | null = null;

function buildMaterials() {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

  const emissive = (hex: string, intensity = 2.1, base = "#050a0c") =>
    std({
      color: base,
      emissive: new THREE.Color(hex),
      emissiveIntensity: intensity,
      roughness: 0.4,
      metalness: 0,
      toneMapped: false,
    });

  return {
    // --- structural surfaces ------------------------------------------------
    floor: std({
      color: "#141b24",
      map: floorGridTexture("#46e6ff"),
      normalMap: normalTexture("grid", [14, 14], 1.6),
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.44,
      metalness: 0.74,
      envMapIntensity: 1.15,
    }),
    floorAtrium: std({
      color: "#151d26",
      map: hexFloorTexture("#46e6ff"),
      normalMap: normalTexture("grid", [14, 14], 1.4),
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughness: 0.36,
      metalness: 0.8,
      envMapIntensity: 1.25,
    }),
    floorConcrete: std({
      color: "#232930",
      roughnessMap: roughnessNoise([6, 6]),
      normalMap: normalTexture("concrete", [6, 6], 1.1),
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.92,
      metalness: 0.06,
    }),
    wall: std({
      color: "#7b858d",
      map: panelTexture([2, 2]),
      normalMap: normalTexture("panel", [2, 2], 2.2),
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 0.58,
      metalness: 0.6,
      envMapIntensity: 1.05,
    }),
    wallFine: std({
      color: "#68727a",
      map: panelTexture([4, 3]),
      roughness: 0.58,
      metalness: 0.62,
    }),
    wallDark: std({ color: "#161b20", roughness: 0.72, metalness: 0.42 }),
    concrete: std({
      color: "#2b3034",
      roughnessMap: roughnessNoise([4, 4]),
      roughness: 0.95,
      metalness: 0.04,
    }),
    steel: std({ color: "#4a535c", roughness: 0.36, metalness: 0.95 }),
    darkSteel: std({ color: "#1d242b", roughness: 0.44, metalness: 0.92 }),
    graphite: std({ color: "#101519", roughness: 0.56, metalness: 0.68 }),
    aluminum: std({ color: "#98a2aa", roughness: 0.26, metalness: 1 }),
    trim: std({ color: "#2b333a", roughness: 0.42, metalness: 0.85 }),
    rubber: std({ color: "#0a0d10", roughness: 0.92, metalness: 0.05 }),
    hazard: std({
      color: "#ffffff",
      map: hazardTexture(),
      roughness: 0.7,
      metalness: 0.3,
    }),
    grate: std({ color: "#171d22", roughness: 0.7, metalness: 0.8 }),
    carbon: std({ color: "#0c0f12", roughness: 0.32, metalness: 0.55 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#9fc8d4",
      metalness: 0.1,
      roughness: 0.06,
      transmission: 0.0,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.6,
    }),
    glassThick: new THREE.MeshPhysicalMaterial({
      color: "#123039",
      metalness: 0.6,
      roughness: 0.12,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      envMapIntensity: 1.4,
    }),

    // --- emissive families --------------------------------------------------
    ledCyan: emissive(ACCENT_HEX.cyan, 2.6),
    ledBlue: emissive(ACCENT_HEX.blue, 2.4),
    ledAmber: emissive(ACCENT_HEX.amber, 2.2),
    ledRed: emissive(ACCENT_HEX.red, 2.2),
    ledWhite: emissive(ACCENT_HEX.white, 1.7),
    ledGreen: emissive("#5cf2a8", 1.9),
    panelCyan: emissive(ACCENT_HEX.cyan, 0.9, "#061117"),
    panelAmber: emissive(ACCENT_HEX.amber, 0.8, "#120d06"),
    screen: std({
      color: "#04080b",
      emissive: new THREE.Color("#0a2b33"),
      emissiveIntensity: 0.6,
      roughness: 0.18,
      metalness: 0.2,
    }),
    holo: new THREE.MeshBasicMaterial({
      color: new THREE.Color(ACCENT_HEX.cyan),
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    holoAmber: new THREE.MeshBasicMaterial({
      color: new THREE.Color(ACCENT_HEX.amber),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    holoBlue: new THREE.MeshBasicMaterial({
      color: new THREE.Color(ACCENT_HEX.blue),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    beam: new THREE.MeshBasicMaterial({
      color: new THREE.Color("#bfefff"),
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    beamAmber: new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffd7a0"),
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    wireCyan: new THREE.MeshBasicMaterial({
      color: new THREE.Color(ACCENT_HEX.cyan),
      transparent: true,
      opacity: 0.55,
      toneMapped: false,
    }),
    wireCyanDim: new THREE.MeshBasicMaterial({
      color: new THREE.Color("#1b5d6b"),
      transparent: true,
      opacity: 0.5,
      toneMapped: false,
    }),
    wireAmber: new THREE.MeshBasicMaterial({
      color: new THREE.Color(ACCENT_HEX.amber),
      transparent: true,
      opacity: 0.6,
      toneMapped: false,
    }),

    accentMat(accent: Accent, intensity = 2.3) {
      return emissive(ACCENT_HEX[accent], intensity);
    },
  };
}

export function M() {
  if (!set) set = buildMaterials();
  return set;
}

export function disposeMaterials() {
  if (!set) return;
  Object.values(set).forEach((value) => {
    if (value instanceof THREE.Material) value.dispose();
  });
  set = null;
}

/** Convenience: emissive material for an accent-driven detail. */
export function accentMaterial(accent: Accent, intensity = 2.3) {
  return M().accentMat(accent, intensity);
}
