import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { deriveGableRoofGeometries } from '../deriveGableRoofs';
import type { DerivedRoof } from '../derive/types/DerivedRoof';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/geometryCache';
import { useDebugUIState } from '../debug/debugUIState';
import { createRoofMaterial } from '../materials/materialResolver';
import type { ArchitecturalMaterials } from '../architecturalTypes';

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

function buildGeometries(roofs: DerivedRoof[], options: BuildGeometriesOptions) {
  return deriveGableRoofGeometries(roofs, options);
}

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

const getGeometry = createGeometryCache<THREE.BufferGeometry[]>();

export function EngineGableRoofs({
  roofs,
  roofRevision,
  visible = true,
  invalidRoofIds,
  roofMaterialSpec,
}: Props) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const options = useMemo(() => ({ invalidRoofIds }), [invalidRoofIds]);
  const roofMaterial = useMemo(() => createRoofMaterial(roofMaterialSpec), [roofMaterialSpec]);

  useEffect(() => {
    if ('wireframe' in roofMaterial) {
      (roofMaterial as { wireframe?: boolean }).wireframe = debugWireframe;
    }
  }, [debugWireframe, roofMaterial]);

  const sceneGeometries = useMemo(
    () => getGeometry(roofRevision, () => buildGeometries(roofs, options)),
    [roofs, options, roofRevision]
  );

  useEffect(() => {
    return () => {
      disposeGeometries(sceneGeometries);
    };
  }, [sceneGeometries]);

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
