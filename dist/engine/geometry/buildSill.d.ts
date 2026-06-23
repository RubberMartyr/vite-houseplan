import * as THREE from 'three';
export type WindowMesh = {
    id: string;
    geometry: THREE.BufferGeometry;
    position: [number, number, number];
    rotation: [number, number, number];
    material?: THREE.Material;
};
export declare function buildSill(params: {
    id: string;
    width: number;
    xCenter?: number;
    yCenter?: number;
    zFace?: number;
    facing?: 'front' | 'rear';
    zCenter?: number;
    yBottom?: number;
    xFace?: number;
    side?: 'left' | 'right';
}): WindowMesh;
