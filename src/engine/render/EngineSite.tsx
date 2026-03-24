import { Line } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Mesh } from 'three';
import type { Material, Object3D } from 'three';
import type { SiteSpec, Vec2 } from '../architecturalTypes';
import { DebugWireframe } from '../debug/DebugWireframe';
import { useDebugUIState } from '../debug/debugUIState';
import { buildSiteBoundaryPoints } from '../geometry/buildSiteBoundary';
import { buildSiteMesh, buildSiteSurfaceMeshes } from '../geometry/buildSiteMesh';

type EngineSiteProps = {
  site?: SiteSpec;
  cutouts?: Vec2[][];
  visible?: boolean;
};

function applyWireframe(material: Material, enabled: boolean) {
  if ('wireframe' in material) {
    material.wireframe = enabled;
    material.needsUpdate = true;
  }
}

function syncMeshWireframe(objects: Object3D[], enabled: boolean) {
  objects.forEach((object) => {
    object.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return;
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => applyWireframe(material, enabled));
    });
  });
}

export function EngineSite({ site, cutouts = [], visible = true }: EngineSiteProps) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const mesh = useMemo(() => (site ? buildSiteMesh(site, cutouts) : null), [site, cutouts]);
  const surfaceMeshes = useMemo(() => (site ? buildSiteSurfaceMeshes(site) : []), [site]);
  const boundaryPoints = useMemo(() => (site ? buildSiteBoundaryPoints(site) : []), [site]);

  useEffect(() => {
    if (!mesh) {
      return;
    }

    mesh.receiveShadow = true;
    syncMeshWireframe([mesh, ...surfaceMeshes], debugWireframe);
    surfaceMeshes.forEach((surfaceMesh) => {
      surfaceMesh.traverse((child) => {
        if (child instanceof Mesh) {
          child.receiveShadow = true;
        }
      });
    });
  }, [mesh, surfaceMeshes, debugWireframe]);

  if (!visible || !mesh) {
    return null;
  }

  return (
    <group userData={{ debugType: 'site' }}>
      <primitive object={mesh}>
        <DebugWireframe />
      </primitive>
      {surfaceMeshes.map((surfaceMesh) => (
        <primitive key={surfaceMesh.userData.siteSurfaceId ?? surfaceMesh.uuid} object={surfaceMesh}>
          <DebugWireframe />
        </primitive>
      ))}
      {boundaryPoints.length >= 2 && (
        <Line
          points={boundaryPoints}
          color="#475569"
          lineWidth={1.5}
          depthTest={false}
        />
      )}
    </group>
  );
}
