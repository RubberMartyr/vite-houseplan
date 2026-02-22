export type FacadeSide = 'left' | 'right';

export type FacadeContext = {
  facade: FacadeSide;
  outward: number;
};

export function createFacadeContext(facade: 'left' | 'right') {
  const outward = facade === 'right' ? 1 : -1;
  return { facade, outward };
}

export function worldSideFromOutward(outward: number): FacadeSide {
  return outward === 1 ? 'right' : 'left';
}
