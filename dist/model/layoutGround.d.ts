import { RoomRange } from './houseSpec';
export declare const layoutGround: {
    footprint: {
        width: number;
        depth: number;
    };
    wallThickness: {
        exterior: number;
        interior: number;
    };
    interior: {
        width: number;
        depth: number;
        xMin: number;
        xMax: number;
        zMin: number;
        zMax: number;
    };
    zones: {
        living: Pick<RoomRange, "xMin" | "xMax">;
        service: Pick<RoomRange, "xMin" | "xMax">;
    };
    depthScale: number;
    livingDepthTotal: number;
    serviceDepthTotal: number;
    livingEnd: number;
    serviceEnd: number;
    rooms: Record<string, RoomRange>;
};
