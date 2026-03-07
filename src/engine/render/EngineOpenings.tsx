import * as THREE from 'three';
import { archToWorldXZ } from '../spaceMapping';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';

type Props = {
  openings: DerivedOpeningRect[];
  wallThickness?: number;
};

const FRAME_THICKNESS = 0.06;
const GLASS_INSET = 0.02;
const GLASS_DEPTH = 0.01;

export function EngineOpenings({ openings, wallThickness = 0.3 }: Props) {
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

        const tangentXZ = archToWorldXZ({ x: o.tangentXZ.x, z: o.tangentXZ.z });
        const outwardXZ = archToWorldXZ({ x: o.outwardXZ.x, z: o.outwardXZ.z });

        const tangent = new THREE.Vector3(tangentXZ.x, 0, tangentXZ.z).normalize();
        const outward = new THREE.Vector3(outwardXZ.x, 0, outwardXZ.z).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        const openingCenterYOffset = (o.vMin + o.vMax) / 2;
        const levelElevation =
          'baseElevation' in o
            ? o.baseElevation
            : 'levelElevation' in o
              ? o.levelElevation
              : o.centerArch.y - openingCenterYOffset;
        const centerY = levelElevation + openingCenterYOffset;
        const centerXZ = archToWorldXZ({ x: o.centerArch.x, z: o.centerArch.z });

        const center = new THREE.Vector3(centerXZ.x, centerY, centerXZ.z);

        const inward = outward.clone().multiplyScalar(-wallThickness / 2 + glassInset);
        const glassPosition = center.clone().add(inward);

        const basis = new THREE.Matrix4().makeBasis(tangent, up, outward);
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

        return (
          <group key={o.id} position={glassPosition.toArray()} quaternion={quaternion.toArray()}>
            <mesh userData={{ debugOpening: true }}>
              <boxGeometry args={[glassWidth, glassHeight, glassDepth]} />
              <meshPhysicalMaterial
                transmission={1}
                thickness={0.01}
                roughness={0.05}
                metalness={0}
                transparent
                opacity={0.6}
                color="#cfe8ff"
              />
            </mesh>

            <mesh userData={{ debugOpening: true }} position={[-glassWidth / 2 - frameThickness / 2, 0, 0]}>
              <boxGeometry args={[frameThickness, height, frameDepth]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>

            <mesh userData={{ debugOpening: true }} position={[glassWidth / 2 + frameThickness / 2, 0, 0]}>
              <boxGeometry args={[frameThickness, height, frameDepth]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>

            <mesh userData={{ debugOpening: true }} position={[0, glassHeight / 2 + frameThickness / 2, 0]}>
              <boxGeometry args={[width, frameThickness, frameDepth]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>

            <mesh userData={{ debugOpening: true }} position={[0, -glassHeight / 2 - frameThickness / 2, 0]}>
              <boxGeometry args={[width, frameThickness, frameDepth]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
