import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { deriveGableRoofGeometries } from '../deriveGableRoofs';
import type { DerivedRoof } from '../derive/types/DerivedRoof';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/createGeometryCache';
import { useDebugUIState } from '../debug/debugUIState';
import { createRoofMaterial } from '../materials/materialResolver';
import type { ArchitecturalMaterials } from '../architecturalTypes';
import { debugFlags } from '../debug/debugFlags';
import {
  incrementGeometryRebuildCount,
  profileGeometryBuild,
  recordGeometryBuildStats,
  recordGeometryCacheHit,
  recordGeometryCacheMiss,
  setRoofDiagnostics,
  summarizeGeometry,
} from '../debug/geometryProfiler';

type Props = {
  roofs: DerivedRoof[];
  roofRevision: number;
  visible?: boolean;
  invalidRoofIds?: Set<string>;
  roofMaterialSpec?: ArchitecturalMaterials['roof'];
};

type BuildGeometriesOptions = {
  invalidRoofIds?: Set<string>;
};

type DisposableRoofGeometries = {
  value: THREE.BufferGeometry[];
  dispose: () => void;
};

function summarizeRoofDiagnostics(roofs: DerivedRoof[]) {
  const summary = roofs.reduce(
    (acc, roof) => {
      const spec = roof.spec as {
        seamBases?: unknown[];
        roofRegions?: unknown[];
        regions?: unknown[];
        hipCaps?: unknown[];
        ridgeSegments?: unknown[];
        faces?: unknown[];
      };

      acc.seamBases += Array.isArray(spec?.seamBases) ? spec.seamBases.length : 0;
      const regionCount = Array.isArray(spec?.roofRegions)
        ? spec.roofRegions.length
        : Array.isArray(spec?.regions)
          ? spec.regions.length
          : Array.isArray(spec?.faces)
            ? spec.faces.length
            : 0;
      acc.roofRegions += regionCount;
      acc.hipCaps += Array.isArray(spec?.hipCaps) ? spec.hipCaps.length : 0;
      acc.ridgeSegments += Array.isArray(spec?.ridgeSegments) ? spec.ridgeSegments.length : 0;
      return acc;
    },
    { seamBases: 0, roofRegions: 0, hipCaps: 0, ridgeSegments: 0 }
  );

  const hasDiagnostics = Object.values(summary).some((value) => value > 0);
  return hasDiagnostics ? summary : undefined;
}

function buildGeometries(roofs: DerivedRoof[], options: BuildGeometriesOptions) {
  return deriveGableRoofGeometries(roofs, options);
}

function toDisposableRoofGeometries(geometries: THREE.BufferGeometry[]): DisposableRoofGeometries {
  return {
    value: geometries,
    dispose: () => geometries.forEach((geometry) => geometry.dispose()),
  };
}

export function EngineGableRoofs({
  roofs,
  roofRevision,
  visible = true,
  invalidRoofIds,
  roofMaterialSpec,
}: Props) {
  const geometryCache = useRef(createGeometryCache<DisposableRoofGeometries>());
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const debugEnabled = debugFlags.enabled;
  const options = useMemo(() => ({ invalidRoofIds }), [invalidRoofIds]);
  const roofMaterial = useMemo(() => createRoofMaterial(roofMaterialSpec), [roofMaterialSpec]);

  useEffect(() => {
    if ('wireframe' in roofMaterial) {
      (roofMaterial as { wireframe?: boolean }).wireframe = debugWireframe;
    }
  }, [debugWireframe, roofMaterial]);

  useEffect(() => () => roofMaterial.dispose(), [roofMaterial]);
  useEffect(() => () => geometryCache.current.dispose(), []);

  const sceneGeometries = useMemo(() => {
    const cached = geometryCache.current.get(roofRevision);
    if (cached) {
      recordGeometryCacheHit('roofs');
      if (debugEnabled) {
        console.log('[GeometryCache] reusing gable roof geometry', { revision: roofRevision });
      }
      return cached.value;
    }
    recordGeometryCacheMiss('roofs');

    if (debugEnabled) {
      console.log('[GeometryCache] rebuilding gable roof geometry', {
        revision: roofRevision,
        roofCount: roofs.length,
      });
    }

    const startTime = performance.now();
    const next = profileGeometryBuild('GableRoofs', () => toDisposableRoofGeometries(buildGeometries(roofs, options)));
    const geometrySummary = summarizeGeometry(next.value);
    recordGeometryBuildStats('roofs', {
      startTime,
      triangles: geometrySummary.triangles,
      memoryMB: geometrySummary.memoryMB,
    });
    setRoofDiagnostics(summarizeRoofDiagnostics(roofs));
    incrementGeometryRebuildCount('roofs');
    geometryCache.current.set(roofRevision, next);
    return next.value;
  }, [debugEnabled, options, roofRevision, roofs]);

  if (!visible) return null;

  return (
    <>
      {sceneGeometries.map((geom, i) => (
        <mesh
          key={i}
          geometry={geom}
          material={roofMaterial}
          castShadow
          receiveShadow
          userData={{ debugType: 'structure' }}
        >
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
