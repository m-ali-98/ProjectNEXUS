import * as THREE from "three";
import { ATRIUM, dir, frameFor, localToWorld } from "@/world/worldLayout";
import type { SectorId } from "@/content/sectors";
import { sectorInteractions, portalAnchors, systemNodeLocalPosition, type InteractionKind, type InteractionAction } from "@/world/sectorData";
import { systemNodes } from "@/content/systems";
import type { PanelState } from "@/stores/nexusStore";

export type Interaction = {
  id: string;
  kind: InteractionKind;
  sector: SectorId;
  code: string;
  label: string;
  verb: string;
  position: THREE.Vector3;
  radius: number;
  panel?: PanelState;
  action?: InteractionAction;
  discoveryId?: string;
  /** Where the marker glyph floats (world space). */
  marker: THREE.Vector3;
};

function build(): Interaction[] {
  const list: Interaction[] = [];

  // --- Atrium fixtures ----------------------------------------------------
  for (const item of sectorInteractions.atrium) {
    const position = new THREE.Vector3(item.x, item.y, item.z);
    list.push({
      id: item.id,
      kind: item.kind,
      sector: "atrium",
      code: item.code,
      label: item.label,
      verb: item.verb,
      position,
      radius: item.radius ?? 2.6,
      panel: item.panel,
      action: item.action,
      discoveryId: item.discoveryId,
      marker: position.clone().add(new THREE.Vector3(0, item.markerY ?? 0.75, 0)),
    });
  }

  // --- Sector entrances from the atrium ----------------------------------
  for (const portal of portalAnchors) {
    const angle = frameFor(portal.sector).angle;
    const position = dir(angle).multiplyScalar(ATRIUM.apothem - 1.0);
    position.y = 1.5;
    list.push({
      id: `portal-${portal.sector}`,
      kind: "portal",
      sector: "atrium",
      code: `SECTOR ${portal.code}`,
      label: `${portal.label} — secure access`,
      verb: "ENTER SECTOR",
      position,
      radius: 3.0,
      action: { type: "travel", sector: portal.sector },
      marker: position.clone().add(new THREE.Vector3(0, 1.5, 0)),
    });
  }

  // --- Sector fixtures ---------------------------------------------------
  for (const [sector, items] of Object.entries(sectorInteractions) as [
    SectorId,
    typeof sectorInteractions.atrium,
  ][]) {
    if (sector === "atrium") continue;
    for (const item of items) {
      const position = localToWorld(sector, item.x, item.y, item.z);
      list.push({
        id: item.id,
        kind: item.kind,
        sector,
        code: item.code,
        label: item.label,
        verb: item.verb,
        position,
        radius: item.radius ?? 2.4,
        panel: item.panel,
        action: item.action,
        discoveryId: item.discoveryId,
        marker: position.clone().add(new THREE.Vector3(0, item.markerY ?? 0.7, 0)),
      });
    }

    // Bulkhead on the corridor side of the front wall.
    const bulk = localToWorld(sector, 0, 1.5, -14.4);
    list.push({
      id: `bulkhead-${sector}`,
      kind: "portal",
      sector,
      code: "ACCESS HATCH",
      label: `${sectorName(sector)} — bulkhead`,
      verb: "CYCLE AIRLOCK",
      position: bulk,
      radius: 2.8,
      action: { type: "travel", sector },
      marker: bulk.clone().add(new THREE.Vector3(0, 1.2, 0)),
    });

    // Exit back to the atrium.
    const exit = localToWorld(sector, 0, 1.4, -11.2);
    list.push({
      id: `exit-${sector}`,
      kind: "portal",
      sector,
      code: "RETURN",
      label: "Return to Central Atrium",
      verb: "RETURN TO ATRIUM",
      position: exit,
      radius: 2.6,
      action: { type: "exit" },
      marker: exit.clone().add(new THREE.Vector3(0, 1.2, 0)),
    });
  }

  // --- Systems Core: one interaction per architecture node -----------------
  systemNodes.forEach((node, index) => {
    const p = systemNodeLocalPosition(index, systemNodes.length);
    const position = localToWorld("systems-core", p.x, p.y, p.z);
    list.push({
      id: `sys-node-${node.id}`,
      kind: "hologram",
      sector: "systems-core",
      code: node.code,
      label: node.label,
      verb: "INSPECT NODE",
      position,
      radius: 3.0,
      panel: { kind: "systemNode", id: node.id },
      marker: position.clone().add(new THREE.Vector3(0, 0.95, 0)),
    });
  });

  return list;
}

export function sectorName(id: SectorId) {
  switch (id) {
    case "atrium":
      return "Central Atrium";
    case "application-lab":
      return "Application Lab";
    case "systems-core":
      return "Systems Core";
    case "infrastructure":
      return "Infrastructure";
    case "network-operations":
      return "Network Operations";
    case "project-archive":
      return "Project Archive";
    case "personal-quarters":
      return "Personal Quarters";
  }
}

export const interactions: Interaction[] = build();

export const interactionById = new Map(interactions.map((i) => [i.id, i]));

export const interactionsBySector: Record<SectorId, Interaction[]> = {
  atrium: interactions.filter((i) => i.sector === "atrium"),
  "application-lab": interactions.filter((i) => i.sector === "application-lab"),
  "systems-core": interactions.filter((i) => i.sector === "systems-core"),
  infrastructure: interactions.filter((i) => i.sector === "infrastructure"),
  "network-operations": interactions.filter((i) => i.sector === "network-operations"),
  "project-archive": interactions.filter((i) => i.sector === "project-archive"),
  "personal-quarters": interactions.filter((i) => i.sector === "personal-quarters"),
};

export function getInteraction(id: string): Interaction | undefined {
  return interactionById.get(id);
}
