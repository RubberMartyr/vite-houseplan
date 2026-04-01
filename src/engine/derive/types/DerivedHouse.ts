import type { DerivedWallSegment } from '../../deriveWalls';
import type { DerivedOpening } from './DerivedOpening';
import type { DerivedSlab } from '../deriveSlabs';
import type { DerivedRoof } from './DerivedRoof';
import type { DerivedExteriorAccessCutout, DerivedExteriorAccessPart } from './DerivedExteriorAccess';
import type { DerivedCarport } from './DerivedCarport';
import type { DerivedRoom } from './DerivedRoom';

export type RevisionKey =
  | 'slabs'
  | 'walls'
  | 'roofs'
  | 'openings'
  | 'carports';

export type DerivedRevisions = Record<RevisionKey, number>;

export interface DerivedHouse {
  slabs: DerivedSlab[];
  walls: DerivedWallSegment[];
  roofs: DerivedRoof[];
  openings: DerivedOpening[];
  rooms: DerivedRoom[];
  carports: DerivedCarport[];
  exteriorAccesses: DerivedExteriorAccessPart[];
  exteriorAccessCutouts: DerivedExteriorAccessCutout[];
  revisions: DerivedRevisions;
}
