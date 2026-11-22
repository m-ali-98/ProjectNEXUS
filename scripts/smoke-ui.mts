/**
 * Headless UI smoke test.
 *
 *   npx tsx scripts/smoke-ui.mts
 *
 * Server-renders every overlay and every panel payload so that selector,
 * content-shape and JSX errors surface without a browser.
 */
import { JSDOM } from "jsdom";
import type { ReactElement } from "react";
import type { PanelState } from "../src/stores/nexusStore";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true });
g.HTMLElement = dom.window.HTMLElement;
g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
g.self = g;
const matchMediaStub = () => ({
  matches: false,
  media: "",
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});
g.matchMedia = matchMediaStub;
dom.window.matchMedia = matchMediaStub as never;

const React = (await import("react")).default;
const { createRoot } = await import("react-dom/client");
const { act } = await import("react");
const { useNexusStore } = await import("../src/stores/nexusStore");
const { PanelHost } = await import("../src/components/overlays/PanelHost");
const { BootOverlay } = await import("../src/components/overlays/BootOverlay");
const { FacilityMap } = await import("../src/components/overlays/FacilityMap");
const { PauseMenu } = await import("../src/components/overlays/PauseMenu");
const { TransitionOverlay, SectorBanner, ToastHost, TourCaption } = await import(
  "../src/components/overlays/GameOverlays"
);
const { MobileControls } = await import("../src/components/MobileControls");
const { WebGLFallback } = await import("../src/components/WebGLFallback");

const failures: string[] = [];
const results: string[] = [];

async function check(name: string, element: ReactElement, expectText?: RegExp) {
  try {
    const container = dom.window.document.createElement("div");
    dom.window.document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(element);
    });
    const html = container.innerHTML;
    await act(async () => {
      root.unmount();
    });
    container.remove();
    if (expectText && !expectText.test(html)) {
      failures.push(`${name}: rendered but missing expected content ${expectText}`);
      return;
    }
    results.push(`${name} (${html.length} chars)`);
  } catch (error) {
    const message = (error as Error)?.message ?? String(error);
    const stack = (error as Error)?.stack?.split("\n").slice(1, 4).join(" | ") ?? "";
    failures.push(`${name}: ${message.split("\n")[0]} ${stack}`);
  }
}

const panels: PanelState[] = [
  { kind: "project", id: "mission-001" },
  { kind: "project", id: "mission-002" },
  { kind: "project", id: "mission-003" },
  { kind: "project", id: "mission-004" },
  { kind: "systemNode", id: "sys-api" },
  { kind: "pipeline", id: "inf-stage-dns" },
  { kind: "infraTerminal", id: "inf-vps" },
  { kind: "labStation", id: "lab-device-mock" },
  { kind: "chat" },
  { kind: "dnsRecord", id: "dns-a" },
  { kind: "mailAuth", id: "mail-spf" },
  { kind: "tls" },
  { kind: "proxy" },
  { kind: "identity" },
  { kind: "philosophy" },
  { kind: "timeline" },
  { kind: "bio" },
  { kind: "interests" },
  { kind: "learning" },
  { kind: "contact" },
  { kind: "missionIndex" },
  { kind: "help" },
  { kind: "discovery", id: "discovery-001" },
  { kind: "networkIndex" },
  { kind: "architecture" },
];

for (const panel of panels) {
  useNexusStore.setState({ panel, overlay: "panel", paused: true });
  await check(`panel:${panel.kind}${"id" in panel ? `/${panel.id}` : ""}`, React.createElement(PanelHost));
}

useNexusStore.setState({ panel: null, overlay: "boot" });
await check("BootOverlay", React.createElement(BootOverlay), /ENTER FACILITY|INITIALIZING/i);

useNexusStore.setState({ overlay: "map", paused: true });
await check("FacilityMap", React.createElement(FacilityMap), /FAST TRAVEL|MAP/i);

useNexusStore.setState({ overlay: "pause", paused: true });
await check("PauseMenu", React.createElement(PauseMenu), /RESUME/i);

useNexusStore.setState({ overlay: "none", paused: false });
await check("TransitionOverlay", React.createElement(TransitionOverlay));
await check("SectorBanner", React.createElement(SectorBanner));
await check("ToastHost", React.createElement(ToastHost));
await check("TourCaption", React.createElement(TourCaption));
await check("MobileControls", React.createElement(MobileControls));
await check("WebGLFallback", React.createElement(WebGLFallback), /WebGL|portfolio/i);

console.log("ui smoke test");
results.forEach((r) => console.log(`  ✓ ${r}`));
failures.forEach((f) => console.log(`  ✗ ${f}`));
process.exit(failures.length ? 1 : 0);
