import React, { useMemo } from 'react';
import * as THREE from 'three';
import { resolveOpeningRenderParts } from '../openings/resolveOpeningRenderParts';
import { resolveStackedWindowRenderParts } from '../openings/resolveStackedWindowRenderParts';
import { archToWorldXZ } from '../spaceMapping';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import type { ArchitecturalMaterials } from '../architecturalTypes';

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
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: windowsMaterialSpec?.frameColor ?? '#f0f0f0',
      }),
    [windowsMaterialSpec?.frameColor]
  );

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: windowsMaterialSpec?.glassColor ?? '#a8d0ff',
        transparent: true,
        opacity: windowsMaterialSpec?.glassOpacity ?? 0.35,
      }),
    [windowsMaterialSpec?.glassColor, windowsMaterialSpec?.glassOpacity]
  );

  const shadowProps = {
    castShadow: true,
    receiveShadow: true,
  };

  const stackedWindowParts = useMemo(
    () => resolveStackedWindowRenderParts(openings, wallThickness),
    [openings, wallThickness]
  );

  return (
    <>
      {stackedWindowParts.map((part) => (
        <mesh
          {...shadowProps}
          key={part.key}
          material={frameMaterial}
          position={part.position}
          quaternion={part.quaternion}
          userData={{ debugIgnore: true }}
        >
          <boxGeometry args={part.size} />
        </mesh>
      ))}
      {openings.map((o) => {
        const width = o.uMax - o.uMin;
        const height = o.vMax - o.vMin;
        const renderConfig = resolveOpeningRenderParts(width, height, o.style, wallThickness);

        const tangentXZ = archToWorldXZ({ x: o.tangentXZ.x, z: o.tangentXZ.z });
        const outwardXZ = archToWorldXZ({ x: o.outwardXZ.x, z: o.outwardXZ.z });

        const tangent = new THREE.Vector3(tangentXZ.x, 0, tangentXZ.z).normalize();
        const outward = new THREE.Vector3(outwardXZ.x, 0, outwardXZ.z).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        const centerY = o.centerArch.y;
        const centerXZ = archToWorldXZ({ x: o.centerArch.x, z: o.centerArch.z });

        const center = new THREE.Vector3(centerXZ.x, centerY, centerXZ.z);

        const inward = outward.clone().multiplyScalar(-wallThickness / 2);
        const glassPosition = center.clone().add(inward);

        const basis = new THREE.Matrix4().makeBasis(tangent, up, outward);
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

        return (
          <group key={o.id} position={glassPosition.toArray()} quaternion={quaternion.toArray()}>
            {renderConfig.parts.map((part) => (
              <mesh
                {...shadowProps}
                key={`${o.id}-${part.key}`}
                material={part.material === 'glass' ? glassMaterial : frameMaterial}
                position={part.position}
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
