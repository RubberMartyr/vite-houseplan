export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Vec2 = {
  x: number;
  z: number;
};

export type Footprint = {
  outer: Vec2[];
  holes?: Vec2[][];
};

export interface SlabSpec {
  thickness: number;
  inset: number;
}

export interface LevelSpec {
  id: string;
  elevation: number;
  height: number;
  footprint: Footprint;
  slab: SlabSpec;
}

export type RidgeSegmentSpec = {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  height: number; // OUTER height above level.elevation
  hipStart?: boolean;
  hipEnd?: boolean;
};

export type XZ = { x: number; z: number };

export type PlanePoint = {
  x: number;
  z: number;
  h: number;
};

export type HalfPlane = {
  a: XZ;
  b: XZ;
  keep: 'left' | 'right';
};

export type RidgePerpCut = {
  type: 'ridgePerpCut';
  ridgeId: string;
  t: number;
  keep: 'ahead' | 'behind';
};

export type RidgeDividerRegionItem = {
  type: 'ridgeDivider';
  ridgeId: string;
  keep: 'left' | 'right';
};

export type MultiPlaneRegionItem =
  | RidgeDividerRegionItem
  | {
      a: { x: number; z: number };
      b: { x: number; z: number };
      keep: 'left' | 'right';
    }
  | RidgePerpCut;

export type FaceRegion =
  | { type: 'halfPlanes'; planes: HalfPlane[] }
  | { type: 'ridgeCapTriangle'; ridgeId: string; end: 'start' | 'end' }
  | { type: 'compound'; items: MultiPlaneRegionItem[] };

export type RoofFaceSpec = {
  id: string;
  kind: 'ridgeSideSegment' | 'hipCap';
  ridgeId?: string;
  ridgeT0?: number;
  ridgeT1?: number;
  side?: 'left' | 'right';
  capEnd?: 'start' | 'end';
  p1?: PlanePoint;
  p2?: PlanePoint;
  p3?: PlanePoint;
  region: FaceRegion;
};

export type MultiPlaneRoofSpec = {
  id: string;
  type: 'multi-plane';
  baseLevelId: string;
  eaveHeight: number;
  thickness?: number;
  overhang?: number;
  ridgeSegments: RidgeSegmentSpec[];
  faces: RoofFaceSpec[];
};

export type RoofSpec =
  | {
      id: string;
      type: 'flat';
      baseLevelId: string;
      subtractAboveLevelId?: string;
      thickness: number;
    }
  | {
      id: string;
      type: 'gable';
      baseLevelId: string;
      eaveHeight: number;
      ridgeHeight: number;
      ridge: {
        start: Vec2;
        end: Vec2;
      };
      overhang?: number;
      thickness: number;
    }
  | {
      id: string;
      type: 'multi-ridge';
      baseLevelId: string;
      eaveHeight: number;
      thickness?: number;
      overhang?: number;
      ridgeSegments: RidgeSegmentSpec[];
    }
  | MultiPlaneRoofSpec;

export type OpeningSpecArch = {
  id: string;
  type: 'window' | 'door';
  levelId: string;
  host: {
    kind: 'outerWall';
    edgeIndex: number;
  };
  placement: {
    offset: number;
  };
  size: {
    width: number;
    height: number;
  };
  sillHeight: number;
};

export interface ArchitecturalHouse {
  wallThickness: number;
  levels: LevelSpec[];
  roofs?: RoofSpec[];
  openings?: OpeningSpecArch[];
}

export type WallSpec = {
  id: string;
  baseLine: Vec3[];
  height: number;
  thickness: number;
};

export type OpeningSpec = {
  wallId: string;
  center: Vec3;
  width: number;
  height: number;
};

export type RoofFrameSpec = {
  ridgeHeight: number;
  slope: number;
};

export type HouseSpec = {
  walls: WallSpec[];
  openings: OpeningSpec[];
  roof?: RoofFrameSpec;
};
