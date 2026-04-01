import * as THREE from 'three';
import type { DerivedHouse } from '../derive/types/DerivedHouse';
import { debugFlags } from './debugFlags';
import { debugLog } from './debugLog';
import type { EngineDebugStats, EngineSubsystem } from './types';

export type GeometryRebuildCounts = {
  walls: number;
  roofs: number;
  slabs: number;
};

type MutableDebugState = {
  rebuildCounts: GeometryRebuildCounts;
  cache: EngineDebugStats['cache'];
  timingsMs: EngineDebugStats['timingsMs'];
  geometry: Omit<EngineDebugStats['geometry'], 'totalTriangles'>;
  roof?: EngineDebugStats['roof'];
  walls?: EngineDebugStats['walls'];
  runtime: EngineDebugStats['runtime'];
  previousRevisions?: EngineDebugStats['revisions'];
};

const debugState: MutableDebugState = {
  rebuildCounts: {
    walls: 0,
    roofs: 0,
    slabs: 0,
  },
  cache: {
    slabHits: 0,
    slabMisses: 0,
    wallHits: 0,
    wallMisses: 0,
    roofHits: 0,
    roofMisses: 0,
  },
  timingsMs: {
    slabBuild: 0,
    wallBuild: 0,
    roofBuild: 0,
  },
  geometry: {
    slabTriangles: 0,
    wallTriangles: 0,
    roofTriangles: 0,
    estimatedMemoryMB: 0,
  },
  runtime: {
    lastChangedSubsystem: 'unknown',
  },
};

function isDebugEnabled(): boolean {
  return debugFlags.enabled;
}

function getBuildDurationMs(startTime: number): number {
  return performance.now() - startTime;
}

function countGeometryTriangles(geometry: THREE.BufferGeometry): number {
  if (geometry.index) {
    return Math.floor(geometry.index.count / 3);
  }

  const position = geometry.getAttribute('position');
  if (!position) {
    return 0;
  }

  return Math.floor(position.count / 3);
}

export function estimateGeometryMemoryMB(geometry: THREE.BufferGeometry): number {
  let totalBytes = 0;

  for (const key of Object.keys(geometry.attributes)) {
    const attr = geometry.attributes[key];
    totalBytes += attr.array.byteLength;
  }

  if (geometry.index) {
    totalBytes += geometry.index.array.byteLength;
  }

  return totalBytes / (1024 * 1024);
}

export function summarizeGeometry(geometries: THREE.BufferGeometry[]): {
  triangles: number;
  memoryMB: number;
} {
  return geometries.reduce(
    (acc, geometry) => ({
      triangles: acc.triangles + countGeometryTriangles(geometry),
      memoryMB: acc.memoryMB + estimateGeometryMemoryMB(geometry),
    }),
    { triangles: 0, memoryMB: 0 }
  );
}

export function profileGeometryBuild<T>(label: string, callback: () => T): T {
  if (!isDebugEnabled()) {
    return callback();
  }

  const start = performance.now();
  const result = callback();
  const end = performance.now();

  debugLog('GeometryProfile', `${label}: ${(end - start).toFixed(2)}ms`);

  return result;
}

export function incrementGeometryRebuildCount(kind: keyof GeometryRebuildCounts): void {
  if (!isDebugEnabled()) {
    return;
  }

  debugState.rebuildCounts[kind] += 1;
}

export function recordGeometryCacheHit(kind: EngineSubsystem): void {
  if (!isDebugEnabled()) {
    return;
  }

  if (kind === 'walls') debugState.cache.wallHits += 1;
  if (kind === 'roofs') debugState.cache.roofHits += 1;
  if (kind === 'slabs') debugState.cache.slabHits += 1;
}

export function recordGeometryCacheMiss(kind: EngineSubsystem): void {
  if (!isDebugEnabled()) {
    return;
  }

  if (kind === 'walls') debugState.cache.wallMisses += 1;
  if (kind === 'roofs') debugState.cache.roofMisses += 1;
  if (kind === 'slabs') debugState.cache.slabMisses += 1;
}

