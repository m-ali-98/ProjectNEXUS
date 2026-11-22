import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost:3000" });
const g = globalThis as any;
g.XMLHttpRequest = dom.window.XMLHttpRequest;
g.window = dom.window; g.document = dom.window.document;
Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true });
g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
g.HTMLElement = dom.window.HTMLElement;
g.self = g;
const ctx: any = new Proxy({ measureText: () => ({ width: 10 }), createImageData: (w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}) }, {
  get: (t: any, k: string) => (k in t ? t[k] : () => undefined),
  set: (t: any, k: string, v: any) => { t[k] = v; return true; },
});
dom.window.HTMLCanvasElement.prototype.getContext = (() => ctx) as any;
process.on("unhandledRejection", (e: any) => console.log("UNHANDLED:", e?.message, e?.stack?.split("\n").slice(0,4).join("\n")));
const { preloadFont } = await import("troika-three-text");
preloadFont({ font: "http://localhost:3000/fonts/rajdhani-latin-600-normal.woff" }, () => console.log("preload done"));
setTimeout(() => process.exit(0), 4000);
