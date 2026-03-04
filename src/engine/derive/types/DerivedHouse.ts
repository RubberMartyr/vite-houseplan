import type { DerivedWallSegment } from '../../deriveWalls';
import type { DerivedOpeningRect as DerivedOpening } from '../../derived/derivedOpenings';
import type { DerivedSlab } from '../deriveSlabs';
import type { DerivedRoof } from './DerivedRoof';

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
  revisions: DerivedRevisions;
}
