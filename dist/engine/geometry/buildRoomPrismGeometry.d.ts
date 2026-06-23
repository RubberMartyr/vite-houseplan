import * as THREE from 'three';
type RoomPrismInput = {
    polygon: {
        x: number;
        z: number;
    }[];
    baseY: number;
    height: number;
};
export declare function buildRoomPrismGeometry({ polygon, baseY, height, }: RoomPrismInput): THREE.BufferGeometry;
export {};
