import { useMemo } from 'react';
import * as THREE from 'three';
import type { DerivedExteriorAccessCutout } from '../derive/types/DerivedExteriorAccess';
import { archToWorldXZ } from '../spaceMapping';

type EngineGroundPlaneProps = {
  cutouts: DerivedExteriorAccessCutout[];
  visible?: boolean;
  size?: number;
};

function signedArea(points: { x: number; z: number }[]) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.z - next.x * current.z;
  }

  return area / 2;
}

function createPath(points: { x: number; z: number }[]) {
  const mapped = points.map(archToWorldXZ);
  const ordered = signedArea(mapped) > 0 ? [...mapped].reverse() : mapped;
  const [first, ...rest] = ordered;
  const path = new THREE.Path();
  path.moveTo(first.x, first.z);
  rest.forEach((point) => path.lineTo(point.x, point.z));
  path.closePath();
  return path;
}

export function EngineGroundPlane({ cutouts, visible = true, size = 160 }: EngineGroundPlaneProps) {
  const geometry = useMemo(() => {
    const halfSize = size / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfSize, -halfSize);
    shape.lineTo(halfSize, -halfSize);
    shape.lineTo(halfSize, halfSize);
    shape.lineTo(-halfSize, halfSize);
    shape.closePath();
    shape.holes.push(...cutouts.map((cutout) => createPath(cutout.polygon)));

    const groundGeometry = new THREE.ShapeGeometry(shape);
    groundGeometry.rotateX(-Math.PI / 2);
    return groundGeometry;
  }, [cutouts, size]);

  if (!visible) {
    return null;
  }

  return (
    <mesh geometry={geometry} position={[0, -0.001, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#d8d8d8" side={THREE.DoubleSide} />
    </mesh>
  );
}
