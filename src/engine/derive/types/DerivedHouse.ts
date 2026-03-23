import type { DerivedWallSegment } from '../../deriveWalls';
import type { DerivedOpening } from './DerivedOpening';
import type { DerivedSlab } from '../deriveSlabs';
import type { DerivedRoof } from './DerivedRoof';
import type { DerivedExteriorAccessPart } from './DerivedExteriorAccess';

export interface DerivedRevisions {
  slabs: number;
  walls: number;
  roofs: number;
  openings: number;
}

export interface DerivedHouse {
  slabs: DerivedSlab[];
  walls: DerivedWallSegment[];
  roofs: DerivedRoof[];
  openings: DerivedOpening[];
  exteriorAccesses: DerivedExteriorAccessPart[];
  revisions: DerivedRevisions;
}
