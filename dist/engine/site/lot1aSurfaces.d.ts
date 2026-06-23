import type { SiteSurfaceKind, SiteSurfaceSpec, Vec2 } from '../architecturalTypes';
type SiteLayoutSurface = {
    id: string;
    kind: SiteSurfaceKind;
    polygon: Vec2[];
    height?: number;
    thickness?: number;
    fence?: SiteSurfaceSpec['fence'];
    material?: SiteSurfaceSpec['material'];
};
type SiteLayout = {
    surfaces: SiteLayoutSurface[];
};
export declare const LOT_1A_SITE_LAYOUT: SiteLayout;
export declare function mapSiteLayoutToSurfaces(layout: SiteLayout, houseFootprint: Vec2[]): SiteSurfaceSpec[];
export {};
