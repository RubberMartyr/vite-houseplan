import { Html } from '@react-three/drei';
import type { DerivedHouse } from '../derive/types/DerivedHouse';
import { isDebugEnabled } from './debugFlags';

type Props = {
  derived: DerivedHouse;
};

export function EngineDebugHUD({ derived }: Props) {
  if (!isDebugEnabled()) return null;

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
      </div>
    </Html>
  );
}
