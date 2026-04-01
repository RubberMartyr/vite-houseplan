import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import type { DerivedHouse } from '../derive/types/DerivedHouse';
import { getGeometryRebuildCounts } from './geometryProfiler';

type Props = {
  derived: DerivedHouse;
};

export function EngineDebugHUD({ derived }: Props) {
  const rebuildCounts = useMemo(() => getGeometryRebuildCounts(), [
    derived.revisions.walls,
    derived.revisions.roofs,
    derived.revisions.slabs,
  ]);

  return (
    <Html prepend>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        <div>DerivedHouse</div>
        <div>slabs: {derived.slabs.length}</div>
        <div>walls: {derived.walls.length}</div>
        <div>roofs: {derived.roofs.length}</div>
        <div>carports: {derived.carports.length}</div>
        <div>openings: {derived.openings.length}</div>
        <div style={{ marginTop: 8 }}>Rebuild counters</div>
        <div>wallRebuildCount: {rebuildCounts.walls}</div>
        <div>roofRebuildCount: {rebuildCounts.roofs}</div>
        <div>slabRebuildCount: {rebuildCounts.slabs}</div>
      </div>
    </Html>
  );
}
