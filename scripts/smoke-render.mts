/**
 * Headless render smoke test.
 *
 *   npx tsx scripts/smoke-render.mts
 *
 * Mounts the facility's scene components through @react-three/test-renderer
 * (no GPU required) to catch runtime errors in geometry, material, text and
 * hook usage that TypeScript cannot see. Canvas 2D is stubbed because the
 * procedural texture generators only draw during construction.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost:3000",
});

const fs = await import("node:fs/promises");
const baseFetch = globalThis.fetch;
// troika loads woff files through fetch; serve them from public/ so Text can resolve.
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes("/fonts/")) {
    const name = url.split("/").pop()!.split("?")[0];
    const buffer = await fs.readFile(new URL(`../public/fonts/${name}`, import.meta.url));
    return new Response(new Uint8Array(buffer), { status: 200, headers: { "content-type": "font/woff" } });
  }
  return baseFetch(input as RequestInfo, init);
}) as typeof fetch;

const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true });
g.HTMLElement = dom.window.HTMLElement;
g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
g.HTMLDivElement = dom.window.HTMLDivElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.MouseEvent = dom.window.MouseEvent;
g.Image = dom.window.Image;
g.self = g;
g.XMLHttpRequest = dom.window.XMLHttpRequest;
g.DOMParser = dom.window.DOMParser;
g.performance = globalThis.performance;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
g.matchMedia = () => ({
  matches: false,
  media: "",
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});

// Stub CanvasRenderingContext2D: procedural textures only need a live object.
const ctx2d = new Proxy(
  {
    canvas: { width: 512, height: 512 },
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({}),
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    measureText: () => ({ width: 10 }),
  },
  {
    get(target: Record<string, unknown>, key: string) {
      if (key in target) return target[key];
      return () => undefined;
    },
    set(target: Record<string, unknown>, key: string, value) {
      target[key] = value;
      return true;
    },
  },
);

dom.window.HTMLCanvasElement.prototype.getContext = function getContext(kind: string) {
  if (kind === "2d") return ctx2d as unknown as CanvasRenderingContext2D;
  return null;
} as never;

const { default: ReactThreeTestRenderer } = await import("@react-three/test-renderer");
const { default: React } = await import("react");

const { Atrium } = await import("../src/world/sectors/Atrium");
const { ApplicationLab } = await import("../src/world/sectors/ApplicationLab");
const { SystemsCore } = await import("../src/world/sectors/SystemsCore");
const { Infrastructure } = await import("../src/world/sectors/Infrastructure");
const { NetworkOperations } = await import("../src/world/sectors/NetworkOperations");
const { ProjectArchive } = await import("../src/world/sectors/ProjectArchive");
const { PersonalQuarters } = await import("../src/world/sectors/PersonalQuarters");
const { Corridors } = await import("../src/world/environment/Architecture");
const { InteractionMarkers } = await import("../src/world/interactions/InteractionMarkers");
const { renderToString } = await import("react-dom/server");
const { Hud } = await import("../src/components/hud/Hud");

const failures: string[] = [];
const results: string[] = [];

async function run(name: string, element: React.ReactElement) {
  try {
    const renderer = await ReactThreeTestRenderer.create(element, { width: 1280, height: 720 });
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 80));
      await renderer.advanceFrames(2, 0.016);
    }
    const scene = renderer.scene;
    const meshes = scene.findAll((n) => typeof n.type === "string" && n.type === "Mesh");
    const texts = scene.findAll((n) => typeof n.type === "string" && /Text/.test(n.type));
    results.push(`${name}: mounted (${meshes.length} meshes, ${texts.length} text nodes)`);
    await renderer.unmount();
  } catch (error) {
    const agg = error as Error & { errors?: Error[] };
    if (agg.errors?.length) error = agg.errors[0];
    failures.push(`${name}: ${(error as Error).message.split("\n")[0]}\n      ${(error as Error).stack?.split("\n").slice(0, 8).join("\n      ")}`);
  }
}

await run("Atrium", React.createElement(Atrium));
await run("ApplicationLab", React.createElement(ApplicationLab));
await run("SystemsCore", React.createElement(SystemsCore));
await run("Infrastructure", React.createElement(Infrastructure));
await run("NetworkOperations", React.createElement(NetworkOperations));
await run("ProjectArchive", React.createElement(ProjectArchive));
await run("PersonalQuarters", React.createElement(PersonalQuarters));
await run("Corridors", React.createElement(Corridors, { accentFor: () => "cyan" }));
await run("InteractionMarkers", React.createElement(InteractionMarkers));
try {
  const html = renderToString(React.createElement(Hud));
  results.push(`Hud: rendered ${html.length} chars of markup`);
} catch (error) {
  failures.push(`Hud: ${(error as Error).message}`);
}

console.log("render smoke test");
results.forEach((r) => console.log(`  ✓ ${r}`));
failures.forEach((f) => console.log(`  ✗ ${f}`));
process.exit(failures.length ? 1 : 0);
