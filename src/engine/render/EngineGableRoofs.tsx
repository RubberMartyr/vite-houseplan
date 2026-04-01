import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { deriveGableRoofGeometries } from '../deriveGableRoofs';
import type { DerivedRoof } from '../derive/types/DerivedRoof';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/createGeometryCache';
import { useDebugUIState } from '../debug/debugUIState';
import { createRoofMaterial } from '../materials/materialResolver';
import type { ArchitecturalMaterials } from '../architecturalTypes';
import { debugFlags } from '../debug/debugFlags';

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
      if (debugEnabled) {
        console.log('[GeometryCache] reusing gable roof geometry', { revision: roofRevision });
      }
      return cached.value;
    }

    if (debugEnabled) {
      console.log('[GeometryCache] rebuilding gable roof geometry', {
        revision: roofRevision,
        roofCount: roofs.length,
      });
    }

    const next = toDisposableRoofGeometries(buildGeometries(roofs, options));
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
