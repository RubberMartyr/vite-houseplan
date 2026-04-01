import type { MultiPlaneRoofSpec, XZ } from "../types";
import type { DerivedRoof } from "../derive/types/DerivedRoof";
import type { DerivedRoofPlan } from "./types";

function dedupeConsecutivePoints(points: XZ[]): XZ[] {
  const deduped: XZ[] = [];
  for (const point of points) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.abs(prev.x - point.x) > 1e-9 || Math.abs(prev.z - point.z) > 1e-9) {
      deduped.push(point);
    }
  }
  return deduped;
}

function ensureClosed(points: XZ[]): XZ[] {
  const deduped = dedupeConsecutivePoints(points);
  if (deduped.length < 3) return deduped;
  const first = deduped[0];
  const last = deduped[deduped.length - 1];
  if (first.x === last.x && first.z === last.z) return deduped;
  return [...deduped, first];
}

function validateRidgeSegments(roof: MultiPlaneRoofSpec): void {
  for (const ridge of roof.ridgeSegments) {
    const dx = ridge.end.x - ridge.start.x;
    const dz = ridge.end.z - ridge.start.z;
    const len = Math.hypot(dx, dz);
    if (!Number.isFinite(len) || len < 1e-6) {
      throw new Error(`Invalid ridge segment: ${ridge.id}`);
    }
  }
}

export function deriveRoofPlan(derivedRoof: DerivedRoof, roof: MultiPlaneRoofSpec): DerivedRoofPlan {
  validateRidgeSegments(roof);

  return {
    derivedRoof,
    roof,
    footprint: ensureClosed(derivedRoof.roofPolygonOuter),
    ridgeSegments: roof.ridgeSegments,
    faces: roof.faces,
    thickness: roof.thickness ?? 0.2,
    eaveTopAbs: derivedRoof.baseLevel.elevation + derivedRoof.baseLevel.height + derivedRoof.baseLevel.slabThickness,
  };
}
