import * as THREE from "three";

/**
 * Character material set.
 *
 * Skin, bodysuit, hair, eyes and hardware are physically-based but deliberately
 * restrained: no rim-glow tricks, no unlit "toon" shading. The suit is a matte
 * technical textile with a thin clearcoat (so highlights roll along the limbs),
 * skin carries a light sheen instead of a subsurface shader, and the heels are
 * split between leather uppers and polished metal.
 */

export type CharacterMaterials = ReturnType<typeof buildCharacterMaterials>;

let cache: CharacterMaterials | null = null;

function buildCharacterMaterials() {
  // Subtle fabric weave, shared by the suit panels.
  const weave = (() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size; i += 4) {
      ctx.strokeStyle = i % 8 === 0 ? "#8d8d8d" : "#767676";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 16);
    texture.anisotropy = 4;
    texture.colorSpace = THREE.NoColorSpace;
    return texture;
  })();

  // Pore-scale relief. At 1 m viewing distance the dot-level normal breaks up
  // the specular highlight on the chest and arms instead of leaving a plastic
  // sheen, which is what makes procedural skin read as skin.
  const pores = (() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(size, size);
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const height = new Float32Array(size * size);
    for (let i = 0; i < height.length; i++) height[i] = rand();
    // light box blur so the grain clusters like real pores
    const blurred = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            sum += height[((y + oy + size) % size) * size + ((x + ox + size) % size)];
          }
        }
        blurred[y * size + x] = sum / 9;
      }
    }
    const at = (x: number, y: number) => blurred[((y + size) % size) * size + ((x + size) % size)];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = -(at(x + 1, y) - at(x - 1, y)) * 5;
        const ny = -(at(x, y + 1) - at(x, y - 1)) * 5;
        const len = Math.hypot(nx, ny, 1);
        const i = (y * size + x) * 4;
        img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
        img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
        img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 9);
    texture.anisotropy = 4;
    texture.colorSpace = THREE.NoColorSpace;
    return texture;
  })();

  const skin = new THREE.MeshPhysicalMaterial({
    color: "#c68a6f",
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.62,
    sheen: 0.35,
    sheenColor: new THREE.Color("#ffd2bd"),
    sheenRoughness: 0.7,
    normalMap: pores ?? undefined,
    normalScale: new THREE.Vector2(0.16, 0.16),
    envMapIntensity: 1.05,
  });

  const skinDeep = skin.clone();
  skinDeep.color = new THREE.Color("#a86e56");
  skinDeep.roughness = 0.58;
  skinDeep.normalScale = new THREE.Vector2(0.24, 0.24);

  const suit = new THREE.MeshPhysicalMaterial({
    color: "#141a20",
    roughness: 0.44,
    metalness: 0.22,
    clearcoat: 0.72,
    clearcoatRoughness: 0.26,
    sheen: 0.5,
    sheenColor: new THREE.Color("#587c8d"),
    sheenRoughness: 0.5,
    normalMap: weave ?? undefined,
    normalScale: new THREE.Vector2(0.22, 0.22),
    envMapIntensity: 1.05,
  });

  const suitPanel = suit.clone();
  suitPanel.color = new THREE.Color("#1b232b");
  suitPanel.roughness = 0.52;
  suitPanel.clearcoat = 0.4;

  const suitEdge = new THREE.MeshStandardMaterial({
    color: "#2a3944",
    roughness: 0.35,
    metalness: 0.75,
    envMapIntensity: 1.2,
  });

  const accent = new THREE.MeshStandardMaterial({
    color: "#050b0e",
    emissive: new THREE.Color("#46e6ff"),
    emissiveIntensity: 2.4,
    roughness: 0.4,
    metalness: 0.2,
    toneMapped: false,
  });

  const hair = new THREE.MeshPhysicalMaterial({
    color: "#241a15",
    roughness: 0.3,
    metalness: 0.08,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
    sheen: 0.85,
    sheenColor: new THREE.Color("#a9713f"),
    sheenRoughness: 0.35,
    envMapIntensity: 1.1,
  });

  const hairTip = hair.clone();
  hairTip.color = new THREE.Color("#3a2a20");

  const sclera = new THREE.MeshPhysicalMaterial({
    color: "#f4f1ec",
    roughness: 0.22,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
  });

  const iris = new THREE.MeshPhysicalMaterial({
    color: "#436b52",
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: new THREE.Color("#0c1a12"),
    emissiveIntensity: 0.35,
  });

  const pupil = new THREE.MeshBasicMaterial({ color: "#05070a" });

  const cornea = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.02,
    metalness: 0,
    transparent: true,
    opacity: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.2,
    depthWrite: false,
  });

  const lips = new THREE.MeshPhysicalMaterial({
    color: "#a8433f",
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.65,
    clearcoatRoughness: 0.25,
  });

  const brow = new THREE.MeshStandardMaterial({ color: "#2a1d17", roughness: 0.7, metalness: 0 });

  const leather = new THREE.MeshPhysicalMaterial({
    color: "#0c1013",
    roughness: 0.24,
    metalness: 0.15,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.3,
  });

  const metal = new THREE.MeshStandardMaterial({
    color: "#cfd8e0",
    roughness: 0.2,
    metalness: 1,
    envMapIntensity: 1.6,
  });

  return {
    skin,
    skinDeep,
    suit,
    suitPanel,
    suitEdge,
    accent,
    hair,
    hairTip,
    sclera,
    iris,
    pupil,
    cornea,
    lips,
    brow,
    leather,
    metal,
  };
}

export function characterMaterials() {
  if (!cache) cache = buildCharacterMaterials();
  return cache;
}
