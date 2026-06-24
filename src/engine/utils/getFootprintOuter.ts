import type { Vec2 } from '../architecturalTypes';

export function getFootprintOuter(level: any): Vec2[] {
  const outer = level?.footprint?.outer;
  if (!Array.isArray(outer)) return [];
  return outer
    .map((p: any) => ({
      x: Number(p.x),
      z: Number(p.z ?? p.y),
    }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.z));
}
