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

export function mapSiteLayoutToSurfaces(layout: SiteLayout): SiteSurfaceSpec[] {
  return layout.surfaces.map((surface) => ({
    id: surface.id,
    color: SURFACE_TYPE_COLOR[surface.type],
    polygon: surface.polygon,
  }));
}
