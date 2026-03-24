import type { SiteSurfaceSpec, Vec2 } from '../architecturalTypes';

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
      id: 'lot1a-right-cobblestone-field',
      type: 'cobblestone',
      polygon: [
        { x: 5.3, z: -2.8 },
        { x: 6, z: -2.8 },
        { x: 5.5, z: 5 },
        { x: 5.3, z: 5 },
      ],
    },
    {
      id: 'lot1a-front-perimeter-path',
      type: 'cobblestone',
      polygon: [
        { x: -4.8, z: -1 },
        { x: 4.8, z: -1 },
        { x: 4.8, z: 0 },
        { x: -4.8, z: 0 },
      ],
    },
    {
      id: 'lot1a-left-lower-path',
      type: 'cobblestone',
      polygon: [
        { x: -5.8, z: 0 },
        { x: -4.8, z: 0 },
        { x: -4.8, z: 4 },
        { x: -5.8, z: 4 },
      ],
    },
    {
      id: 'lot1a-left-mid-path',
      type: 'cobblestone',
      polygon: [
        { x: -5.1, z: 4 },
        { x: -4.1, z: 4 },
        { x: -4.1, z: 8.45 },
        { x: -5.1, z: 8.45 },
      ],
    },
    {
      id: 'lot1a-front-door-path',
      type: 'cobblestone',
      polygon: [
        { x: -0.2, z: -2.8 },
        { x: 0.8, z: -2.8 },
        { x: 0.8, z: 0 },
        { x: -0.2, z: 0 },
      ],
    },
  ],
};

export function mapSiteLayoutToSurfaces(layout: SiteLayout): SiteSurfaceSpec[] {
  return layout.surfaces.map((surface) => ({
    id: surface.id,
    color: SURFACE_TYPE_COLOR[surface.type],
    polygon: surface.polygon,
  }));
}
