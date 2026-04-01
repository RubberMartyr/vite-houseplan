import { Suspense, lazy } from 'react';
import type { DerivedHouse } from '../derive/types/DerivedHouse';
import { debugFlags } from './debugFlags';

const DebugWireframe = lazy(() =>
  import('./DebugWireframe').then((module) => ({ default: module.DebugWireframe }))
);
const DerivedGraphOverlay = lazy(() =>
  import('./DerivedGraphOverlay').then((module) => ({ default: module.DerivedGraphOverlay }))
);
const EngineDebugHUD = lazy(() =>
  import('./EngineDebugHUD').then((module) => ({ default: module.EngineDebugHUD }))
);
const OpeningDebugOverlay = lazy(() =>
  import('./OpeningDebugOverlay').then((module) => ({ default: module.OpeningDebugOverlay }))
);
const RoofPlaneVisualizer = lazy(() =>
  import('./RoofPlaneVisualizer').then((module) => ({ default: module.RoofPlaneVisualizer }))
);
const WallNormalsOverlay = lazy(() =>
  import('./WallNormalsOverlay').then((module) => ({ default: module.WallNormalsOverlay }))
);

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
    <Suspense fallback={null}>
      <EngineDebugHUD derived={derived} />
      {debugFlags.showWireframe && <DebugWireframe forceVisible />}
      {debugFlags.showRoofPlanes && (
        <RoofPlaneVisualizer roofs={derived.roofs} roofRevision={derived.revisions.roofs} />
      )}
      {debugFlags.showDerivedGraph && <DerivedGraphOverlay derived={derived} />}
      {debugFlags.showWallNormals && <WallNormalsOverlay walls={derived.walls} />}
      {debugFlags.showOpenings && <OpeningDebugOverlay openings={derived.openings} />}
    </Suspense>
  );
}
