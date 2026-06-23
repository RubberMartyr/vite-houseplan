type RoofTriangle = {
    a: [number, number, number];
    b: [number, number, number];
    c: [number, number, number];
};
type RoofFace = {
    id?: string;
    triangles?: RoofTriangle[];
};
type VisualizerRoof = {
    id?: string;
    faces?: RoofFace[];
};
type Props = {
    roofs: VisualizerRoof[];
    roofRevision: number;
};
export declare function shouldShowRoofPlanes(): boolean;
export declare function RoofPlaneVisualizer({ roofs, roofRevision }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
