export type FacadeSide = 'left' | 'right';

export type FacadeContext = {
  facade: FacadeSide;
  outward: number;
  interiorDir: number;
  sillSide: 'left' | 'right';
};

export function createFacadeContext(facade: FacadeSide): FacadeContext {
  if (facade === 'right') {
    return {
      facade,
      outward: -1,
      interiorDir: 1,
      sillSide: 'left',
    };
  }

  return {
    facade,
    outward: 1,
    interiorDir: -1,
    sillSide: 'right',
  };
}
