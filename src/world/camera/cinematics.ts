import * as THREE from "three";
import { useNexusStore, type PanelState } from "@/stores/nexusStore";
import { getSector, type SectorId } from "@/content/sectors";
import { cameraRef, director } from "./director";
import { exhibitPose } from "./framing";
import { thirdPersonPose } from "./thirdPerson";
import {
  exitSectorToAtrium,
  playerState,
  spawnInSector,
} from "@/world/player/playerState";
import { getAudio } from "@/world/audio/audioEngine";
import { getInteraction } from "@/world/interactions/registry";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let travelToken = 0;
let tourToken = 0;

export function sectorBanner(sector: SectorId) {
  const meta = getSector(sector);
  return { title: meta.name, subtitle: meta.subtitle, code: `SECTOR ${meta.number}` };
}

/** Fade cut into a sector. Physical corridors stay walkable; this is fast access. */
export async function travelToSector(sector: Exclude<SectorId, "atrium">) {
  const store = useNexusStore.getState();
  if (store.transitioning) return;
  const token = ++travelToken;
  const audio = getAudio();

  store.setTransitioning(true, `TRANSIT — ${getSector(sector).name.toUpperCase()}`);
  store.setFade("out");
  audio.play("travel");

  await wait(430);
  if (token !== travelToken) return;

  director.cancel();
  store.openPortal(sector);
  spawnInSector(sector);
  store.setSector(sector);
  audio.setSector(sector);

  await wait(90);
  if (token !== travelToken) return;
  store.setFade("in");

  await wait(140);
  if (token !== travelToken) return;
  store.showBanner(sectorBanner(sector));
  store.setTransitioning(false);
  setTimeout(() => {
    if (token === travelToken && useNexusStore.getState().fade === "in") {
      useNexusStore.getState().setFade("none");
    }
  }, 340);
  setTimeout(() => {
    if (useNexusStore.getState().banner?.title === sectorBanner(sector).title) {
      useNexusStore.getState().showBanner(null);
    }
  }, 3600);
}

export async function returnToAtrium(fromSector: Exclude<SectorId, "atrium">) {
  const store = useNexusStore.getState();
  if (store.transitioning) return;
  const token = ++travelToken;
  const audio = getAudio();

  store.setTransitioning(true, "RETURNING — CENTRAL ATRIUM");
  store.setFade("out");
  audio.play("travel");
  await wait(430);
  if (token !== travelToken) return;

  director.cancel();
  exitSectorToAtrium(fromSector);
  store.setSector("atrium");
  audio.setSector("atrium");
  await wait(90);
  store.setFade("in");
  await wait(140);
  store.showBanner(sectorBanner("atrium"));
  store.setTransitioning(false);
  setTimeout(() => {
    if (token === travelToken && useNexusStore.getState().fade === "in") {
      useNexusStore.getState().setFade("none");
    }
  }, 340);
  setTimeout(() => {
    if (useNexusStore.getState().banner?.title === sectorBanner("atrium").title) {
      useNexusStore.getState().showBanner(null);
    }
  }, 3200);
}

/** Camera move that frames an exhibit while its panel is open. */
export function focusOnInteraction(id: string, camera: THREE.PerspectiveCamera) {
  const interaction = getInteraction(id);
  if (!interaction) return;
  const pose = exhibitPose(interaction.position.clone(), playerState.position);
  director.shot(camera, {
    position: pose.position,
    lookAt: pose.lookAt,
    duration: 0.85,
    ease: "power3.inOut",
    hold: true,
  });
}

/** Return the camera to the player's eyes, then hand back control. */
export function releaseCamera(camera: THREE.PerspectiveCamera) {
  // Return to the third-person boom rather than the old first-person eye.
  const pose = thirdPersonPose((sector) => !!useNexusStore.getState().openedPortals[sector]);
  director.shot(camera, {
    position: pose.position.clone(),
    lookAt: pose.lookAt.clone(),
    duration: 0.62,
    ease: "power2.inOut",
    hold: false,
  });
}

