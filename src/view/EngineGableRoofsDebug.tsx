import React from "react";
import { deriveGableRoofGeometries } from "../engine/deriveGableRoofs";
import type { ArchitecturalHouse } from "../engine/architecturalTypes";

type Props = {
  arch: ArchitecturalHouse;
  visible?: boolean;
};

export function EngineGableRoofsDebug({
  arch,
  visible = true,
}: Props) {
  if (!visible) return null;

  const geometries = deriveGableRoofGeometries(arch);

  return (
    <>
      {geometries.map((geom, i) => (
        <mesh key={i} geometry={geom}>
          <meshStandardMaterial color="black" />
        </mesh>
      ))}
    </>
  );
}
