import type { DerivedHouse } from '../derive/types/DerivedHouse';
import { DebugWireframe } from './DebugWireframe';
import { debugFlags } from './debugFlags';
import { DerivedGraphOverlay } from './DerivedGraphOverlay';
import { EngineDebugHUD } from './EngineDebugHUD';
import { OpeningDebugOverlay } from './OpeningDebugOverlay';
import { RoofPlaneVisualizer } from './RoofPlaneVisualizer';
import { WallNormalsOverlay } from './WallNormalsOverlay';

type Props = {
  derived: DerivedHouse;
};

export function shouldRenderDebugLayer(): boolean {
  return debugFlags.enabled;
}

export function EngineDebugLayer({ derived }: Props) {
  if (!shouldRenderDebugLayer()) {
    return null;
  }

  return (
    <>
      <EngineDebugHUD derived={derived} />
      {debugFlags.showWireframe && <DebugWireframe forceVisible />}
      {debugFlags.showRoofPlanes && (
        <RoofPlaneVisualizer roofs={derived.roofs} roofRevision={derived.revisions.roofs} />
      )}
      {debugFlags.showDerivedGraph && <DerivedGraphOverlay derived={derived} />}
      {debugFlags.showWallNormals && <WallNormalsOverlay walls={derived.walls} />}
      {debugFlags.showOpenings && <OpeningDebugOverlay openings={derived.openings} />}
    </>
  );
}
