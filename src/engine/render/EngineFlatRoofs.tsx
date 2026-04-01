import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { deriveFlatRoofGeometries } from '../deriveFlatRoofs';
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
  summarizeGeometry,
} from '../debug/geometryProfiler';

type Props = {
  roofs: DerivedRoof[];
  roofRevision: number;
  visible?: boolean;
  roofMaterialSpec?: ArchitecturalMaterials['roof'];
};

type DisposableRoofGeometries = {
  value: THREE.BufferGeometry[];
  dispose: () => void;
};

function toDisposableRoofGeometries(geometries: THREE.BufferGeometry[]): DisposableRoofGeometries {
  return {
    value: geometries,
    dispose: () => geometries.forEach((geometry) => geometry.dispose()),
  };
}

export function EngineFlatRoofs({ roofs, roofRevision, visible = true, roofMaterialSpec }: Props) {
  const geometryCache = useRef(createGeometryCache<DisposableRoofGeometries>());
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const debugEnabled = debugFlags.enabled;
  const roofMaterial = useMemo(() => createRoofMaterial(roofMaterialSpec), [roofMaterialSpec]);

  useEffect(() => {
    if ('wireframe' in roofMaterial) {
      (roofMaterial as { wireframe?: boolean }).wireframe = debugWireframe;
    }
  }, [debugWireframe, roofMaterial]);

  useEffect(() => () => roofMaterial.dispose(), [roofMaterial]);
  useEffect(() => () => geometryCache.current.dispose(), []);

  const geometries = useMemo(() => {
    const cached = geometryCache.current.get(roofRevision);
    if (cached) {
      recordGeometryCacheHit('roofs');
      if (debugEnabled) {
        console.log('[GeometryCache] reusing flat roof geometry', { revision: roofRevision });
      }
      return cached.value;
    }
    recordGeometryCacheMiss('roofs');

    if (debugEnabled) {
      console.log('[GeometryCache] rebuilding flat roof geometry', {
        revision: roofRevision,
        roofCount: roofs.length,
      });
    }

    const startTime = performance.now();
    const next = profileGeometryBuild('FlatRoofs', () => toDisposableRoofGeometries(deriveFlatRoofGeometries(roofs)));
    const geometrySummary = summarizeGeometry(next.value);
    recordGeometryBuildStats('roofs', {
      startTime,
      triangles: geometrySummary.triangles,
      memoryMB: geometrySummary.memoryMB,
    });
    incrementGeometryRebuildCount('roofs');
    geometryCache.current.set(roofRevision, next);

    return next.value;
  }, [debugEnabled, roofRevision, roofs]);

  if (!visible) return null;

  return (
    <>
      {geometries.map((geom, i) => (
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
