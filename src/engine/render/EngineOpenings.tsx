import { useMemo } from 'react';
import * as THREE from 'three';
import type { DerivedWallSegment } from '../deriveWalls';
import type { DerivedOpening } from '../derive/types/DerivedOpening';
import { archToWorldXZ } from '../spaceMapping';
import { useDebugUIState } from '../debug/debugUIState';
import { createGeometryCache } from '../cache/geometryCache';
import { buildOpeningFrameGeometry } from '../openings/buildOpeningFrameGeometry';
import { buildOpeningGlassGeometry } from '../openings/buildOpeningGlassGeometry';

type OpeningDraw = {
  id: string;
  kind: DerivedOpening['kind'];
  position: [number, number, number];
  rotationY: number;
  frameGeometry: THREE.BufferGeometry;
  glassGeometry: THREE.BufferGeometry | null;
};

type Props = {
  openings: DerivedOpening[];
  walls: DerivedWallSegment[];
  openingsRevision: number;
};

const getOpeningGeometry = createGeometryCache<OpeningDraw[]>();

export function EngineOpenings({ openings, walls, openingsRevision }: Props) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);

  const meshes: OpeningDraw[] = useMemo(() => {
    const wallById = new Map(walls.map((wall) => [wall.id, wall]));

    return getOpeningGeometry(openingsRevision, () =>
      openings.map((opening) => {
        const wall = wallById.get(opening.wallId);
        const wallThickness = wall?.thickness ?? opening.style.frameDepth;
        const frameDepth = Math.min(opening.style.frameDepth, wallThickness);

        const frameGeometry = buildOpeningFrameGeometry(
          opening.width,
          opening.height,
          opening.style.frameThickness,
          frameDepth
        );

        const glassGeometry =
          opening.kind === 'window'
            ? buildOpeningGlassGeometry(
                opening.width,
                opening.height,
                opening.style.frameThickness,
                opening.style.glassThickness,
                opening.style.glassInset,
                frameDepth
              )
            : null;

        const { x, z } = archToWorldXZ({ x: opening.centerArch.x, z: opening.centerArch.z });

        return {
          id: opening.id,
          kind: opening.kind,
          position: [x, opening.centerArch.y, z],
          rotationY: Math.atan2(opening.tangentXZ.z, opening.tangentXZ.x),
          frameGeometry,
          glassGeometry,
        };
      })
    );
  }, [openings, walls, openingsRevision]);

  return (
    <>
      {meshes.map((mesh) => (
        <group key={mesh.id} position={mesh.position} rotation={[0, mesh.rotationY, 0]}>
          <mesh geometry={mesh.frameGeometry}>
            <meshStandardMaterial color="#f5f5f5" wireframe={debugWireframe} />
          </mesh>
          {mesh.glassGeometry && (
            <mesh geometry={mesh.glassGeometry}>
              <meshPhysicalMaterial
                color="#cfe8ff"
                transmission={1}
                roughness={0}
                thickness={0.02}
                wireframe={debugWireframe}
              />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
