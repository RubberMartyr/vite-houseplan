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
        const width = o.uMax - o.uMin;
        const height = o.vMax - o.vMin;

        const glassWidth = Math.max(0.01, width - FRAME_THICKNESS * 2);
        const glassHeight = Math.max(0.01, height - FRAME_THICKNESS * 2);

        const frameDepth = Math.max(0.01, wallThickness - GLASS_INSET * 2);
        const sideFrameHeight = Math.max(0.01, height - FRAME_THICKNESS * 2);

        const glassCenterY = (o.vMin + o.vMax) / 2;

        const tangent = new THREE.Vector3(o.tangentXZ.x, 0, o.tangentXZ.z).normalize();
        const outward = new THREE.Vector3(o.outwardXZ.x, 0, o.outwardXZ.z).normalize();

        const { x: centerX, z: centerZ } = archToWorldXZ({ x: o.centerArch.x, z: o.centerArch.z });
        const center = new THREE.Vector3(centerX, glassCenterY, centerZ);

        const inward = outward.clone().multiplyScalar(-wallThickness / 2 + GLASS_INSET);
        inward.z *= -1;

        const glassPosition = center.clone().add(inward);
        const rotationY = Math.atan2(-tangent.z, tangent.x);

        return (
          <group key={o.id} position={glassPosition.toArray()} rotation={[0, rotationY, 0]}>
            <mesh position={[0, height / 2 - FRAME_THICKNESS / 2, 0]}>
              <boxGeometry args={[width, FRAME_THICKNESS, frameDepth]} />
              <meshStandardMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[0, -height / 2 + FRAME_THICKNESS / 2, 0]}>
              <boxGeometry args={[width, FRAME_THICKNESS, frameDepth]} />
              <meshStandardMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[-width / 2 + FRAME_THICKNESS / 2, 0, 0]}>
              <boxGeometry args={[FRAME_THICKNESS, sideFrameHeight, frameDepth]} />
              <meshStandardMaterial color="#f5f5f5" />
            </mesh>
            <mesh position={[width / 2 - FRAME_THICKNESS / 2, 0, 0]}>
              <boxGeometry args={[FRAME_THICKNESS, sideFrameHeight, frameDepth]} />
              <meshStandardMaterial color="#f5f5f5" />
            </mesh>
            <mesh>
              <boxGeometry args={[glassWidth, glassHeight, GLASS_DEPTH]} />
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
          </group>
        );
      })}
    </>
  );
}
