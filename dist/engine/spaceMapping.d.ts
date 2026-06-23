import * as THREE from 'three';
export type ArchXZ = {
    x: number;
    z: number;
};
export type WorldXZ = {
    x: number;
    z: number;
};
export declare function archToWorldXZ(p: ArchXZ): WorldXZ;
export declare function archToWorldVec3(x: number, y: number, z: number): THREE.Vector3;
export declare function archPointToWorldVec3(p: {
    x: number;
    y: number;
    z: number;
}): THREE.Vector3;
export declare function archArrayToWorld(points: ArchXZ[]): WorldXZ[];
