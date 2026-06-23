import * as THREE from 'three';
type ColorMaterialSpec = {
    type: 'color';
    value: string;
};
type TextureMaterialSpec = {
    type: 'texture';
    src: string;
    scale?: number;
};
type GlassMaterialSpec = {
    type: 'glass';
};
export type MaterialSpec = ColorMaterialSpec | TextureMaterialSpec | GlassMaterialSpec;
type ResolveMaterialOptions = {
    side?: THREE.Side;
};
export declare function resolveMaterial(spec?: MaterialSpec, options?: ResolveMaterialOptions): THREE.Material;
export {};
