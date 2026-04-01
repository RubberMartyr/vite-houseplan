import type { XZ } from "../types";
import type { DerivedRoofPlan, RoofSeamBase } from "./types";
import { deriveHipCapRegions } from "./deriveHipCapRegions";

function signedSide(p: XZ, a: XZ, b: XZ): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = p.x - a.x;
  const apz = p.z - a.z;
  return apx * abz - apz * abx;
}

export function deriveSeamBases(plan: DerivedRoofPlan): RoofSeamBase[] {
  const out: RoofSeamBase[] = [];
  const regions = deriveHipCapRegions(plan);

  for (const region of regions) {
    const ridge = plan.ridgeSegments.find((segment) => segment.id === region.ridgeId);
    if (!ridge || !region.end || region.points.length < 3) continue;

    const b1 = region.points[1];
    const b2 = region.points[2];

    const b1Side = signedSide(b1, ridge.start, ridge.end) >= 0 ? "left" : "right";
    const b2Side = b1Side === "left" ? "right" : "left";

    out.push({ ridgeId: ridge.id, end: region.end, side: b1Side, point: b1 });
    out.push({ ridgeId: ridge.id, end: region.end, side: b2Side, point: b2 });

  }

  return out;
}
