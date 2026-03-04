import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { deriveFlatRoofGeometries } from "../deriveFlatRoofs";
import type { DerivedRoof } from "../derive/types/DerivedRoof";
import { DebugWireframe } from "../debug/DebugWireframe";

type Props = {
  roofs: DerivedRoof[];
  roofRevision: number;
  visible?: boolean;
};

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

export function EngineFlatRoofs({ roofs, roofRevision, visible = true }: Props) {
  const geometries = useMemo(() => deriveFlatRoofGeometries(roofs), [roofs, roofRevision]);

  useEffect(() => {
    return () => {
      disposeGeometries(geometries);
    };
  }, [geometries]);

  if (!visible) return null;

  return (
    <>
      {geometries.map((geom, i) => (
        <mesh key={i} geometry={geom}>
          <meshStandardMaterial
            color="green"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
