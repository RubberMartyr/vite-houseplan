import type { Footprint, Vec2 } from '../architecturalTypes';

const LOT_1A_REFERENCE_ORIGIN: Vec2 = {
  x: -11,
  z: -6,
};

const LOT_1A_LOCAL_OUTER: Vec2[] = [
  { x: 0.0,   z: 0.0 },    // front-left
  { x: 19.61, z: 0.0 },    // front-right

  { x: 17.10, z: 50.0 },   // back-right  (flatter side)
  { x: 6.25,  z: 50.0 },   // back-left   (more tapered side)
];

function translateRing(points: Vec2[], offset: Vec2): Vec2[] {
  return points.map((point) => ({
    x: point.x + offset.x,
    z: point.z + offset.z,
  }));
}

/**
 * Lot 1a parcel reconstructed from the supplied cadastral plan.
 *
 * The local ring keeps the engineering-fit survey values in one editable place,
 * while the reference origin aligns the parcel with this repository's existing
 * architectural house frame without introducing world-space coordinate hacks.
 */
export const LOT_1A_FOOTPRINT: Footprint = {
  outer: translateRing(LOT_1A_LOCAL_OUTER, LOT_1A_REFERENCE_ORIGIN),
};
