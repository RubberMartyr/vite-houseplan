import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { deriveFlatRoofGeometries } from '../deriveFlatRoofs';
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
  roofMaterialSpec?: ArchitecturalMaterials['roof'];
};

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

const getGeometry = createGeometryCache<THREE.BufferGeometry[]>();

export function EngineFlatRoofs({ roofs, roofRevision, visible = true, roofMaterialSpec }: Props) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const roofMaterial = useMemo(() => createRoofMaterial(roofMaterialSpec), [roofMaterialSpec]);

  useEffect(() => {
    if ('wireframe' in roofMaterial) {
      (roofMaterial as { wireframe?: boolean }).wireframe = debugWireframe;
    }
  }, [debugWireframe, roofMaterial]);

  const geometries = useMemo(
    () => getGeometry(roofRevision, () => deriveFlatRoofGeometries(roofs)),
    [roofs, roofRevision]
  );

  useEffect(() => {
    return () => {
      disposeGeometries(geometries);
    };
  }, [geometries]);

  if (!visible) return null;

  return (
    <>
      {geometries.map((geom, i) => (
        <mesh key={i} geometry={geom} material={roofMaterial} userData={{ debugType: 'structure' }}>
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
