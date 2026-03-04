import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { deriveFlatRoofGeometries } from "../deriveFlatRoofs";
import type { ArchitecturalHouse } from "../architecturalTypes";

type Props = {
  arch: ArchitecturalHouse;
  roofRevision: number;
  visible?: boolean;
};

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

export function EngineFlatRoofs({
  arch,
  roofRevision,
  visible = true,
}: Props) {
  const geometries = useMemo(() => deriveFlatRoofGeometries(arch), [arch, roofRevision]);

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
