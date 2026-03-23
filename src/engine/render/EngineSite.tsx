import { Line } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import type { SiteSpec } from '../architecturalTypes';
import { buildSiteBoundaryPoints } from '../geometry/buildSiteBoundary';
import { buildSiteMesh } from '../geometry/buildSiteMesh';
import { DebugWireframe } from '../debug/DebugWireframe';
import { useDebugUIState } from '../debug/debugUIState';

type EngineSiteProps = {
  site?: SiteSpec;
  cutouts?: Vec2[][];
  visible?: boolean;
};

export function EngineSite({ site, cutouts = [], visible = true }: EngineSiteProps) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const mesh = useMemo(() => (site ? buildSiteMesh(site) : null), [site]);
  const boundaryPoints = useMemo(() => (site ? buildSiteBoundaryPoints(site) : []), [site]);

  useEffect(() => {
    if (!mesh) {
      return;
    }

    mesh.receiveShadow = true;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      if ('wireframe' in material) {
        material.wireframe = debugWireframe;
        material.needsUpdate = true;
      }
    });
  }, [mesh, debugWireframe]);

  if (!visible || !mesh) {
    return null;
  }

  return (
    <group userData={{ debugType: 'site' }}>
      <primitive object={mesh}>
        <DebugWireframe />
      </primitive>
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
