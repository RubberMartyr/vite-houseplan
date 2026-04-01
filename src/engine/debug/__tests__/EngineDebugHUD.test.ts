import { buildEngineDebugHudLines } from '../EngineDebugHUD';
import type { EngineDebugStats } from '../types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function createStats(overrides?: Partial<EngineDebugStats>): EngineDebugStats {
  return {
    derived: {
      slabs: 4,
      walls: 46,
      roofs: 2,
      carports: 1,
      openings: 21,
      rooms: 8,
    },
    revisions: {
      slabs: 1,
      walls: 3,
      roofs: 2,
      openings: 4,
    },
    rebuilds: {
      slabs: 1,
      walls: 3,
      roofs: 2,
    },
    cache: {
      slabHits: 5,
      slabMisses: 1,
      wallHits: 14,
      wallMisses: 3,
      roofHits: 8,
      roofMisses: 2,
    },
    timingsMs: {
      slabBuild: 2.1,
      wallBuild: 12.4,
      roofBuild: 7.8,
    },
    geometry: {
      slabTriangles: 488,
      wallTriangles: 8234,
      roofTriangles: 1942,
      totalTriangles: 10664,
      estimatedMemoryMB: 8.2,
    },
    runtime: {
      lastChangedSubsystem: 'walls',
      fps: 58,
      frameMs: 16.7,
    },
    ...overrides,
  };
}

const completeLines = buildEngineDebugHudLines(
  createStats({
    roof: {
      seamBases: 8,
      roofRegions: 12,
      hipCaps: 4,
      ridgeSegments: 3,
    },
    walls: {
      shellSegments: 46,
      facadePanels: 24,
      openingsCut: 21,
    },
  })
);
const complete = completeLines.join('\n');

assert(complete.includes('DerivedHouse\nslabs: 4\nwalls: 46\nroofs: 2'), 'renders derived counts');
assert(complete.includes('Revisions\nslabsRev: 1\nwallsRev: 3\nroofsRev: 2\nopeningsRev: 4'), 'renders revisions');
assert(complete.includes('Cache\nwalls: 14 hits / 3 misses\nroofs: 8 hits / 2 misses\nslabs: 5 hits / 1 misses'), 'renders cache');
assert(complete.includes('Build Times\nwalls: 12.4ms\nroofs: 7.8ms\nslabs: 2.1ms'), 'renders timings');
assert(complete.includes('Triangles\nwalls: 8234\nroofs: 1942\nslabs: 488\ntotal: 10664'), 'renders triangle totals');
assert(complete.includes('Roof Diagnostics\nseamBases: 8\nroofRegions: 12\nhipCaps: 4\nridgeSegments: 3'), 'renders roof diagnostics');
assert(complete.includes('Wall Diagnostics\nshellSegments: 46\nfacadePanels: 24\nopeningsCut: 21'), 'renders wall diagnostics');

const optionalMissing = buildEngineDebugHudLines(
  createStats({
    roof: undefined,
    walls: undefined,
    runtime: { lastChangedSubsystem: 'unknown' },
  })
).join('\n');

assert(!optionalMissing.includes('Roof Diagnostics'), 'hides roof diagnostics when missing');
assert(!optionalMissing.includes('Wall Diagnostics'), 'hides wall diagnostics when missing');
assert(optionalMissing.includes('Runtime\nlastChanged: unknown'), 'remains stable with optional stats missing');
