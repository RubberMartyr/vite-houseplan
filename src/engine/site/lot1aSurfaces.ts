import type { SiteSurfaceSpec, Vec2 } from '../architecturalTypes';
import polygonClipping from 'polygon-clipping';

type SiteSurfaceType = 'cobblestone';

type SiteLayoutSurface = {
  id: string;
  type: SiteSurfaceType;
  polygon: Vec2[];
  material?: SiteSurfaceSpec['material'];
};

type SiteLayout = {
  surfaces: SiteLayoutSurface[];
};

export const LOT_1A_SITE_LAYOUT: SiteLayout = {
  surfaces: [
    {
      id: 'lot1a-cobblestone-main',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat: [6, 6],
        roughness: 0.9,
        metalness: 0,
      },
      polygon: [
        // front strip
        { x: -5.6, z: -1.0 },
        { x: 2.6,  z: -1.0 },
        { x: 2.6,  z: 2.0 },

        // vertical connection toward right area
        { x: 2.6,  z: 5.0 },

        // back-left edge
        { x: -5.6, z: 5.0 },

        // close shape
        { x: -5.6, z: 2.0 },
      ],
    },

    {
      id: 'lot1a-driveway',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat: [6, 6],
        roughness: 0.9,
      },
      polygon: [
        { x: 0.5, z: -6.0 },
        { x: 1.8, z: -6.0 },
        { x: 1.8, z: 0.0 },
        { x: 0.5, z: 0.0 },
      ],
    },

    {
      id: 'lot1a-front-right-driveway',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat: [6, 6],
      },
      polygon: [
        { x: 2.6, z: -6.0 },
        { x: 8.6, z: -6.0 },
        { x: 7.9, z: 8.2 },
        { x: 2.6, z: 8.2 },
      ],
    },

    {
      id: 'lot1a-left-indent-strip',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat: [4, 4],
      },
      polygon: [
        // indentation fill
        { x: -5.0, z: 4.0 },
        { x: -3.5, z: 4.0 },
        { x: -3.5, z: 8.45 },
        { x: -5.0, z: 8.45 },
      ],
    },

    {
      id: 'lot1a-basement-strip',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat: [8, 2],
      },
      polygon: [
        // reordered for clean winding (no twisted edge)
        { x: 6.6, z: -0.5 },
        { x: 8.2, z: 0.5 },
        { x: 7.5, z: 16.1 },
        { x: 6.6, z: 16.1 },
      ],
    },

    {
      id: 'lot1a-basement-stair-landing',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat: [2, 2],
      },
      polygon: [
        { x: 4.8, z: 15.0 },
        { x: 7.5, z: 15.0 },
        { x: 7.5, z: 16.1 },
        { x: 4.8, z: 16.1 },
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
      color: surface.type === 'cobblestone' ? '#3b82f6' : undefined,
      material: surface.material,
      polygon,
    }));
  });
}
