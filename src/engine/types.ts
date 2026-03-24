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

export interface SiteSurfaceSpec {
  id: string;
  type?: 'cobblestone' | 'fence';
  polygon: Vec2[];
  color?: string;
  elevation?: number;
  height?: number;
  thickness?: number;
  fence?: {
    baseWidth: number;
    gap: number;
    thickness: number;
    pattern: number[];
  };
  material?: {
    type: 'standard';
    texture?: string;
    normalMap?: string;
    repeat?: [number, number];
    scale?: { x: number; y: number };
    color?: string;
    roughness?: number;
    metalness?: number;
  } | {
    type: 'wood_vertical_slats';
    texture?: string;
    normalMap?: string;
    scale?: { x: number; y: number };
    color?: string;
    roughness?: number;
    metalness?: number;
  };
}

export interface SiteSpec {
  footprint: Footprint;
  elevation?: number;
  color?: string;
  surfaces?: SiteSurfaceSpec[];
}

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

export type OpeningKind = 'window' | 'door';

export interface OpeningStyleSpec {
  frameThickness?: number;
  frameDepth?: number;
  glassInset?: number;
  glassThickness?: number;
  sillDepth?: number;
  sillThickness?: number;
  mullionWidth?: number;
  mullionCount?: number;
  materialKey?: string;
  glassMaterialKey?: string;
  frameEdges?: Partial<Record<'left' | 'right' | 'top' | 'bottom', boolean>>;

  variant?:
    | 'plain'
    | 'classicTransom'
    | 'firstFloorTransom'
    | 'doorDetailed'
    | 'verticalTransom'
    | 'frontPortalDoor'
    | 'planFrontWindow';
  grid?: { cols: number; rows: number };
  transomRatio?: number;
  rowFractions?: number[];
  hasSill?: boolean;
  hasLintel?: boolean;
  surroundRing?: boolean;
  mergeWithBelow?: boolean;
  separatorPanelHeight?: number;
}

export interface OpeningEdgeRef {
  levelId: string;
  ring: 'outer';
  edgeIndex: number;
  fromEnd?: boolean;
}

export interface OpeningSpec {
  id: string;
  kind: OpeningKind;
  levelId: string;
  edge: OpeningEdgeRef;
  offset: number;
  width: number;
  sillHeight: number;
  height: number;
  style?: OpeningStyleSpec;
}

export interface ExteriorAccessSpec {
  id: string;
  levelId: string;
  edge: OpeningEdgeRef;
  offset: number;
  wellWidth: number;
  landingLength: number;
  stairRun: number;
  stairRise: number;
  stepCount: number;
  floorThickness?: number;
  wallThickness?: number;
  wallHeight?: number;
  guardWallHeight?: number;
}

export type ArchitecturalMaterials = {
  walls?: {
    texture?: string;
    scale?: number;
    color?: string;
    exteriorColor?: string;
    interiorColor?: string;
    edgeColor?: string;
  };
  roof?: {
    texture?: string;
    color?: string;
  };
  windows?: {
    frameColor?: string;
    glassColor?: string;
    glassOpacity?: number;
  };
};

export interface ArchitecturalHouse {
  wallThickness: number;
  levels: LevelSpec[];
  roofs?: RoofSpec[];
  openings?: OpeningSpec[];
  exteriorAccesses?: ExteriorAccessSpec[];
  site?: SiteSpec;
  materials?: ArchitecturalMaterials;
}

export type WallSpec = {
  id: string;
  baseLine: Vec3[];
  height: number;
  thickness: number;
};

export type WallOpeningSpec = {
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
  openings: WallOpeningSpec[];
  roof?: RoofFrameSpec;
};
