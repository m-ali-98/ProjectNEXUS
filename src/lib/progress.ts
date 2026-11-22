import type { SectorId } from "@/content/sectors";

export function visitedCount(visited: SectorId[]) {
  return new Set(visited).size;
}

export function examinedCount(examined: string[]) {
  return new Set(examined).size;
}

export function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}