export function recordGeometryBuildStats(
  kind: EngineSubsystem,
  stats: {
    startTime: number;
    triangles: number;
    memoryMB: number;
  }
): void {
  if (!isDebugEnabled()) {
    return;
  }

  const durationMs = getBuildDurationMs(stats.startTime);

  if (kind === 'walls') {
    debugState.timingsMs.wallBuild = durationMs;
    debugState.geometry.wallTriangles = stats.triangles;
  }

  if (kind === 'roofs') {
    debugState.timingsMs.roofBuild = durationMs;
    debugState.geometry.roofTriangles = stats.triangles;
  }

  if (kind === 'slabs') {
    debugState.timingsMs.slabBuild = durationMs;
    debugState.geometry.slabTriangles = stats.triangles;
  }

  debugState.geometry.estimatedMemoryMB =
    (debugState.geometry.estimatedMemoryMB ?? 0) -
    getSubsystemMemoryMB(kind) +
    stats.memoryMB;

  setSubsystemMemoryMB(kind, stats.memoryMB);
}

const subsystemMemoryMB: Record<EngineSubsystem, number> = {
  slabs: 0,
  walls: 0,
  roofs: 0,
};

function getSubsystemMemoryMB(kind: EngineSubsystem): number {
  return subsystemMemoryMB[kind];
}

function setSubsystemMemoryMB(kind: EngineSubsystem, memoryMB: number): void {
  subsystemMemoryMB[kind] = memoryMB;
}

export function setRoofDiagnostics(roof: EngineDebugStats['roof'] | undefined): void {
  if (!isDebugEnabled()) {
    return;
  }

  debugState.roof = roof;
}

export function setWallDiagnostics(walls: EngineDebugStats['walls'] | undefined): void {
  if (!isDebugEnabled()) {
    return;
  }

  debugState.walls = walls;
}

export function setRuntimeFrameStats(runtime: Pick<EngineDebugStats['runtime'], 'fps' | 'frameMs'>): void {
  if (!isDebugEnabled()) {
    return;
  }

  debugState.runtime = {
    ...debugState.runtime,
    ...runtime,
  };
}

export function getGeometryRebuildCounts(): GeometryRebuildCounts {
  return { ...debugState.rebuildCounts };
}

function detectLastChangedSubsystem(revisions: EngineDebugStats['revisions']): EngineDebugStats['runtime']['lastChangedSubsystem'] {
  const previous = debugState.previousRevisions;
  debugState.previousRevisions = revisions;

  if (!previous) {
    return debugState.runtime.lastChangedSubsystem;
  }

  const changed = (Object.keys(revisions) as Array<keyof EngineDebugStats['revisions']>).filter(
    (key) => revisions[key] !== previous[key]
  );

  if (changed.length !== 1) {
    return changed.length > 1 ? 'unknown' : debugState.runtime.lastChangedSubsystem;
  }

  return changed[0];
}

export function getEngineDebugStats(derived: DerivedHouse): EngineDebugStats {
  const revisions = {
    slabs: derived.revisions.slabs,
    walls: derived.revisions.walls,
    roofs: derived.revisions.roofs,
    openings: derived.revisions.openings,
  };

  const lastChangedSubsystem = detectLastChangedSubsystem(revisions);
  debugState.runtime.lastChangedSubsystem = lastChangedSubsystem;

  const totalTriangles =
    debugState.geometry.slabTriangles + debugState.geometry.wallTriangles + debugState.geometry.roofTriangles;

  return {
    derived: {
      slabs: derived.slabs.length,
      walls: derived.walls.length,
      roofs: derived.roofs.length,
      carports: derived.carports.length,
      openings: derived.openings.length,
      rooms: derived.rooms.length,
    },
    revisions,
    rebuilds: { ...debugState.rebuildCounts },
    cache: { ...debugState.cache },
    timingsMs: { ...debugState.timingsMs },
    geometry: {
      ...debugState.geometry,
      totalTriangles,
      estimatedMemoryMB: Math.max(0, subsystemMemoryMB.slabs + subsystemMemoryMB.walls + subsystemMemoryMB.roofs),
    },
    roof: debugState.roof,
    walls: debugState.walls,
    runtime: { ...debugState.runtime },
  };
}
