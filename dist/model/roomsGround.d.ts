export type RoomVolume = {
    id: string;
    label: string;
    bounds: {
        xMin: number;
        xMax: number;
        zMin: number;
        zMax: number;
        yMin: number;
        yMax: number;
    };
};
export declare const roomsGround: RoomVolume[];
