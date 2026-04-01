import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { DerivedOpeningRect } from '../derive/types/derivedOpenings';
import { archToWorldVec3 } from '../spaceMapping';

type Props = {
  openings: DerivedOpeningRect[];
};

export function OpeningDebugOverlay({ openings }: Props) {
  const geometry = useMemo(() => new THREE.SphereGeometry(0.08, 12, 12), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xff0000 }), []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <>
      {openings.map((opening) => {
        const position = archToWorldVec3(
          opening.centerArch.x,
          opening.centerArch.y,
          opening.centerArch.z
        );

        return <mesh key={opening.id} position={position} geometry={geometry} material={material} />;
      })}
    </>
  );
}
