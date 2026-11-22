"use client";

import type { ReactNode } from "react";
import { BulkheadDoor, RoomShell } from "@/world/environment/Architecture";
import { SectorFixtures } from "@/world/environment/Fixtures";
import { frameFor } from "@/world/worldLayout";
import { getSector, type SectorId } from "@/content/sectors";
import { useNexusStore } from "@/stores/nexusStore";

/**
 * Common structure for every sector: shell, fixtures, bulkhead, and a
 * sector-specific interior passed as children.
 */
export function Sector({
  id,
  children,
}: {
  id: Exclude<SectorId, "atrium">;
  children?: ReactNode;
}) {
  const frame = frameFor(id);
  const meta = getSector(id);
  const open = useNexusStore((s) => !!s.openedPortals[id]);

  return (
    <group position={[frame.position.x, 0, frame.position.z]} rotation={[0, frame.rotationY, 0]}>
      <RoomShell sector={id} height={frame.height} accent={meta.accent} />
      <SectorFixtures sector={id} />
      <BulkheadDoor sector={id} height={frame.height} accent={meta.accent} open={open} />
      {children}
    </group>
  );
}
