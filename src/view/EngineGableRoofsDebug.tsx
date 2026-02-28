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

type BuildGeometriesOptions = {
  invalidRoofIds?: Set<string>;
};

function buildGeometries(arch: ArchitecturalHouse, options: BuildGeometriesOptions) {
  return deriveGableRoofGeometries(arch, options);
}

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

export function EngineGableRoofsDebug({
  arch,
  roofRevision,
  visible = true,
  invalidRoofIds,
}: Props) {
  const options = useMemo(() => ({ invalidRoofIds }), [invalidRoofIds]);
  const sceneGeometries = useMemo(() => buildGeometries(arch, options), [arch, options, roofRevision]);

  useEffect(() => {
    return () => {
      disposeGeometries(sceneGeometries);
    };
  }, [sceneGeometries]);

  if (!visible) return null;

  return (
    <>
      {sceneGeometries.map((geom, i) => {
        const faceId = geom.userData?.faceId;
        const isCorner = typeof faceId === "string" && faceId.startsWith("corner-");

        return (
          <mesh key={i} geometry={geom}>
            <meshStandardMaterial
              color="black"
              wireframe
              polygonOffset={isCorner}
              polygonOffsetFactor={isCorner ? -1 : 0}
              polygonOffsetUnits={isCorner ? -1 : 0}
            />
          </mesh>
        );
      })}
    </>
  );
}
