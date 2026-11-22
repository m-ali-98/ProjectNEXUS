"use client";

import { Children, type ReactNode } from "react";
import { useQuality } from "@/lib/quality";

/**
 * Caps the number of dynamic point lights a sector contributes.
 *
 * Ambient and hemisphere lights are free-ish, so they stay outside this wrapper;
 * the per-room key/fill lights are sliced to the active quality profile's budget
 * (ultra 4, high 3, performance 2). Order the children by importance: the first
 * light is always kept.
 */
export function LimitedLights({ count, children }: { count?: number; children: ReactNode }) {
  const quality = useQuality();
  const budget = Math.max(1, count ?? quality.lightCount);
  return <>{Children.toArray(children).slice(0, budget)}</>;
}
