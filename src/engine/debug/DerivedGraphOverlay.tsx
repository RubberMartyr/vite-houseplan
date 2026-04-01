import { Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import type { DerivedHouse, RevisionKey } from '../derive/types/DerivedHouse';

type Props = {
  derived: DerivedHouse;
};

type RevisionSnapshot = DerivedHouse['revisions'];


export function getDerivedGraphSummary(derived: DerivedHouse): string[] {
  return [
    `slabs: ${derived.slabs.length} (rev ${derived.revisions.slabs})`,
    `walls: ${derived.walls.length} (rev ${derived.revisions.walls})`,
    `openings: ${derived.openings.length} (rev ${derived.revisions.openings})`,
    `roofs: ${derived.roofs.length} (rev ${derived.revisions.roofs})`,
    `carports: ${derived.carports.length} (rev ${derived.revisions.carports})`,
  ];
}

export function DerivedGraphOverlay({ derived }: Props) {
  const previousRevisions = useRef<RevisionSnapshot>(derived.revisions);
  const rebuildCounts = useRef<Record<RevisionKey, number>>({
    slabs: 0,
    walls: 0,
    openings: 0,
    roofs: 0,
    carports: 0,
  });

  const changedSubsystem = useMemo(() => {
    const keys: RevisionKey[] = ['slabs', 'walls', 'openings', 'roofs', 'carports'];
    let changed: RevisionKey | null = null;

    for (const key of keys) {
      if (previousRevisions.current[key] !== derived.revisions[key]) {
        rebuildCounts.current[key] += 1;
        changed = key;
      }
    }

    previousRevisions.current = derived.revisions;
    return changed;
  }, [derived.revisions]);

  const lineStyle = (key: RevisionKey) => ({
    color: changedSubsystem === key ? '#34d399' : 'white',
  });

  return (
    <Html prepend fullscreen style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
        }}
      >
        <div>Derived Graph</div>
        {getDerivedGraphSummary(derived).map((line, index) => {
          const key: RevisionKey[] = ['slabs', 'walls', 'openings', 'roofs', 'carports'];
          return (
            <div key={key[index]} style={lineStyle(key[index])}>
              {line}
            </div>
          );
        })}
        <div>last changed: {changedSubsystem ?? 'none'}</div>
        <div>
          rebuilds: s={rebuildCounts.current.slabs} w={rebuildCounts.current.walls} o={rebuildCounts.current.openings}{' '}
          r={rebuildCounts.current.roofs} c={rebuildCounts.current.carports}
        </div>
      </div>
    </Html>
  );
}
