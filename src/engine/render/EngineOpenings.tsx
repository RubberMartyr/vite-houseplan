import { useMemo } from 'react';
import * as THREE from 'three';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import { archToWorldXZ } from '../spaceMapping';
import { useDebugUIState } from '../debug/debugUIState';

type OpeningMesh = {
  key: string;
  kind: DerivedOpeningRect['kind'];
  width: number;
  height: number;
  depth: number;
  color: string;
  position: [number, number, number];
  rotationY: number;
};

type Props = {
  openings: DerivedOpeningRect[];
};

export function EngineOpenings({ openings }: Props) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);

  const meshes: OpeningMesh[] = useMemo(() => {
    return openings.map((o, index) => {
      const width = o.uMax - o.uMin;
      const height = o.vMax - o.vMin;
      const { x, z } = archToWorldXZ({ x: o.centerArch.x, z: o.centerArch.z });

      return {
        key: `${o.kind}-${index}`,
        kind: o.kind,
        width,
        height,
        depth: o.wallThickness,
        color: o.kind === 'door' ? '#884422' : '#88aadd',
        position: [x, o.centerArch.y + height / 2, z],
        rotationY: Math.atan2(o.tangentXZ.z, o.tangentXZ.x),
      };
    });
  }, [openings]);

  return (
    <>
      {meshes.map((mesh) => (
        <group key={mesh.key} position={mesh.position} rotation={[0, mesh.rotationY, 0]}>
          {mesh.kind === 'window' ? (
            (() => {
              const frameThickness = 0.06;

              const frame = new THREE.BoxGeometry(mesh.width, mesh.height, mesh.depth);

              const glass = new THREE.BoxGeometry(
                mesh.width - frameThickness,
                mesh.height - frameThickness,
                0.02
              );

              return (
                <>
                  <mesh geometry={frame}>
                    <meshStandardMaterial color="#f5f5f5" wireframe={debugWireframe} />
                  </mesh>
                  <mesh geometry={glass}>
                    <meshPhysicalMaterial
                      color="#cfe8ff"
                      transmission={1}
                      roughness={0}
                      thickness={0.02}
                      wireframe={debugWireframe}
                    />
                  </mesh>
                </>
              );
            })()
          ) : (
            <mesh>
              <boxGeometry args={[mesh.width, mesh.height, mesh.depth]} />
              <meshStandardMaterial color={mesh.color} wireframe={debugWireframe} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
