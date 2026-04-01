export type EngineSubsystem = 'slabs' | 'walls' | 'roofs';

export type EngineDebugStats = {
  derived: {
    slabs: number;
    walls: number;
    roofs: number;
    carports: number;
    openings: number;
    rooms?: number;
  };
  revisions: {
    slabs: number;
    walls: number;
    roofs: number;
    openings: number;
  };
  rebuilds: {
    slabs: number;
    walls: number;
    roofs: number;
  };
  cache: {
    slabHits: number;
    slabMisses: number;
    wallHits: number;
    wallMisses: number;
    roofHits: number;
    roofMisses: number;
  };
  timingsMs: {
    slabBuild: number;
    wallBuild: number;
    roofBuild: number;
  };
  geometry: {
    slabTriangles: number;
    wallTriangles: number;
    roofTriangles: number;
    totalTriangles: number;
    estimatedMemoryMB?: number;
  };
  roof?: {
    seamBases: number;
    roofRegions: number;
    hipCaps: number;
    ridgeSegments: number;
  };
  walls?: {
    shellSegments: number;
    facadePanels: number;
    openingsCut: number;
  };
  runtime: {
    lastChangedSubsystem: 'slabs' | 'walls' | 'roofs' | 'openings' | 'unknown';
    fps?: number;
    frameMs?: number;
  };
};
