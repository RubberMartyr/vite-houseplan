import { useEffect, useMemo } from 'react';
import type { SiteSpec } from '../architecturalTypes';
import { buildSiteMesh } from '../geometry/buildSiteMesh';
import { DebugWireframe } from '../debug/DebugWireframe';
import { useDebugUIState } from '../debug/debugUIState';

type EngineSiteProps = {
  site?: SiteSpec;
  visible?: boolean;
};

export function EngineSite({ site, visible = true }: EngineSiteProps) {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const mesh = useMemo(() => (site ? buildSiteMesh(site) : null), [site]);

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
