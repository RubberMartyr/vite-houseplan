import type { DerivedHouse } from '../../derive/types/DerivedHouse';
import { getDerivedGraphSummary } from '../DerivedGraphOverlay';

const derived = {
  slabs: [1, 2],
  walls: [1, 2, 3],
  openings: [1],
  roofs: [1, 2, 3, 4],
  carports: [],
  rooms: [],
  exteriorAccesses: [],
  exteriorAccessCutouts: [],
  revisions: { slabs: 2, walls: 5, openings: 3, roofs: 4, carports: 1 },
} as unknown as DerivedHouse;

const lines = getDerivedGraphSummary(derived);
if (!lines.includes('walls: 3 (rev 5)')) {
  throw new Error('derived graph should show correct counts and revisions');
}
