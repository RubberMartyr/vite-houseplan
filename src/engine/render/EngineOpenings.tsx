import { useMemo } from 'react';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import { archToWorldXZ } from '../spaceMapping';
import { useDebugUIState } from '../debug/debugUIState';

type OpeningMesh = {
  key: string;
  width: number;
  height: number;
  color: string;
  position: [number, number, number];
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
        width,
        height,
        color: o.kind === 'door' ? '#884422' : '#88aadd',
        position: [x, o.centerArch.y + height / 2, z],
      };
    });
  }, [openings]);

  return (
    <>
      {meshes.map((mesh) => (
        <mesh key={mesh.key} position={mesh.position}>
          <boxGeometry args={[mesh.width, mesh.height, 0.1]} />
          <meshStandardMaterial color={mesh.color} wireframe={debugWireframe} />
        </mesh>
      ))}
    </>
  );
}
