import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { resolveOpeningRenderParts } from '../openings/resolveOpeningRenderParts';
import { archToWorldXZ } from '../spaceMapping';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import type { ArchitecturalMaterials } from '../architecturalTypes';
import { createOpeningMaterials } from '../materials/materialResolver';

type Props = {
  openings: DerivedOpeningRect[];
  wallThickness?: number;
  windowsMaterialSpec?: ArchitecturalMaterials['windows'];
};

export function EngineOpenings({
  openings,
  wallThickness = 0.3,
  windowsMaterialSpec,
}: Props) {
  const openingMaterials = useMemo(() => createOpeningMaterials(windowsMaterialSpec), [windowsMaterialSpec]);

  useEffect(
    () => () => {
      Object.values(openingMaterials).forEach((material) => material.dispose());
    },
    [openingMaterials]
  );

  const shadowProps = {
    castShadow: true,
    receiveShadow: true,
  };

  return (
    <>
      {openings.map((o) => {
        const width = o.uMax - o.uMin;
        const height = o.vMax - o.vMin;
        const renderConfig = resolveOpeningRenderParts(width, height, o.style, wallThickness, {
          kind: o.kind,
        });

        const tangentXZ = archToWorldXZ({ x: o.tangentXZ.x, z: o.tangentXZ.z });
        const outwardXZ = archToWorldXZ({ x: o.outwardXZ.x, z: o.outwardXZ.z });

        const tangent = new THREE.Vector3(tangentXZ.x, 0, tangentXZ.z).normalize();
        const outward = new THREE.Vector3(outwardXZ.x, 0, outwardXZ.z).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        const centerY = o.centerArch.y;
        const centerXZ = archToWorldXZ({ x: o.centerArch.x, z: o.centerArch.z });

        const center = new THREE.Vector3(centerXZ.x, centerY, centerXZ.z);

        const inward = outward.clone().multiplyScalar(-wallThickness / 2);
        const defaultPosition = center.clone().add(inward);
        const openingPosition =
          renderConfig.originOffsetZ != null
            ? center.clone().add(outward.clone().multiplyScalar(renderConfig.originOffsetZ))
            : defaultPosition;

        const basis = new THREE.Matrix4().makeBasis(tangent, up, outward);
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

        return (
          <group key={o.id} position={openingPosition.toArray()} quaternion={quaternion.toArray()}>
            {renderConfig.parts.map((part) => (
              <mesh
                {...shadowProps}
                key={`${o.id}-${part.key}`}
                material={openingMaterials[part.material]}
                position={part.position}
                rotation={part.rotation}
                userData={{
                  ...(part.debugType ? { debugType: part.debugType } : {}),
                  ...(part.debugIgnore ? { debugIgnore: true } : {}),
                }}
              >
                <boxGeometry args={part.size} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}
