/**
 * Gameplay session simulation (no renderer).
 *
 *   npx tsx scripts/simulate-session.ts
 *
 * Drives the same functions the player's E key calls, for every registered
 * interaction, and asserts the resulting store/player state. This covers the
 * interaction wiring: panels, travel, discovery tracking, pause and resume.
 */
import * as THREE from "three";
import { interactions, getInteraction } from "../src/world/interactions/registry";
import { activateInteraction, closePanelAndResume, travelToSector, returnToAtrium } from "../src/world/camera/cinematics";
import { useNexusStore } from "../src/stores/nexusStore";
import { getAudio } from "../src/world/audio/audioEngine";
import { playerState } from "../src/world/player/playerState";
import { discoveries } from "../src/content/discoveries";

async function main() {
const camera = new THREE.PerspectiveCamera(70, 1.6, 0.1, 200);
const errors: string[] = [];
let panelsOpened = 0;
let travels = 0;
let discoveriesFound = 0;

const store = () => useNexusStore.getState();
const reset = () => {
  useNexusStore.setState({
    panel: null,
    overlay: "none",
    paused: false,
    transitioning: false,
    fade: "none",
    tourActive: false,
    tourStep: 0,
  });
  playerState.sector = "atrium";
};

reset();

for (const item of interactions) {
  const before = store();
  reset();
  activateInteraction(item.id, camera);
  const after = store();
  const resolved = getInteraction(item.id);
  if (!resolved) {
    errors.push(`${item.id}: not resolvable by id`);
    continue;
  }

  if (item.panel) {
    panelsOpened += 1;
    if (!after.panel) {
      errors.push(`${item.id}: expected panel ${item.panel.kind}, none opened`);
    } else if (after.panel.kind !== item.panel.kind) {
      errors.push(`${item.id}: opened ${after.panel.kind}, expected ${item.panel.kind}`);
    }
    if (!after.paused && !after.transitioning) {
      errors.push(`${item.id}: opening a panel did not pause the world`);
    }
    closePanelAndResume(camera);
    if (store().panel) errors.push(`${item.id}: panel did not close`);
  } else if (item.action?.type === "travel") {
    travels += 1;
    if (store().panel) errors.push(`${item.id}: travel opened a panel`);
  } else if (item.action?.type === "map") {
    if (store().overlay !== "map") errors.push(`${item.id}: map action did not open the map`);
  }

  if (before.discovered.includes(item.discoveryId ?? "")) continue;
  if (item.discoveryId && store().discovered.includes(item.discoveryId)) {
    discoveriesFound += 1;
  }
}

// Discovery bookkeeping: examining an exhibit records it exactly once.
reset();
const discoverable = interactions.filter((i) => i.discoveryId);
if (!discoverable.length) errors.push("no interaction carries a discovery id");
for (const item of discoverable) {
  activateInteraction(item.id, camera);
  closePanelAndResume(camera);
  const listed = store().discovered.filter((d) => d === item.discoveryId).length;
  if (listed !== 1) errors.push(`${item.discoveryId}: recorded ${listed} times after one examination`);
}
const unknown = store().discovered.filter((d) => !discoveries.some((x) => x.id === d));
if (unknown.length) errors.push(`store contains unknown discoveries: ${unknown.join(", ")}`);

// Travel transitions (async: fade, teleport, fade back).
reset();
await travelToSector("network-operations");
if (playerState.sector !== "network-operations") errors.push("travel did not move the player into the sector");
if (store().transitioning) errors.push("travel left the world in a transitioning state");
await new Promise((r) => setTimeout(r, 600));
if (store().fade !== "none") errors.push(`travel left fade at "${store().fade}"`);
if (store().transitionLabel) errors.push("travel left a stale transition label");
reset();
playerState.sector = "network-operations";
await returnToAtrium("network-operations");
if ((playerState.sector as string) !== "atrium") errors.push("exit interaction did not return the player to the atrium");

reset();
useNexusStore.setState({ discovered: [], examined: [], activated: [], visited: [] });
if (store().discovered.length) errors.push("progress reset left discoveries behind");

// Audio must be inert rather than throwing without a Web Audio context.
const audio = getAudio();
audio.start();
audio.play("open");
audio.setVolumes({ master: 0.4, muted: true });
audio.setSector("application-lab", true);
audio.dispose();

console.log("session simulation");
console.log(`  interactions: ${interactions.length}`);
console.log(`  panels opened: ${panelsOpened}`);
console.log(`  travel actions: ${travels}`);
console.log(`  discoveries recorded: ${discoverable.length}/${discoveries.length}`);
console.log(`  errors: ${errors.length}`);
errors.forEach((e) => console.log(`  ✗ ${e}`));
process.exit(errors.length ? 1 : 0);
}

void main();
