import * as THREE from 'three';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
export type EngineMesh = {
    id: string;
    geometry: THREE.BufferGeometry;
    position: [number, number, number];
    rotation: [number, number, number];
    materialKey: 'wall' | 'windowFrame' | 'windowGlass' | 'windowSill' | 'windowLintel';
};
export type WindowBuilderConstants = {
    panelDepth: number;
    eps?: number;
    frameDepth?: number;
    frameBorder?: number;
    glassThickness?: number;
    sillDepth?: number;
    sillHeight?: number;
    lintelDepth?: number;
    lintelHeight?: number;
};
export declare function buildWindowMeshes(openings: DerivedOpeningRect[], constants: WindowBuilderConstants): EngineMesh[];
