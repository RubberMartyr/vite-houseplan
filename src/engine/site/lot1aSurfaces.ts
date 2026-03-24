import type { SiteSurfaceSpec, Vec2 } from '../architecturalTypes';
import polygonClipping from 'polygon-clipping';

type SiteSurfaceType = 'cobblestone';

type SiteLayoutSurface = {
  id: string;
  type: SiteSurfaceType;
  polygon: Vec2[];
};

type SiteLayout = {
  surfaces: SiteLayoutSurface[];
};

const SURFACE_TYPE_COLOR: Record<SiteSurfaceType, string> = {
  cobblestone: '#3b82f6',
};

export const LOT_1A_SITE_LAYOUT: SiteLayout = {
  surfaces: [
    {
      id: 'lot1a-cobblestone-main',
      type: 'cobblestone',
      polygon: [
        { x: -5.8, z: 0.0 },
        { x: 5.8, z: 0.0 },
        { x: 5.8, z: 2.0 },
        { x: -5.8, z: 2.0 },
        { x: 5.8, z: 2.0 },
        { x: 7.2, z: 2.0 },
        { x: 6.6, z: 26.0 },
        { x: 4.8, z: 26.0 },
        { x: -2.0, z: 26.0 },
        { x: -4.8, z: 26.0 },
        { x: -5.8, z: 10.0 },
        { x: -5.8, z: 2.0 },
      ],
    },
    {
      id: 'lot1a-driveway',
      type: 'cobblestone',
      polygon: [
        { x: -1.0, z: 0.0 },
        { x: 1.0, z: 0.0 },
        { x: 1.0, z: -6.0 },
        { x: -1.0, z: -6.0 },
      ],
    },
  ],
};

function toPolygonClippingFormat(polygon: Vec2[]): polygonClipping.Polygon {
  return [polygon.map((point) => [point.x, point.z])];
}

function fromPolygonClippingFormat(result: polygonClipping.MultiPolygon): Vec2[][] {
  return result.flatMap((polygon) =>
    polygon.map((ring) => ring.map(([x, z]) => ({ x, z }))),
  );
}

function subtractHouseFromSurface(surfacePolygon: Vec2[], housePolygon: Vec2[]): Vec2[][] {
  const subject = toPolygonClippingFormat(surfacePolygon);
  const clip = toPolygonClippingFormat(housePolygon);
  const result = polygonClipping.difference(subject, clip);

  if (!result || result.length === 0) {
    return [];
  }

  return fromPolygonClippingFormat(result);
}

export function mapSiteLayoutToSurfaces(layout: SiteLayout, houseFootprint: Vec2[]): SiteSurfaceSpec[] {
  return layout.surfaces.flatMap((surface) => {
    const clippedPolygons = subtractHouseFromSurface(surface.polygon, houseFootprint);

    return clippedPolygons.map((polygon, index) => ({
      id: `${surface.id}-${index}`,
      color: SURFACE_TYPE_COLOR[surface.type],
      polygon,
    }));
  });
}
