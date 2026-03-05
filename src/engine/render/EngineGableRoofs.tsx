import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { DerivedRoof } from "../derive/types/DerivedRoof";
import { DebugWireframe } from "../debug/DebugWireframe";
import { createGeometryCache } from "../cache/geometryCache";

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
  return roofs
    .filter((roof) => roof.type === "gable" && !options.invalidRoofIds?.has(roof.id))
    .map((roof) => {
      const positions: number[] = [];

      for (const tri of roof.triangles) {
        positions.push(...tri.a, ...tri.b, ...tri.c);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      return geometry;
    });
}

function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  geometries.forEach((geometry) => geometry.dispose());
}

const getGeometry = createGeometryCache<THREE.BufferGeometry[]>();

export function EngineGableRoofs({ roofs, roofRevision, visible = true, invalidRoofIds }: Props) {
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
        return (
          <mesh key={i} geometry={geom}>
            <meshStandardMaterial
              color="black"
            />
            <DebugWireframe />
          </mesh>
        );
      })}
    </>
  );
}
