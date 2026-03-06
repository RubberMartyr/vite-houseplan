import type { OpeningStyleSpec } from '../../architecturalTypes';

export interface DerivedOpening {
  id: string;
  kind: 'window' | 'door';
  wallId: string;

  levelIndex: number;
  edgeIndex: number;

  uMin: number;
  uMax: number;

  vMin: number;
  vMax: number;

  width: number;
  height: number;

  centerArch: { x: number; y: number; z: number };
  tangentXZ: { x: number; z: number };
  outwardXZ: { x: number; z: number };

  style: Required<
    Pick<
      OpeningStyleSpec,
      'frameThickness' | 'frameDepth' | 'glassInset' | 'glassThickness'
    >
  > &
    OpeningStyleSpec;
}
