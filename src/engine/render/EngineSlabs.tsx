import { useMemo } from 'react';
import type { DerivedSlab } from '../derive/deriveSlabs';
import { buildSlabMesh } from '../../view/buildSlabMeshes';
import { renderStyleConfig } from '../../view/renderStyleConfig';

type EngineSlabsProps = {
  slabs: DerivedSlab[];
  visible?: boolean;
};

export function EngineSlabs({ slabs, visible = true }: EngineSlabsProps) {
  const slabMeshes = useMemo(
    () => slabs.map((slab) => buildSlabMesh(slab, renderStyleConfig)),
    [slabs],
  );

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
