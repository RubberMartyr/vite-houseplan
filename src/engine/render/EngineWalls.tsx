import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import type { Vec2 } from '../architecturalTypes';
import { getWallVisibleHeight, type DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
import type { BuiltWall } from '../buildWallsFromDerivedSegments';
import { extrudeWallSegment } from '../extrudeWallSegment';
import { DebugWireframe } from '../debug/DebugWireframe';
import { createGeometryCache } from '../cache/createGeometryCache';
import { useDebugUIState } from '../debug/debugUIState';
import { debugFlags } from '../debug/debugFlags';
import {
  createSeparatorDebugMetadata,
  isSeparatorCandidatePiece,
  logSeparatorDebug,
} from '../debug/separatorDebug';
import { groupOpeningsByWall } from '../openings/groupOpeningsByWall';
import { splitWallByOpenings } from '../openings/splitWallByOpenings';
import { buildWallPieceGeometry } from '../geometry/buildWallPieceGeometry';
import { createWallMaterials } from '../materials/materialResolver';
import type { ArchitecturalMaterials } from '../architecturalTypes';
import { mergeExteriorWallsForRendering } from './mergeExteriorWallsForRendering';

type EngineWallsProps = {
  walls: DerivedWallSegment[];
  openings: DerivedOpening[];
  wallRevision: number;
  openingsRevision: number;
  levelFootprintsById?: Record<string, Vec2[]>;
  visible?: boolean;
  wallMaterialSpec?: ArchitecturalMaterials['walls'];
  cacheKey?: string;
};

type BuiltWallPiece = BuiltWall & {
  debugSeparatorCandidate?: boolean;
  debugThinBand?: boolean;
};

type DisposableBuiltWallCollection = {
  value: BuiltWallPiece[];
  dispose: () => void;
};

function toDisposableBuiltWalls(walls: BuiltWallPiece[]): DisposableBuiltWallCollection {
  return {
    value: walls,
    dispose: () => {
      walls.forEach((wall) => wall.geometry.dispose());
    },
  };
}

function buildWallGeometry(
  walls: DerivedWallSegment[],
  openings: DerivedOpening[],
  levelFootprintsById: Record<string, Vec2[]> | undefined,
  wallMaterialScale: number,
  debugEnabled: boolean
): BuiltWallPiece[] {
  const exteriorWalls = walls.filter((wall) => wall.kind !== 'interior');
  const interiorWalls = walls.filter((wall) => wall.kind === 'interior');
  const { walls: mergedExteriorWalls, openings: visibleOpenings } = mergeExteriorWallsForRendering(
    exteriorWalls,
    openings
  );
  const visibleWalls = [...mergedExteriorWalls, ...interiorWalls];
  const openingsByWall = groupOpeningsByWall(visibleWalls, visibleOpenings);

  if (debugEnabled) {
    console.log('[GeometryCache] rebuilding wall geometry', {
      wallCount: walls.length,
      openingCount: openings.length,
    });
    console.debug('[separator-debug]', {
      stage: 'EngineWalls:post-merge',
      wallCountBeforeMerge: walls.length,
      wallCountAfterMerge: visibleWalls.length,
      openingCountBeforeMerge: openings.length,
      openingCountAfterMerge: visibleOpenings.length,
    });
  }

  return visibleWalls.flatMap((wall) => {
    const openingsOnWall = openingsByWall.get(wall.id) ?? [];
    const footprintOuter = levelFootprintsById?.[wall.levelId];

    if (!openingsOnWall.length) {
      if (debugEnabled) {
        console.debug('[separator-debug]', {
          stage: 'EngineWalls:no-openings-direct-render',
          wallId: wall.id,
        });
      }

      return [
        {
          id: wall.id,
          geometry: extrudeWallSegment(wall, wallMaterialScale, footprintOuter),
        },
      ];
    }

    const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    const pieces = splitWallByOpenings(wallLength, getWallVisibleHeight(wall), openingsOnWall, wall);

    if (debugEnabled) {
      console.debug('[separator-debug]', {
        stage: 'EngineWalls:split-result',
        wallId: wall.id,
        openingsOnWall: openingsOnWall.map((opening) => ({
          openingId: opening.id,
          vMin: opening.vMin,
          vMax: opening.vMax,
        })),
        pieceCount: pieces.length,
      });
    }

    return pieces.map((piece, pieceIndex) => {
      const pieceId = `${wall.id}-piece-${pieceIndex}`;
      const debugSeparatorCandidate = isSeparatorCandidatePiece(piece);
      const debugThinBand = piece.vMax - piece.vMin < 0.8;

      if (debugSeparatorCandidate) {
        logSeparatorDebug(
          debugEnabled,
          createSeparatorDebugMetadata('EngineWalls:piece-ready-for-geometry', wall.id, piece, {
            pieceId,
            renderedIntoMesh: true,
          })
        );
      }

      return {
        id: pieceId,
        debugSeparatorCandidate,
        debugThinBand,
        geometry: buildWallPieceGeometry(wall, piece, wallMaterialScale, footprintOuter, pieceId),
      };
    });
  });
}

export function EngineWalls({
  walls,
  openings,
  wallRevision,
  openingsRevision,
  levelFootprintsById,
  visible = true,
  wallMaterialSpec,
  cacheKey = 'default',
}: EngineWallsProps) {
  const geometryCache = useRef(createGeometryCache<DisposableBuiltWallCollection>());
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const debugEnabled = debugFlags.enabled;
  const wallMaterialScale = wallMaterialSpec?.scale ?? 0.6;
  const wallMaterials = useMemo(() => createWallMaterials(wallMaterialSpec), [wallMaterialSpec]);
  const interiorWallMaterials = useMemo(
    () =>
      wallMaterials.map((material) => {
        const clone = material.clone();
        if ('color' in clone && wallMaterialSpec?.interiorColor) {
          clone.color.set(wallMaterialSpec.interiorColor);
        }
        return clone;
      }),
    [wallMaterialSpec?.interiorColor, wallMaterials]
  );
  const separatorDebugMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
      }),
    []
  );

  useEffect(() => {
    wallMaterials.forEach((material) => {
      if ('wireframe' in material) {
        material.wireframe = debugWireframe;
      }
    });
  }, [debugWireframe, wallMaterials]);

  useEffect(() => () => separatorDebugMaterial.dispose(), [separatorDebugMaterial]);
  useEffect(() => () => wallMaterials.forEach((material) => material.dispose()), [wallMaterials]);
  useEffect(
    () => () => interiorWallMaterials.forEach((material) => material.dispose()),
    [interiorWallMaterials]
  );
  useEffect(
    () => () => {
      geometryCache.current.dispose();
    },
    []
  );

  const builtWalls = useMemo(() => {
    if (!visible) {
      return [];
    }

    const revision = `${cacheKey}:${wallRevision}:${openingsRevision}`;
    const numericRevision = Array.from(revision).reduce(
      (hash, char) => ((hash * 31 + char.charCodeAt(0)) | 0) >>> 0,
      0
    );
    const cached = geometryCache.current.get(numericRevision);

    if (cached) {
      if (debugEnabled) {
        console.log('[GeometryCache] reusing wall geometry', {
          cacheKey,
          revision,
          wallCount: walls.length,
        });
      }
      return cached.value;
    }

    const disposable = toDisposableBuiltWalls(
      buildWallGeometry(walls, openings, levelFootprintsById, wallMaterialScale, debugEnabled)
    );

    geometryCache.current.set(numericRevision, disposable);

    return disposable.value;
  }, [
    cacheKey,
    debugEnabled,
    levelFootprintsById,
    openings,
    openingsRevision,
    visible,
    wallMaterialScale,
    wallRevision,
    walls,
  ]);

  const normalBuiltWalls = useMemo(
    () => (debugEnabled ? builtWalls.filter((wall) => !wall.debugThinBand) : builtWalls),
    [builtWalls, debugEnabled]
  );

  const separatorBuiltWalls = useMemo(
    () => (debugEnabled ? builtWalls.filter((wall) => wall.debugThinBand) : []),
    [builtWalls, debugEnabled]
  );

  if (!visible) {
    return null;
  }

  if (!normalBuiltWalls.length && !separatorBuiltWalls.length) {
    return null;
  }

  return (
    <>
      {normalBuiltWalls.map(({ id, geometry }) => {
        const wall = walls.find((candidate) => id.startsWith(candidate.id));
        return (
          <mesh
            key={id}
            geometry={geometry}
            material={wall?.kind === 'interior' ? interiorWallMaterials : wallMaterials}
            castShadow
            receiveShadow
            userData={{ debugType: 'structure' }}
          >
            <DebugWireframe />
          </mesh>
        );
      })}
      {debugEnabled &&
        separatorBuiltWalls.map(({ id, geometry }) => (
          <mesh
            key={id}
            geometry={geometry}
            material={separatorDebugMaterial}
            position={[0, 0, 0.01]}
            castShadow
            receiveShadow
            userData={{ debugType: 'structure', debugSeparatorCandidate: true, debugThinBand: true }}
          >
            <DebugWireframe />
          </mesh>
        ))}
    </>
  );
}
