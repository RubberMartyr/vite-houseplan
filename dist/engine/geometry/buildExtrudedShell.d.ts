import { ExtrudeGeometry } from 'three';
import { FootprintPoint } from '../../model/envelope';
export interface ShellResult {
    geometry: ExtrudeGeometry;
    position: [number, number, number];
    rotation: [number, number, number];
}
export declare function buildExtrudedShell(params: {
    outerPoints: FootprintPoint[];
    innerPolygons?: FootprintPoint[][];
    height: number;
    baseY: number;
}): ShellResult;
