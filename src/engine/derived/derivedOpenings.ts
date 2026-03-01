import type { OpeningStyleSpec } from '../architecturalTypes';

export interface DerivedOpeningRect {
  id: string;
  kind: 'window' | 'door';

  levelIndex: number;
  edgeIndex: number;

  uMin: number;
  uMax: number;

  vMin: number;
  vMax: number;

  centerArch: { x: number; y: number; z: number };
  tangentXZ: { x: number; z: number };
  outwardXZ: { x: number; z: number };

  style?: OpeningStyleSpec;
}
