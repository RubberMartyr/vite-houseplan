import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { deriveFlatRoofGeometries } from "../deriveFlatRoofs";
import type { DerivedRoof } from "../derive/types/DerivedRoof";
import { DebugWireframe } from "../debug/DebugWireframe";
import { createGeometryCache } from "../cache/geometryCache";
import { useDebugUIState } from "../debug/debugUIState";

type Props = {
  roofs: DerivedRoof[];
  roofRevision: number;
  visible?: boolean;
};

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

const getGeometry = createGeometryCache<THREE.BufferGeometry[]>();

export function EngineFlatRoofs({ roofs, roofRevision, visible = true }: Props) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
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
        <mesh key={i} geometry={geom} userData={{ debugType: "structure" }}>
          <meshStandardMaterial
            color="green"
            transparent
            opacity={0.5}
            depthWrite={false}
            wireframe={debugWireframe}
          />
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
