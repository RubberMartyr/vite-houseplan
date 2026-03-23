import type { Vec2, Vec3 } from '../../architecturalTypes';

export type DerivedExteriorAccessPartKind = 'floor' | 'retaining-wall' | 'guard-wall' | 'stair-step';

export interface DerivedExteriorAccessCutout {
  id: string;
  accessId: string;
  polygon: Vec2[];
}

export interface DerivedExteriorAccessPart {
  id: string;
  accessId: string;
  kind: DerivedExteriorAccessPartKind;
  centerArch: Vec3;
  size: {
    x: number;
    y: number;
    z: number;
  };
  tangentXZ: Vec2;
  outwardXZ: Vec2;
}
