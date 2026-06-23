import type { SiteSpec, Vec2 } from '../architecturalTypes';
type EngineSiteProps = {
    site?: SiteSpec;
    cutouts?: Vec2[][];
    visible?: boolean;
};
export declare function EngineSite({ site, cutouts, visible }: EngineSiteProps): import("react/jsx-runtime").JSX.Element | null;
export {};
