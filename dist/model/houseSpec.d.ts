import type { HouseSpec } from './types/HouseSpec';
export type EnvelopePoint = {
    x: number;
    z: number;
};
export type ArchSide = 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT';
export declare const ARCH_SIDE_TO_WORLD_X: {
    readonly LEFT: -1;
    readonly RIGHT: 1;
};
export declare const depthCm = 1500;
export declare const frontWidthCm = 960;
export declare const rearWidthCm = 760;
export declare const leftFacadeProfileCm: EnvelopePoint[];
export declare const rightFacadeProfileCm: EnvelopePoint[];
export declare const leftFacadeProfile: EnvelopePoint[];
export declare const rightFacadeProfile: EnvelopePoint[];
export declare const frontWidth: number;
export declare const rearWidth: number;
export declare const depth: number;
export declare const envelopeOutline: EnvelopePoint[];
export declare const envelopeBoundsCm: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
};
export declare const footprint: {
    width: number;
    depth: number;
};
export declare const footprintWidth: number;
export declare const footprintDepth: number;
export declare const originOffset: {
    x: number;
    z: number;
};
export declare const frontZ: number;
export declare const rearZ: number;
export declare const leftX: number;
export declare const rightX: number;
export declare const wallThickness: {
    exterior: number;
    interior: number;
};
export declare const ceilingHeights: {
    ground: number;
    first: number;
};
export declare const levelHeights: {
    firstFloor: number;
};
export declare const groundFloorRooms: {
    zithoek: {
        width: number;
        depth: number;
    };
    keuken: {
        width: number;
        depth: number;
        island: {
            width: number;
            depth: number;
        };
    };
    eethoek: {
        width: number;
        depth: number;
    };
    serviceStrip: {
        width: number;
        hallDepth: number;
        stairDepth: number;
        bergingDepth: number;
    };
};
export type RoomRange = {
    xMin: number;
    xMax: number;
    zMin: number;
    zMax: number;
};
export declare const houseSpec: HouseSpec;
