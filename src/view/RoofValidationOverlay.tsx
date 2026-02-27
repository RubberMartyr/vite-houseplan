import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { MultiPlaneRoofValidationResult } from '../engine/validation/validateMultiPlaneRoof';
import type { MultiPlaneRoofSpec } from '../engine/types';
import { archToWorldXZ, archToWorldVec3 } from '../engine/spaceMapping';

type Props = {
  entries: Array<{ roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult }>;
  highlightedRidgeId?: string | null;
};

export function RoofValidationOverlay({ entries, highlightedRidgeId = null }: Props) {
  const meshes = useMemo(() => {
    const ridgeLines: Array<{ key: string; points: [number, number, number][]; color: string }> = [];
    const faceMeshes: Array<{ key: string; geometry: THREE.BufferGeometry }> = [];

    for (const { roof, validation } of entries) {
      for (const ridge of validation.debug.invalidRidges) {
        const a = archToWorldVec3(ridge.start.x, 0.1, ridge.start.z);
        const b = archToWorldVec3(ridge.end.x, 0.1, ridge.end.z);
        ridgeLines.push({
          key: `${roof.id}-ridge-${ridge.id}`,
          points: [
            [a.x, a.y, a.z],
            [b.x, b.y, b.z],
          ],
          color: highlightedRidgeId === ridge.id ? '#ff0080' : '#ff2d2d',
        });
      }

      for (const face of validation.debug.suspiciousFaces) {
        if (!face.ridgeId) continue;
        const ridge = roof.ridgeSegments.find((item) => item.id === face.ridgeId);
        if (!ridge) continue;

        const t0 = face.ridgeT0 ?? 0;
        const t1 = face.ridgeT1 ?? 1;
        const p0 = {
          x: ridge.start.x + (ridge.end.x - ridge.start.x) * t0,
          z: ridge.start.z + (ridge.end.z - ridge.start.z) * t0,
        };
        const p1 = {
          x: ridge.start.x + (ridge.end.x - ridge.start.x) * t1,
          z: ridge.start.z + (ridge.end.z - ridge.start.z) * t1,
        };
        const w0 = archToWorldVec3(p0.x, 0.18, p0.z);
        const w1 = archToWorldVec3(p1.x, 0.18, p1.z);
        ridgeLines.push({
          key: `${roof.id}-face-${face.id}`,
          points: [
            [w0.x, w0.y, w0.z],
            [w1.x, w1.y, w1.z],
          ],
          color: '#ffd400',
        });
      }

      for (const polyDebug of validation.debug.invalidFacePolygons) {
        const points = polyDebug.polygon;
        if (points.length < 4) continue;

        const shape = new THREE.Shape();
        points.forEach((point, index) => {
          const w = archToWorldXZ(point);
          if (index === 0) {
            shape.moveTo(w.x, w.z);
          } else {
            shape.lineTo(w.x, w.z);
          }
        });
        const geom = new THREE.ShapeGeometry(shape);
        geom.rotateX(-Math.PI / 2);
        geom.translate(0, 0.08, 0);
        faceMeshes.push({ key: `${roof.id}-invalid-face-${polyDebug.faceId}`, geometry: geom });
      }
    }

    return { ridgeLines, faceMeshes };
  }, [entries, highlightedRidgeId]);

  return (
    <group>
      {meshes.ridgeLines.map((line) => (
        <Line key={line.key} points={line.points} color={line.color} lineWidth={2.5} depthTest={false} />
      ))}
      {meshes.faceMeshes.map((entry) => (
        <mesh key={entry.key} geometry={entry.geometry}>
          <meshBasicMaterial color="#ff0000" transparent opacity={0.2} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}
