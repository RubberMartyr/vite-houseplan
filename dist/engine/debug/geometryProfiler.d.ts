import * as THREE from 'three';
import type { DerivedHouse } from '../derive/types/DerivedHouse';
import type { EngineDebugStats, EngineSubsystem } from './types';
export type GeometryRebuildCounts = {
    walls: number;
    roofs: number;
    slabs: number;
};
export declare function estimateGeometryMemoryMB(geometry: THREE.BufferGeometry): number;
export declare function summarizeGeometry(geometries: THREE.BufferGeometry[]): {
    triangles: number;
    memoryMB: number;
};
export declare function profileGeometryBuild<T>(label: string, callback: () => T): T;
export declare function incrementGeometryRebuildCount(kind: keyof GeometryRebuildCounts): void;
export declare function recordGeometryCacheHit(kind: EngineSubsystem): void;
export declare function recordGeometryCacheMiss(kind: EngineSubsystem): void;
export declare function recordGeometryBuildStats(kind: EngineSubsystem, stats: {
    startTime: number;
    triangles: number;
    memoryMB: number;
}): void;
export declare function setRoofDiagnostics(roof: EngineDebugStats['roof'] | undefined): void;
export declare function setWallDiagnostics(walls: EngineDebugStats['walls'] | undefined): void;
export declare function setRuntimeFrameStats(runtime: Pick<EngineDebugStats['runtime'], 'fps' | 'frameMs'>): void;
export declare function getGeometryRebuildCounts(): GeometryRebuildCounts;
export declare function getEngineDebugStats(derived: DerivedHouse): EngineDebugStats;
