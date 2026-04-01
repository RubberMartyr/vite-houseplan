import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { DerivedWallSegment } from '../derive/types/DerivedWallSegment';
import { getWallVisibleBaseY } from '../deriveWalls';
import { archToWorldVec3 } from '../spaceMapping';

type Props = {
  walls: DerivedWallSegment[];
};

export function EdgeVisualizer({ walls }: Props) {
  const lowestBaseY = Math.min(...walls.map((wall) => getWallVisibleBaseY(wall)));

  return (
    <>
      {walls.map((wall) => {
        const start = archToWorldVec3(wall.start.x, wall.start.y, wall.start.z);
        const end = archToWorldVec3(wall.end.x, wall.end.y, wall.end.z);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const arrowEnd = new THREE.Vector3().copy(mid).add(dir.multiplyScalar(0.5));
        const color = Math.abs(getWallVisibleBaseY(wall) - lowestBaseY) < 1e-6 ? 'cyan' : 'magenta';

        return (
          <group key={wall.id}>
            <Line points={[start, end]} color={color} lineWidth={2} />
            <Line points={[mid, arrowEnd]} color="yellow" lineWidth={2} />
            <Text
              position={[mid.x, mid.y + 0.2, mid.z]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {wall.id}
            </Text>
          </group>
        );
      })}
    </>
  );
}