export function activateInteraction(
  id: string,
  camera: THREE.PerspectiveCamera | null,
  options: { isDiscoverable?: boolean } = {},
) {
  const store = useNexusStore.getState();
  const interaction = getInteraction(id);
  if (!interaction) return;
  const audio = getAudio();

  if (interaction.action?.type === "travel") {
    void travelToSector(interaction.action.sector as Exclude<SectorId, "atrium">);
    store.markActivated(id);
    return;
  }

  if (interaction.action?.type === "exit") {
    if (playerState.sector !== "atrium") {
      void returnToAtrium(playerState.sector as Exclude<SectorId, "atrium">);
    }
    return;
  }

  if (interaction.action?.type === "map") {
    store.setOverlay("map");
    store.setPaused(true);
    audio.play("open");
    store.markActivated(id);
    return;
  }

  if (interaction.action?.type === "tour") {
    store.markActivated(id);
    void startTour();
    return;
  }

  if (interaction.discoveryId) {
    store.openPanel({ kind: "discovery", id: interaction.discoveryId });
    store.discover(interaction.discoveryId, interaction.label);
    audio.play("discover");
    store.markActivated(id);
    if (camera) focusOnInteraction(id, camera);
    return;
  }

  if (interaction.panel) {
    store.openPanel(interaction.panel as PanelState);
    store.markActivated(id);
    store.markExamined(interaction.id);
    audio.play("open");
    if (camera) focusOnInteraction(id, camera);
    return;
  }

  if (options.isDiscoverable) store.markActivated(id);
}

export function closePanelAndResume(camera: THREE.PerspectiveCamera | null) {
  const store = useNexusStore.getState();
  store.closePanel();
  store.setPaused(false);
  getAudio().play("close");
  if (camera) releaseCamera(camera);
}

// ---------------------------------------------------------------------------
// Guided tour
// ---------------------------------------------------------------------------

export type TourStop = {
  sector: SectorId;
  interactionId: string;
  duration: number;
  caption: string;
};

export const tourStops: TourStop[] = [
  {
    sector: "atrium",
    interactionId: "atrium-core",
    duration: 7000,
    caption: "The facility core models the engineering stack as one connected system.",
  },
  {
    sector: "application-lab",
    interactionId: "lab-device-mock",
    duration: 7000,
    caption: "Application Lab — the messaging client, reconstructed as an illustrative mockup.",
  },
  {
    sector: "infrastructure",
    interactionId: "inf-stage-proxy",
    duration: 7000,
    caption: "Infrastructure — the reverse proxy layer that fronts every production application.",
  },
  {
    sector: "project-archive",
    interactionId: "archive-mission-001",
    duration: 8000,
    caption: "Project Archive — Mission 001, the flagship multilingual corporate platform.",
  },
  {
    sector: "personal-quarters",
    interactionId: "quarters-philosophy-terminal",
    duration: 7000,
    caption: "Personal Quarters — the engineering philosophy behind the work.",
  },
  {
    sector: "personal-quarters",
    interactionId: "quarters-contact-terminal",
    duration: 8000,
    caption: "Contact terminal — the channel is open.",
  },
];

export async function startTour() {
  const store = useNexusStore.getState();
  if (store.tourActive) return;
  const token = ++tourToken;
  store.setTour(true, 0);
  store.setOverlay("none");
  store.setPaused(false);
  const camera = cameraRef.camera;
  if (typeof document !== "undefined" && document.pointerLockElement) document.exitPointerLock();

  for (let i = 0; i < tourStops.length; i++) {
    const stop = tourStops[i];
    if (token !== tourToken || !useNexusStore.getState().tourActive) return;
    useNexusStore.getState().setTour(true, i);

    if (stop.sector !== playerState.sector) {
      if (stop.sector === "atrium") {
        await returnToAtrium(playerState.sector as Exclude<SectorId, "atrium">);
      } else {
        await travelToSector(stop.sector as Exclude<SectorId, "atrium">);
      }
    }
    if (token !== tourToken) return;
    await wait(320);
    if (!camera) continue;
    focusOnInteraction(stop.interactionId, camera);
    await wait(stop.duration);
    if (token !== tourToken) return;
  }

  if (token === tourToken && useNexusStore.getState().tourActive) {
    useNexusStore.getState().setTour(false, 0);
    if (camera) releaseCamera(camera);
    useNexusStore.getState().pushToast({
      id: "tour-complete",
      kind: "info",
      title: "Orientation complete",
      body: "You have control. Press M for the facility map, or explore freely.",
    });
  }
}

export function stopTour() {
  tourToken++;
  const store = useNexusStore.getState();
  store.setTour(false, 0);
  if (cameraRef.camera) {
    director.cancel();
    releaseCamera(cameraRef.camera);
  }
}

export { cameraRef };
