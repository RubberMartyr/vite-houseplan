import { ExtrudeGeometry } from 'three';
export declare function buildFrameGeometry(width: number, height: number, options?: {
    rotateForSide?: boolean;
    frameBorder?: number;
    side?: 'left' | 'right';
}): ExtrudeGeometry;
