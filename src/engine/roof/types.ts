import type { MultiPlaneRoofSpec, XZ } from "../types";
import type { DerivedRoof } from "../derive/types/DerivedRoof";

export type RoofType =
  | 'flat'
  | 'gable'
  | 'multi-ridge'
  | 'multi-plane';

export type RoofFaceKind =
  | 'hipCap'
  | 'ridgeSideSegment';

export type RoofPoint = {
  x: number;
  z: number;
};

export type RoofSeamBase = {
  ridgeId: string;
  side: "left" | "right";
  end: "start" | "end";
  point: RoofPoint;
};

export type RoofCornerTriangle = {
  ridgeId: string;
  side: "left" | "right";
  end: "start" | "end";
  corner: RoofPoint;
  seamBase: RoofPoint;
  ridgeEnd: RoofPoint;
};

export type RoofTriangle = [RoofPoint, RoofPoint, RoofPoint];

export type RoofRegion = {
  id: string;
  side?: "left" | "right";
  points: RoofPoint[];
  ridgeId?: string;
  end?: "start" | "end";
};

export type RoofPlane = {
  normal: { x: number; y: number; z: number };
  heightAt(x: number, z: number): number;
};

export type DerivedRoofPlan = {
  derivedRoof: DerivedRoof;
  roof: MultiPlaneRoofSpec;
  footprint: XZ[];
  ridgeSegments: MultiPlaneRoofSpec["ridgeSegments"];
  faces: MultiPlaneRoofSpec["faces"];
  thickness: number;
  eaveTopAbs: number;
};
