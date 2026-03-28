import { Line } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ArchitecturalHouse, LevelSpec, Vec2 } from '../architecturalTypes';
import { archToWorldVec3, archToWorldXZ } from '../spaceMapping';
import type { FloorplanValidationResult, ValidationIssue } from '../validation/validateFloorplan';

type Props = {
  architecturalHouse: ArchitecturalHouse;
  validationResult: FloorplanValidationResult | null;
  showFloorplanOverlay: boolean;
  showValidationIssues: boolean;
};

type PolygonMesh = {
  key: string;
  geometry: THREE.BufferGeometry;
  color: string;
  opacity: number;
};

type LineEntry = {
  key: string;
  points: [number, number, number][];
  color: string;
};

function polygonToShapeGeometry(points: Vec2[], yOffset: number): THREE.BufferGeometry | null {
  if (points.length < 3) {
    return null;
  }

  const shape = new THREE.Shape();
  points.forEach((point, index) => {
    const mapped = archToWorldXZ(point);
    if (index === 0) {
      shape.moveTo(mapped.x, mapped.z);
    } else {
      shape.lineTo(mapped.x, mapped.z);
    }
  });

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, yOffset, 0);
  return geometry;
}

function polygonToLoop(levelY: number, points: Vec2[]): [number, number, number][] {
  const loop = points.map((point) => {
    const world = archToWorldVec3(point.x, levelY, point.z);
    return [world.x, world.y, world.z] as [number, number, number];
  });

  if (loop.length > 0) {
    loop.push(loop[0]);
  }

  return loop;
}

function issueEdgeLines(issues: ValidationIssue[], levelById: Map<string, LevelSpec>): LineEntry[] {
  return issues
    .filter((issue) => issue.edge)
    .map((issue, index) => {
      const levelY = (issue.levelId ? levelById.get(issue.levelId)?.elevation : undefined) ?? 0;
      const color =
        issue.code === 'ROOM_T_JUNCTION'
          ? '#22d3ee'
          : issue.code === 'ROOM_PARTIAL_SHARED_EDGE' && issue.severity === 'warning'
            ? '#facc15'
            : issue.severity === 'error'
              ? '#fb923c'
              : issue.severity === 'warning'
                ? '#facc15'
                : '#38bdf8';
      const a = archToWorldVec3(issue.edge!.a.x, levelY + 0.08, issue.edge!.a.z);
      const b = archToWorldVec3(issue.edge!.b.x, levelY + 0.08, issue.edge!.b.z);
      return {
        key: `${issue.code}-${index}`,
        points: [
          [a.x, a.y, a.z],
          [b.x, b.y, b.z],
        ],
        color,
      };
    });
}

export function FloorplanValidationOverlay({
  architecturalHouse,
  validationResult,
  showFloorplanOverlay,
  showValidationIssues,
}: Props) {
  const levelById = useMemo(
    () => new Map(architecturalHouse.levels.map((level) => [level.id, level])),
    [architecturalHouse.levels]
  );

  const overlayData = useMemo(() => {
    const meshes: PolygonMesh[] = [];
    const lines: LineEntry[] = [];

    if (showFloorplanOverlay) {
      for (const level of architecturalHouse.levels) {
        const footprintGeometry = polygonToShapeGeometry(level.footprint.outer, level.elevation + 0.015);
        if (footprintGeometry) {
          meshes.push({
            key: `footprint-${level.id}`,
            geometry: footprintGeometry,
            color: '#22c55e',
            opacity: 0.18,
          });
        }

        lines.push({
          key: `footprint-line-${level.id}`,
          points: polygonToLoop(level.elevation + 0.03, level.footprint.outer),
          color: '#22c55e',
        });
      }

      for (const room of architecturalHouse.rooms ?? []) {
        const level = levelById.get(room.levelId);
        if (!level) continue;

        const geometry = polygonToShapeGeometry(room.polygon, level.elevation + 0.04);
        if (geometry) {
          meshes.push({
            key: `room-overlay-${room.id}`,
            geometry,
            color: '#ef4444',
            opacity: 0.2,
          });
        }
      }
    }

    if (showValidationIssues && validationResult) {
      for (const level of architecturalHouse.levels) {
        const uncoveredPolygons = validationResult.perLevel[level.id]?.uncoveredPolygons ?? [];
        for (let i = 0; i < uncoveredPolygons.length; i += 1) {
          const geom = polygonToShapeGeometry(uncoveredPolygons[i], level.elevation + 0.06);
          if (geom) {
            meshes.push({
              key: `uncovered-${level.id}-${i}`,
              geometry: geom,
              color: '#f59e0b',
              opacity: 0.42,
            });
          }
        }
      }

      const overlapIssues = validationResult.issues.filter((issue) => issue.code === 'ROOM_OVERLAP');
      for (const [index, issue] of overlapIssues.entries()) {
        const overlapPolygons = (issue.meta?.overlapPolygons as Vec2[][] | undefined) ?? [];
        const levelY = (issue.levelId ? levelById.get(issue.levelId)?.elevation : undefined) ?? 0;

        if (overlapPolygons.length === 0 && issue.roomIds) {
          for (const roomId of issue.roomIds) {
            const room = architecturalHouse.rooms?.find((entry) => entry.id === roomId);
            if (!room) continue;
            const geom = polygonToShapeGeometry(room.polygon, levelY + 0.07);
            if (geom) {
              meshes.push({
                key: `overlap-room-highlight-${room.id}-${index}`,
                geometry: geom,
                color: '#9333ea',
                opacity: 0.2,
              });
            }
          }
          continue;
        }

        for (let i = 0; i < overlapPolygons.length; i += 1) {
          const geom = polygonToShapeGeometry(overlapPolygons[i], levelY + 0.07);
          if (geom) {
            meshes.push({
              key: `overlap-polygon-${index}-${i}`,
              geometry: geom,
              color: '#9333ea',
              opacity: 0.45,
            });
          }
        }
      }

      lines.push(...issueEdgeLines(validationResult.issues, levelById));
    }

    return { meshes, lines };
  }, [architecturalHouse, levelById, showFloorplanOverlay, showValidationIssues, validationResult]);

  useEffect(() => () => {
    overlayData.meshes.forEach((mesh) => mesh.geometry.dispose());
  }, [overlayData.meshes]);

  if (!showFloorplanOverlay && !(showValidationIssues && validationResult)) {
    return null;
  }

  return (
    <group>
      {overlayData.meshes.map((mesh) => (
        <mesh key={mesh.key} geometry={mesh.geometry}>
          <meshBasicMaterial
            color={mesh.color}
            transparent
            opacity={mesh.opacity}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>
      ))}
      {overlayData.lines.map((line) => (
        <Line key={line.key} points={line.points} color={line.color} lineWidth={3} depthTest={false} />
      ))}
    </group>
  );
}
