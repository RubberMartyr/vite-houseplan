import type { OpeningStyleSpec } from '../architecturalTypes';
export type OpeningRenderPart = {
    key: string;
    size: [number, number, number];
    position: [number, number, number];
    material: 'frame' | 'glass' | 'wood' | 'stone';
    rotation?: [number, number, number];
    debugType?: 'opening';
    debugIgnore?: boolean;
};
export type OpeningRenderConfig = {
    frameThickness: number;
    frameDepth: number;
    glassInset: number;
    glassThickness: number;
    originOffsetZ?: number;
    parts: OpeningRenderPart[];
};
type ResolveOpeningRenderOptions = {
    kind?: 'window' | 'door';
};
export declare function resolveOpeningRenderParts(openingWidth: number, openingHeight: number, style: OpeningStyleSpec | undefined, wallThickness: number, options?: ResolveOpeningRenderOptions): OpeningRenderConfig;
export {};
