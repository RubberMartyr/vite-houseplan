import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { deriveGableRoofGeometries } from "../engine/deriveGableRoofs";
import type { ArchitecturalHouse } from "../engine/architecturalTypes";

type Props = {
  arch: ArchitecturalHouse;
  roofRevision: number;
  visible?: boolean;
  invalidRoofIds?: Set<string>;
};

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

export function EngineGableRoofsDebug({
  arch,
  roofRevision,
  visible = true,
  invalidRoofIds,
}: Props) {
  const geometries = useMemo(() => deriveGableRoofGeometries(arch, { invalidRoofIds }), [arch, roofRevision, invalidRoofIds]);

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
          <meshStandardMaterial color="black" wireframe />
        </mesh>
      ))}
    </>
  );
}
