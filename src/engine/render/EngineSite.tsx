import { useEffect, useMemo } from 'react';
import type { SiteSpec, Vec2 } from '../architecturalTypes';
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
  const mesh = useMemo(() => (site ? buildSiteMesh(site, cutouts) : null), [cutouts, site]);

  useEffect(() => {
    if (!mesh) {
      return;
    }

    mesh.receiveShadow = true;

    const material = mesh.material;
    if ('wireframe' in material) {
      material.wireframe = debugWireframe;
      material.needsUpdate = true;
    }
  }, [mesh, debugWireframe]);

  if (!visible || !mesh) {
    return null;
  }

  return (
    <primitive object={mesh} userData={{ debugType: 'site' }}>
      <DebugWireframe />
    </primitive>
  );
}
