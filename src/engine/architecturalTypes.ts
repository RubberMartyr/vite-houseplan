export type Vec2 = {
  x: number;
  z: number;
};

export type Footprint = {
  outer: Vec2[];
  holes?: Vec2[][];
};

export type LevelSpec = {
  id: string;
  elevation: number;
  height: number;
};

export type RoofSpecArch = {
  type: "gable";
  slopeDeg: number;
  ridgeDirection: "x" | "z";
  overhang?: number;
};

export type OpeningSpecArch = {
  id: string;
  type: "window" | "door";
  levelId: string;
  host: {
    kind: "outerWall";
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

export type ArchitecturalHouse = {
  footprint: Footprint;
  levels: LevelSpec[];
  wallThickness: number;
  roof: RoofSpecArch;
  openings: OpeningSpecArch[];
};
