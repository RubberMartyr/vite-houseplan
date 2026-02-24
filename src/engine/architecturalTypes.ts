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
  slabThickness: number;
  footprint: {
    outer: Vec2[];
    holes?: Vec2[][];
  };
};

export type RoofSpec =
  | {
      id: string;
      type: "flat";
      baseLevelId: string;
      subtractAboveLevelId?: string;
      thickness: number;
    }
  | {
      id: string;
      type: "gable";
      baseLevelId: string;
      slopeDeg: number;
      ridgeDirection: "x" | "z";
      overhang?: number;
      thickness: number;
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
  wallThickness: number;
  levels: LevelSpec[];
  roofs: RoofSpec[];
  openings: OpeningSpecArch[];
};
