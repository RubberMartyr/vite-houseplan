import { memo, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { DerivedSlab } from '../derive/deriveSlabs';
import { buildSlabMesh } from '../../view/buildSlabMeshes';
import { renderStyleConfig } from '../../view/renderStyleConfig';
import { DebugWireframe } from '../debug/DebugWireframe';
import { useDebugUIState } from '../debug/debugUIState';
import { createGeometryCache } from '../cache/createGeometryCache';
import { debugFlags } from '../debug/debugFlags';
import { incrementGeometryRebuildCount, profileGeometryBuild } from '../debug/geometryProfiler';

type EngineSlabsProps = {
  slabs: DerivedSlab[];
  slabRevision: number;
  visible?: boolean;
};

type DisposableSlabMeshes = {
  value: THREE.Mesh[];
  dispose: () => void;
};

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}

function toDisposableSlabMeshes(meshes: THREE.Mesh[]): DisposableSlabMeshes {
  return {
    value: meshes,
    dispose: () => {
      meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        disposeMaterial(mesh.material);
      });
    },
  };
}

export const EngineSlabs = memo(function EngineSlabs({ slabs, slabRevision, visible = true }: EngineSlabsProps) {
  const geometryCache = useRef(createGeometryCache<DisposableSlabMeshes>());
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const debugEnabled = debugFlags.enabled;
  // Both floor slabs and roof-bearing slabs are structural elements that should
  // remain visible; hiding roof-bearing slabs removes the roof deck above upper levels.
  const renderableSlabs = useMemo(() => slabs, [slabs]);

  useEffect(() => () => geometryCache.current.dispose(), []);

  const slabMeshes = useMemo(() => {
    const cached = geometryCache.current.get(slabRevision);
    if (cached) {
      if (debugEnabled) {
        console.log('[GeometryCache] reusing slab geometry', {
          revision: slabRevision,
          slabCount: slabs.length,
        });
      }
      return cached.value;
    }

    if (debugEnabled) {
      console.log('[GeometryCache] rebuilding slab geometry', {
        revision: slabRevision,
        slabCount: slabs.length,
      });
    }

    const next = profileGeometryBuild('Slabs', () =>
      toDisposableSlabMeshes(renderableSlabs.map((slab) => buildSlabMesh(slab, renderStyleConfig)))
    );
    incrementGeometryRebuildCount('slabs');
    geometryCache.current.set(slabRevision, next);

    return next.value;
  }, [debugEnabled, renderableSlabs, slabRevision, slabs.length]);

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
        <primitive
          key={renderableSlabs[index]?.id ?? `slab-${index}`}
          object={mesh}
          userData={{ debugType: 'structure' }}
        >
          <DebugWireframe />
        </primitive>
      ))}
    </>
  );
});
