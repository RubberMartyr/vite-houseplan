import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { deriveFlatRoofGeometries } from "../deriveFlatRoofs";
import type { ArchitecturalHouse } from "../architecturalTypes";
import type { MultiPlaneRoofSpec } from "../types";

type Props = {
  arch: ArchitecturalHouse;
  roofs: MultiPlaneRoofSpec[];
  roofRevision: number;
  visible?: boolean;
};

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

export function EngineFlatRoofs({
  arch,
  roofs,
  roofRevision,
  visible = true,
}: Props) {
  const geometries = useMemo(() => deriveFlatRoofGeometries(arch, roofs), [arch, roofs, roofRevision]);

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
        </mesh>
      ))}
    </>
  );
}
