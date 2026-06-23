export type Point2D = {
    x: number;
    z: number;
};
export type Line2D = {
    point: Point2D;
    direction: Point2D;
};
export declare function polygonArea(points: Point2D[]): number;
export declare function ensureClockwise(points: Point2D[]): Point2D[];
export declare function ensureCounterClockwise(points: Point2D[]): Point2D[];
export declare function normalizeVector(dx: number, dz: number): Point2D;
export declare function lineIntersection(l1: Line2D, l2: Line2D): Point2D;
