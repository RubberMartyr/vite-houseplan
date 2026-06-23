import * as THREE from 'three';
export type Facade = 'front' | 'rear' | 'left' | 'right';
type FacadePlane = {
    axis: 'x' | 'z';
    value: number;
    outwardNormal: THREE.Vector3;
};
export declare function getFacadePlane(facade: Facade): FacadePlane;
export declare function facadeToWorldSign(facade: Facade): 1 | -1;
export declare function isPointOnFacade(point: {
    x: number;
    z: number;
}, facade: Facade, epsilon?: number): boolean;
export declare function logOrientationAssertions(): void;
export declare function assertWorldOrientation(): void;
export declare function assertOrientationWorld(houseGroup: THREE.Object3D, camera: THREE.Camera, glDom: HTMLCanvasElement): {
    facades: {
        left: {
            world: THREE.Vector3Tuple;
            screen: {
                x: number;
                y: number;
            };
        };
        right: {
            world: THREE.Vector3Tuple;
            screen: {
                x: number;
                y: number;
            };
        };
        front: {
            world: THREE.Vector3Tuple;
            screen: {
                x: number;
                y: number;
            };
        };
        rear: {
            world: THREE.Vector3Tuple;
            screen: {
                x: number;
                y: number;
            };
        };
    };
};
export {};
