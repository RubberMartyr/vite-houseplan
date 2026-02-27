import React, { useEffect, useMemo, useRef } from "react";
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
  const lastGoodRef = useRef<THREE.BufferGeometry[] | null>(null);
  const geometries = useMemo(() => {
    const derived = deriveGableRoofGeometries(arch, { invalidRoofIds });
    if (!invalidRoofIds || invalidRoofIds.size === 0) {
      lastGoodRef.current = derived;
      return derived;
    }
    return lastGoodRef.current ?? derived;
  }, [arch, roofRevision, invalidRoofIds]);

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
