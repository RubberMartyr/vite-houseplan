import { useEffect, useMemo } from 'react';
import type { DerivedSlab } from '../derive/deriveSlabs';
import { buildSlabMesh } from '../../view/buildSlabMeshes';
import { renderStyleConfig } from '../../view/renderStyleConfig';
import { DebugWireframe } from '../debug/DebugWireframe';
import { useDebugUIState } from '../debug/debugUIState';

type EngineSlabsProps = {
  slabs: DerivedSlab[];
  visible?: boolean;
};

export function EngineSlabs({ slabs, visible = true }: EngineSlabsProps) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const slabMeshes = useMemo(
    () => slabs.map((slab) => buildSlabMesh(slab, renderStyleConfig)),
    [slabs],
  );

  useEffect(() => {
    slabMeshes.forEach((mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => {
          if ('wireframe' in entry) {
            entry.wireframe = debugWireframe;
            entry.needsUpdate = true;
          }
        });
        return;
      }

      if ('wireframe' in material) {
        material.wireframe = debugWireframe;
        material.needsUpdate = true;
      }
    });
  }, [slabMeshes, debugWireframe]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {slabMeshes.map((mesh, index) => (
        <primitive key={`slab-${index}`} object={mesh} userData={{ debugType: 'structure' }}>
          <DebugWireframe />
        </primitive>
      ))}
    </>
  );
}
