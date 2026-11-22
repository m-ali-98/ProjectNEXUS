/**
 * Headless glTF loading for the offline character tools.
 *
 * jsdom + a stubbed image loader lets three's GLTFLoader parse the real asset —
 * geometry, skin and clips intact — inside Node, with no browser and no GPU.
 */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import type * as THREE from "three";

export type LoadedGlb = {
  gltf: {
    scene: THREE.Group;
    animations: THREE.AnimationClip[];
  };
  buffer: Buffer;
  mesh: THREE.SkinnedMesh;
  THREE: typeof import("three");
  /** base colour atlas decoded to RGBA, if the asset has one */
  atlas: { width: number; height: number; data: Uint8Array } | null;
};

export async function loadGlb(path: string): Promise<LoadedGlb> {
  if (!(globalThis as { window?: unknown }).window) {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      pretendToBeVisual: true,
      url: "http://localhost:3000",
    });
    const g = globalThis as unknown as Record<string, unknown>;
    g.window = dom.window;
    g.document = dom.window.document;
    g.self = g;
    Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true });
    g.Image = dom.window.Image;
    g.HTMLElement = dom.window.HTMLElement;
    g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
  }

  const THREE = await import("three");
  (THREE.ImageLoader.prototype as unknown as { load: unknown }).load = function (
    _url: string,
    onLoad: (image: unknown) => void,
  ) {
    const image = { width: 1, height: 1, close() {} };
    setTimeout(() => onLoad(image), 0);
    return image;
  };

  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const buffer = readFileSync(path);
  const gltf = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    "",
  );
  const mesh = gltf.scene.getObjectByProperty("isSkinnedMesh", true) as
    | THREE.SkinnedMesh
    | undefined;
  if (!mesh) throw new Error(`${path} has no skinned mesh`);

  return {
    gltf: { scene: gltf.scene as unknown as THREE.Group, animations: gltf.animations },
    buffer,
    mesh,
    THREE,
    atlas: decodeBaseColour(buffer, THREE),
  };
}

/** Pulls the glTF base colour image out of the GLB and decodes it. */
function decodeBaseColour(buffer: Buffer, THREE: typeof import("three")) {
  void THREE;
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8")) as {
    images?: { name?: string; mimeType?: string; bufferView: number }[];
    materials?: { pbrMetallicRoughness?: { baseColorTexture?: { index: number } } }[];
    textures?: { source: number }[];
    bufferViews: { byteOffset?: number; byteLength: number }[];
  };
  const textureIndex = json.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture?.index ?? 0;
  const imageIndex = json.textures?.[textureIndex]?.source ?? 0;
  const image = json.images?.[imageIndex];
  if (!image) return null;
  const view = json.bufferViews[image.bufferView];
  const start = 20 + jsonLength + 8 + (view.byteOffset ?? 0);
  const bytes = buffer.subarray(start, start + view.byteLength);
  // The pipeline keeps base colour as JPEG; PNG would need a decoder too.
  const jpeg = require("jpeg-js") as typeof import("jpeg-js");
  return jpeg.decode(bytes, { useTArray: true });
}
