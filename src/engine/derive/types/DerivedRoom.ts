import type { Vec2 } from '../../architecturalTypes';

export interface DerivedRoom {
  id: string;
  name: string;
  levelId: string;
  elevation: number;
  polygon: Vec2[];
}
