import type { Footprint, Vec2 } from '../architecturalTypes';

const LOT_1A_REFERENCE_ORIGIN: Vec2 = {
  x: -11,
  z: -2,
};

const LOT_1A_LOCAL_OUTER: Vec2[] = [
  { x: 0.0, z: 0.0 },
  { x: 19.61, z: 0.0 },
  { x: 20.1, z: 50.76 },
  { x: 15.4, z: 51.9 },
  { x: 10.9, z: 51.2 },
  { x: 6.1, z: 50.4 },
  { x: 3.6, z: 49.8 },
];

function translateRing(points: Vec2[], offset: Vec2): Vec2[] {
  return points.map((point) => ({
    x: point.x + offset.x,
    z: point.z + offset.z,
  }));
}

const LOT_1A_FRONT_WIDTH = LOT_1A_LOCAL_OUTER[1].x - LOT_1A_LOCAL_OUTER[0].x;
const LOT_1A_REAR_WIDTH = LOT_1A_LOCAL_OUTER[3].x - LOT_1A_LOCAL_OUTER[6].x;

if (import.meta.env.DEV && LOT_1A_FRONT_WIDTH <= LOT_1A_REAR_WIDTH) {
  throw new Error('Lot 1a footprint must remain wider at the front than at the rear.');
}

/**
 * Lot 1a parcel visual/cadastral best-fit used for the current plan overlay.
 *
 * The front edge is intentionally wider and the rear edge chain narrower so the
 * left side carries the taper around the current house placement; house siting
 * refinement will happen separately from this parcel-shape pass.
 */
export const LOT_1A_FOOTPRINT: Footprint = {
  outer: translateRing(LOT_1A_LOCAL_OUTER, LOT_1A_REFERENCE_ORIGIN),
};
