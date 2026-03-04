import { Html } from '@react-three/drei';
import { useRef } from 'react';
import type { DerivedHouse } from '../derive/types/DerivedHouse';
import { isDebugEnabled } from './debugFlags';

type Props = {
  derived: DerivedHouse;
};

export function DerivedGraphOverlay({ derived }: Props) {
  const prev = useRef(derived.revisions);

  if (!isDebugEnabled()) return null;

  const changed = {
    slabs: prev.current.slabs !== derived.revisions.slabs,
    walls: prev.current.walls !== derived.revisions.walls,
    openings: prev.current.openings !== derived.revisions.openings,
    roofs: prev.current.roofs !== derived.revisions.roofs,
  };

  prev.current = derived.revisions;

  const style = (active: boolean) => ({
    color: active ? '#ffcc00' : 'white',
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

        <div style={style(changed.slabs)}>slabs (rev {derived.revisions.slabs})</div>

        <div>│</div>
        <div>▼</div>

        <div style={style(changed.walls)}>walls (rev {derived.revisions.walls})</div>

        <div>├──► openings (rev {derived.revisions.openings})</div>
        <div>└──► roofs (rev {derived.revisions.roofs})</div>
      </div>
    </Html>
  );
}
