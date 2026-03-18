import type { BufferGeometry } from 'three';
import type { Vec2 } from './architecturalTypes';
import type { DerivedWallSegment } from './deriveWalls';
import { getWallVisibleBaseY, getWallVisibleTopY } from './deriveWalls';
import { buildWallPrismGeometry } from './geometry/buildWallPrismGeometry';

export function extrudeWallSegment(
  seg: DerivedWallSegment,
  brickScale = 0.6,
  footprintOuter?: Vec2[]
): BufferGeometry {
  return buildWallPrismGeometry(
    seg,
    {
      uMin: 0,
      uMax: Math.hypot(seg.end.x - seg.start.x, seg.end.z - seg.start.z),
      vMin: getWallVisibleBaseY(seg),
      vMax: getWallVisibleTopY(seg),
    },
    brickScale,
    footprintOuter
  );
}
