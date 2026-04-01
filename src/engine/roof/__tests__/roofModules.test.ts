import { deriveCornerTriangles, pickCornerFromEdgeContainingBase } from "../deriveCornerTriangles";
import { triangulateRoofRegion } from "../triangulateRoofRegion";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runRoofModuleSmokeTests() {
  const footprint = [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 8 },
    { x: 6, z: 8 },
    { x: 6, z: 12 },
    { x: 0, z: 12 },
    { x: 0, z: 0 },
  ];

  const corner = pickCornerFromEdgeContainingBase(footprint, { x: 10, z: 6 });
  assert(Boolean(corner), "corner should be selected from containing edge");

  const corners = deriveCornerTriangles(
    footprint,
    [{ ridgeId: "r1", side: "right", end: "start", point: { x: 10, z: 6 } }],
    [{ id: "r1", start: { x: 4, z: 2 }, end: { x: 4, z: 10 } }],
  );
  assert(corners.length === 1, "corner triangle should be derived");

  const tris = triangulateRoofRegion({
    id: "r",
    points: [
      { x: 0, z: 0 },
      { x: 8, z: 0 },
      { x: 8, z: 6 },
      { x: 0, z: 6 },
      { x: 0, z: 0 },
    ],
  });
  assert(tris.length === 2, "rectangle triangulation should produce two triangles");
}
