export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

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

export type RoofSpec = {
  ridgeHeight: number;
  slope: number;
};

export type HouseSpec = {
  walls: WallSpec[];
  openings: OpeningSpec[];
  roof?: RoofSpec;
};
