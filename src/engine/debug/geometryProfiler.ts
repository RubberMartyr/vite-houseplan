import { debugLog } from './debugLog';

export type GeometryRebuildCounts = {
  walls: number;
  roofs: number;
  slabs: number;
};

const rebuildCounts: GeometryRebuildCounts = {
  walls: 0,
  roofs: 0,
  slabs: 0,
};

export function profileGeometryBuild<T>(label: string, callback: () => T): T {
  const start = performance.now();
  const result = callback();
  const end = performance.now();

  debugLog('GeometryProfile', `${label}: ${(end - start).toFixed(2)}ms`);

  return result;
}

export function incrementGeometryRebuildCount(kind: keyof GeometryRebuildCounts): void {
  rebuildCounts[kind] += 1;
}

export function getGeometryRebuildCounts(): GeometryRebuildCounts {
  return { ...rebuildCounts };
}
