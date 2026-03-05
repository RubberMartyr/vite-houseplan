import * as THREE from 'three';
import { useMemo } from 'react';
import type { DerivedOpeningRect } from '../derive/types/derivedOpenings';
import { archToWorldXZ } from '../spaceMapping';

type Props = {
  openings: DerivedOpeningRect[];
};

export function EngineOpenings({ openings }: Props) {
  const meshes = useMemo(() => {
    return openings.map((o) => {
      const width = o.uMax - o.uMin;
      const height = o.vMax - o.vMin;

      const geometry = new THREE.BoxGeometry(width, height, 0.1);

      const material = new THREE.MeshStandardMaterial({
        color: o.kind === 'door' ? '#884422' : '#88aadd',
      });

      const { x, z } = archToWorldXZ({ x: o.centerArch.x, z: o.centerArch.z });

      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(
        x,
        o.centerArch.y + height / 2,
        z
      );

      return mesh;
    });
  }, [openings]);

  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
}
