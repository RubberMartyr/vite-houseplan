import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { deriveGableRoofGeometries } from "../deriveGableRoofs";
import type { ArchitecturalHouse } from "../architecturalTypes";
import type { MultiPlaneRoofSpec } from "../types";

type Props = {
  arch: ArchitecturalHouse;
  roofs: MultiPlaneRoofSpec[];
  roofRevision: number;
  visible?: boolean;
  invalidRoofIds?: Set<string>;
};

type BuildGeometriesOptions = {
  invalidRoofIds?: Set<string>;
};

function buildGeometries(arch: ArchitecturalHouse, roofs: MultiPlaneRoofSpec[], options: BuildGeometriesOptions) {
  return deriveGableRoofGeometries(arch, roofs, options);
}

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

export function EngineGableRoofs({
  arch,
  roofs,
  roofRevision,
  visible = true,
  invalidRoofIds,
}: Props) {
  const options = useMemo(() => ({ invalidRoofIds }), [invalidRoofIds]);
  const sceneGeometries = useMemo(() => buildGeometries(arch, roofs, options), [arch, roofs, options, roofRevision]);

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
