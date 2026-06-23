export type FacadeSide = 'architecturalLeft' | 'architecturalRight';
export type FacadeContext = {
    facade: FacadeSide;
    outward: 1 | -1;
};
export declare function createFacadeContext(facade: 'architecturalLeft' | 'architecturalRight'): FacadeContext;
export declare function worldSideFromOutward(outward: 1 | -1): 'left' | 'right';
