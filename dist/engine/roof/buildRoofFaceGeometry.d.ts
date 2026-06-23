import * as THREE from "three";
import type { RoofTriangle } from "./types";
export declare function buildRoofFaceGeometry(triangles: RoofTriangle[], options: {
    topHeight: number;
    bottomHeight: number;
}): THREE.BufferGeometry;
