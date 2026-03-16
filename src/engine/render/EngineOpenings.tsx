import React, { useMemo } from 'react';
import * as THREE from 'three';
import { archToWorldXZ } from '../spaceMapping';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import type { ArchitecturalMaterials } from '../architecturalTypes';

type Props = {
  openings: DerivedOpeningRect[];
  wallThickness?: number;
  windowsMaterialSpec?: ArchitecturalMaterials['windows'];
};

const FRAME_THICKNESS = 0.06;
const GLASS_INSET = 0.02;
const GLASS_DEPTH = 0.01;

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

  return (
    <>
      {openings.map((o) => {
        const frameThickness = FRAME_THICKNESS;
        const frameDepth = wallThickness;
        const glassInset = GLASS_INSET;

        const width = o.uMax - o.uMin;
        const height = o.vMax - o.vMin;

        const glassWidth = Math.max(0.01, width - frameThickness * 2);
        const glassHeight = Math.max(0.01, height - frameThickness * 2);

        const glassDepth = GLASS_DEPTH;
        const mullionThickness = 0.025;
        const mullionDepth = frameDepth * 0.5;
        const mullionOffset = glassDepth / 2 + 0.002;
        const sillHeight = 0.04;
        const sillDepth = 0.06;
        const sillOverhang = 0.03;

        const lintelHeight = 0.06;
        const lintelDepth = frameDepth;
        const lintelOverhang = 0.02;

        const sillY = -height / 2 - sillHeight / 2;
        const lintelY = height / 2 + lintelHeight / 2;
        const cols = o.style?.grid?.cols ?? 1;
        const rows = o.style?.grid?.rows ?? 1;
        const cellWidth = glassWidth / cols;
        const cellHeight = glassHeight / rows;

        const tangentXZ = archToWorldXZ({ x: o.tangentXZ.x, z: o.tangentXZ.z });
        const outwardXZ = archToWorldXZ({ x: o.outwardXZ.x, z: o.outwardXZ.z });

        const tangent = new THREE.Vector3(tangentXZ.x, 0, tangentXZ.z).normalize();
        const outward = new THREE.Vector3(outwardXZ.x, 0, outwardXZ.z).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        const centerY = o.centerArch.y;
        const centerXZ = archToWorldXZ({ x: o.centerArch.x, z: o.centerArch.z });

        const center = new THREE.Vector3(centerXZ.x, centerY, centerXZ.z);

        const inward = outward.clone().multiplyScalar(-wallThickness / 2 + glassInset);
        const glassPosition = center.clone().add(inward);

        const basis = new THREE.Matrix4().makeBasis(tangent, up, outward);
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

        return (
          <group key={o.id} position={glassPosition.toArray()} quaternion={quaternion.toArray()}>
            <mesh {...shadowProps} material={glassMaterial} userData={{ debugType: 'opening' }}>
              <boxGeometry args={[glassWidth, glassHeight, glassDepth]} />
            </mesh>

            {Array.from({ length: cols - 1 }).map((_, i) => {
              const x = -glassWidth / 2 + cellWidth * (i + 1);

              return (
                <mesh
                  {...shadowProps}
                  key={`v-${i}`}
                  material={frameMaterial}
                  position={[x, 0, mullionOffset]}
                  userData={{ debugIgnore: true }}
                >
                  <boxGeometry args={[mullionThickness, glassHeight, mullionDepth]} />
                </mesh>
              );
            })}

            {Array.from({ length: rows - 1 }).map((_, i) => {
              const y = -glassHeight / 2 + cellHeight * (i + 1);

              return (
                <mesh
                  {...shadowProps}
                  key={`h-${i}`}
                  material={frameMaterial}
                  position={[0, y, mullionOffset]}
                  userData={{ debugIgnore: true }}
                >
                  <boxGeometry args={[glassWidth, mullionThickness, mullionDepth]} />
                </mesh>
              );
            })}

            <mesh
              {...shadowProps}
              material={frameMaterial}
              userData={{ debugType: 'opening' }}
              position={[-glassWidth / 2 - frameThickness / 2, 0, 0]}
            >
              <boxGeometry args={[frameThickness, height, frameDepth]} />
            </mesh>

            <mesh
              {...shadowProps}
              material={frameMaterial}
              userData={{ debugType: 'opening' }}
              position={[glassWidth / 2 + frameThickness / 2, 0, 0]}
            >
              <boxGeometry args={[frameThickness, height, frameDepth]} />
            </mesh>

            <mesh
              {...shadowProps}
              material={frameMaterial}
              userData={{ debugType: 'opening' }}
              position={[0, glassHeight / 2 + frameThickness / 2, 0]}
            >
              <boxGeometry args={[width, frameThickness, frameDepth]} />
            </mesh>

            <mesh
              {...shadowProps}
              material={frameMaterial}
              userData={{ debugType: 'opening' }}
              position={[0, -glassHeight / 2 - frameThickness / 2, 0]}
            >
              <boxGeometry args={[width, frameThickness, frameDepth]} />
            </mesh>

            {o.style?.hasSill && (
              <mesh
                {...shadowProps}
                material={frameMaterial}
                position={[0, sillY, frameDepth / 2 + sillDepth / 2]}
                userData={{ debugIgnore: true }}
              >
                <boxGeometry args={[width + sillOverhang * 2, sillHeight, sillDepth]} />
              </mesh>
            )}

            {o.style?.hasLintel && (
              <mesh {...shadowProps} material={frameMaterial} position={[0, lintelY, 0]} userData={{ debugIgnore: true }}>
                <boxGeometry args={[width + lintelOverhang * 2, lintelHeight, lintelDepth]} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}
