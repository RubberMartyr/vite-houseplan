import * as THREE from 'three';
import { type ArchSide } from '../../model/houseSpec';
export type WindowFactorySpec = {
    id: string;
    kind: 'normal' | 'tall';
    width: number;
    groundY0: number;
    groundY1: number;
    firstY0: number;
    firstY1: number;
};
type SideArchSide = Extract<ArchSide, 'LEFT' | 'RIGHT'>;
export type SideWindowSpec = WindowFactorySpec & {
    archSide: SideArchSide;
    zCenter: number;
};
export declare const TALL_Z_OFFSET_TO_FRONT = 0.7;
export declare const RIGHT_FACADE_SEGMENTS: readonly [{
    readonly id: "R_A";
    readonly z0: 0;
    readonly z1: 4;
    readonly x: 4.8;
}, {
    readonly id: "R_B";
    readonly z0: 4;
    readonly z1: 8.45;
    readonly x: 4.1;
}, {
    readonly id: "R_C";
    readonly z0: 8.45;
    readonly z1: 12;
    readonly x: 3.5;
}];
export declare const LEFT_FACADE_SEGMENTS: readonly [{
    readonly id: "L_A";
    readonly z0: 0;
    readonly z1: 4;
    readonly x: -4.8;
}, {
    readonly id: "L_B";
    readonly z0: 4;
    readonly z1: 8.45;
    readonly x: -4.1;
}, {
    readonly id: "L_C";
    readonly z0: 8.45;
    readonly z1: 12;
    readonly x: -3.5;
}];
/** @deprecated Use RIGHT_FACADE_SEGMENTS. */
export declare const RIGHT_WORLD_FACADE_SEGMENTS: readonly [{
    readonly id: "R_A";
    readonly z0: 0;
    readonly z1: 4;
    readonly x: 4.8;
}, {
    readonly id: "R_B";
    readonly z0: 4;
    readonly z1: 8.45;
    readonly x: 4.1;
}, {
    readonly id: "R_C";
    readonly z0: 8.45;
    readonly z1: 12;
    readonly x: 3.5;
}];
/** @deprecated Use RIGHT_FACADE_SEGMENTS for architectural-right (+X) segments. */
export declare const ARCH_RIGHT_FACADE_SEGMENTS: readonly [{
    readonly id: "R_A";
    readonly z0: 0;
    readonly z1: 4;
    readonly x: 4.8;
}, {
    readonly id: "R_B";
    readonly z0: 4;
    readonly z1: 8.45;
    readonly x: 4.1;
}, {
    readonly id: "R_C";
    readonly z0: 8.45;
    readonly z1: 12;
    readonly x: 3.5;
}];
export declare function xFaceForArchSideAtZ(side: SideArchSide, z: number): 3.5 | -3.5 | 4.8 | 4.1 | -4.1 | -4.8;
export declare const leftSideWindowSpecs: SideWindowSpec[];
export declare const rightSideWindowSpecs: SideWindowSpec[];
export declare const sideZMin: number;
export declare const sideZMax: number;
export declare function getSideWindowZCenter(spec: SideWindowSpec, mirrorZ: (z: number) => number): number;
export type WindowFactoryMesh = {
    id: string;
    geometry: THREE.BufferGeometry;
    position: [number, number, number];
    rotation: [number, number, number];
    material?: THREE.Material;
};
export declare function createRevealMeshes({ spec, zCenter, xOuter, xInner, }: {
    spec: WindowFactorySpec;
    zCenter: number;
    xOuter: number;
    xInner: number;
}): WindowFactoryMesh[];
export declare function makeSimpleWindow({ spec, frameX, glassX, xFace, zCenter, side, }: {
    spec: WindowFactorySpec;
    frameX: number;
    glassX: number;
    xFace: number;
    zCenter: number;
    side: 'left' | 'right';
}): WindowFactoryMesh[];
export declare function makeSplitTallWindow({ spec, frameX, glassX, xFace, zCenter, side, levelHeights, }: {
    spec: WindowFactorySpec;
    frameX: number;
    glassX: number;
    xFace: number;
    zCenter: number;
    side: 'left' | 'right';
    levelHeights: {
        firstFloor: number;
    };
}): WindowFactoryMesh[];
export {};
