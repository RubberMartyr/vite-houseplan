import type { SiteSurfaceSpec, Vec2 } from '../architecturalTypes';
import polygonClipping from 'polygon-clipping';

type SiteSurfaceType = 'cobblestone' | 'fence';

type SiteLayoutSurface = {
  id: string;
  type: SiteSurfaceType;
  polygon: Vec2[];
  height?: number;
  thickness?: number;
  fence?: SiteSurfaceSpec['fence'];
  material?: SiteSurfaceSpec['material'];
};

type SiteLayout = {
  surfaces: SiteLayoutSurface[];
};

export const LOT_1A_SITE_LAYOUT: SiteLayout = {
  surfaces: [
    {
      id: 'lot1a-fence-front',
      type: 'fence',
      height: 2.0,
      polygon: [
        { x: -10.2, z: 0.5 },
        { x: -4.7, z: 0.5 },
        { x: -4.7, z: -0.28 },
        { x: -9.4, z: -0.28 },
      ],
      fence: {
        baseWidth: 0.04,
        gap: 0.02,
        thickness: 0.02,
        pattern: [1, 2, 3, 4, 3, 2],
      },
      material: {
        type: 'wood_vertical_slats',
        texture: '/textures/fence/wood.jpg',
        scale: {
          x: 1.0,
          y: 1.0,
        },
        roughness: 0.8,
        metalness: 0.0,
      },
    },
    {
      id: 'lot1a-cobblestone-main',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat: [1, 1],
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
        repeat: [1, 1],
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
        repeat: [1, 1],
      },
      polygon: [
        { x: 2.6, z: -6.0 },
        { x: 8.6, z: -6.0 },
        { x: 8.6, z: 8.2 },
        { x: 2.6, z: 8.2 },
      ],
    },

    {
      id: 'lot1a-left-indent-strip',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat:  [1, 1],
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
        repeat:  [1, 1],
      },
      polygon: [
        // reordered for clean winding (no twisted edge)
        { x: 6.6, z: -0.5 },
        { x: 8.6, z: 0.5 },
        { x: 8.6, z: 16.1 },
        { x: 6.6, z: 16.1 },
      ],
    },

    {
      id: 'lot1a-basement-stair-landing',
      type: 'cobblestone',
      material: {
        type: 'standard',
        texture: '/textures/Marshalls_Rustic.jpg',
        repeat:  [1, 1],
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
    if (surface.type === 'fence') {
      return [{
        id: surface.id,
        type: surface.type,
        polygon: surface.polygon,
        material: surface.material,
        height: surface.height,
        thickness: surface.thickness,
        fence: surface.fence,
      }];
    }

    const clippedPolygons = subtractHouseFromSurface(surface.polygon, houseFootprint);

    return clippedPolygons.map((polygon, index) => ({
      id: `${surface.id}-${index}`,
      type: surface.type,
      color: surface.type === 'cobblestone' ? '#3b82f6' : undefined,
      material: surface.material,
      polygon,
    }));
  });
}
