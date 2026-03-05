import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { deriveGableRoofGeometries } from "../deriveGableRoofs";
import type { DerivedRoof } from "../derive/types/DerivedRoof";
import { DebugWireframe } from "../debug/DebugWireframe";
import { createGeometryCache } from "../cache/geometryCache";
import { useDebugUIState } from "../debug/debugUIState";

type Props = {
  roofs: DerivedRoof[];
  roofRevision: number;
  visible?: boolean;
  invalidRoofIds?: Set<string>;
};

type BuildGeometriesOptions = {
  invalidRoofIds?: Set<string>;
};

function buildGeometries(roofs: DerivedRoof[], options: BuildGeometriesOptions) {
  return deriveGableRoofGeometries(roofs, options);
}

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

const getGeometry = createGeometryCache<THREE.BufferGeometry[]>();

export function EngineGableRoofs({ roofs, roofRevision, visible = true, invalidRoofIds }: Props) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const options = useMemo(() => ({ invalidRoofIds }), [invalidRoofIds]);
  const sceneGeometries = useMemo(
    () => getGeometry(roofRevision, () => buildGeometries(roofs, options)),
    [roofs, options, roofRevision]
  );

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
              polygonOffset={isCorner}
              polygonOffsetFactor={isCorner ? -1 : 0}
              polygonOffsetUnits={isCorner ? -1 : 0}
              wireframe={debugWireframe}
            />
            <DebugWireframe />
          </mesh>
        );
      })}
    </>
  );
}
