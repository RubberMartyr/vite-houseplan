import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { MultiPlaneRoofSpec, XZ } from '../engine/types';
import { archToWorldXZ } from '../engine/spaceMapping';
import type { MultiPlaneRoofValidationResult } from '../engine/validation/validateMultiPlaneRoof';

type OverlayDebugItem = {
  roof: MultiPlaneRoofSpec;
  report: MultiPlaneRoofValidationResult;
};

type Props = {
  debug: OverlayDebugItem[];
  highlightedRidgeId?: string | null;
};

function toPoint3(p: XZ, y = 0.2): [number, number, number] {
  const wp = archToWorldXZ(p);
  return [wp.x, y, wp.z];
}

export function RoofValidationOverlay({ debug, highlightedRidgeId }: Props) {
  const faces = useMemo(() => {
    return debug.flatMap(({ roof, report }) =>
      report.debug.invalidFaces.map((face) => {
        const region = face.region;
        if (region.type !== 'ridgeCapTriangle') return null;
        const ridge = roof.ridgeSegments.find((r) => r.id === region.ridgeId);
        if (!ridge) return null;

        const apex = region.end === 'start' ? ridge.start : ridge.end;
        const base = region.end === 'start' ? ridge.end : ridge.start;

        const pA = toPoint3(apex, 0.25);
        const pB = toPoint3({ x: (apex.x + base.x) / 2 + 0.4, z: (apex.z + base.z) / 2 }, 0.25);
        const pC = toPoint3({ x: (apex.x + base.x) / 2 - 0.4, z: (apex.z + base.z) / 2 }, 0.25);

        return [pA, pB, pC];
      }).filter(Boolean) as [number, number, number][][]
    );
  }, [debug]);

  return (
    <group>
      {debug.flatMap(({ report }) => report.debug.invalidRidges).map((ridge, idx) => {
        const color = ridge.id === highlightedRidgeId ? '#ff00ff' : '#ff2d2d';
        return (
          <Line
            key={`invalid-ridge-${ridge.id}-${idx}`}
            points={[toPoint3(ridge.start, 0.35), toPoint3(ridge.end, 0.35)]}
            color={color}
            lineWidth={3}
          />
        );
      })}

      {debug.flatMap(({ report }) => report.debug.suspiciousFaces).map((face, idx) => {
        if (!face.ridgeId) return null;
        const roof = debug.find((entry) => entry.roof.faces.some((f) => f.id === face.id))?.roof;
        const ridge = roof?.ridgeSegments.find((r) => r.id === face.ridgeId);
        if (!ridge) return null;

        return (
          <Line
            key={`warning-face-${face.id}-${idx}`}
            points={[toPoint3(ridge.start, 0.3), toPoint3(ridge.end, 0.3)]}
            color="#facc15"
            lineWidth={2}
          />
        );
      })}

      {faces.map((triangle, idx) => (
        <mesh key={`invalid-face-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(triangle.flat()), 3]}
              count={3}
              itemSize={3}
            />
          </bufferGeometry>
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
