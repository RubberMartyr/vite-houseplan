import React from "react";
import { deriveFlatRoofGeometries } from "../engine/deriveFlatRoofs";
import type { ArchitecturalHouse } from "../engine/architecturalTypes";

type Props = {
  arch: ArchitecturalHouse;
  visible?: boolean;
};

export function EngineFlatRoofsDebug({
  arch,
  visible = true,
}: Props) {
  if (!visible) return null;

  const geometries = deriveFlatRoofGeometries(arch);

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
