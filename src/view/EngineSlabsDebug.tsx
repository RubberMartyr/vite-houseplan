import { useMemo } from 'react';
import type { DerivedSlab } from '../engine/derive/deriveSlabs';
import { buildSlabMesh } from './buildSlabMeshes';

type EngineSlabsDebugProps = {
  slabs: DerivedSlab[];
  visible?: boolean;
};

export function EngineSlabsDebug({ slabs, visible = true }: EngineSlabsDebugProps) {
  const slabMeshes = useMemo(() => slabs.map((slab) => buildSlabMesh(slab)), [slabs]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {slabMeshes.map((mesh, index) => (
        <primitive key={`slab-${index}`} object={mesh} />
      ))}
    </>
  );
}
