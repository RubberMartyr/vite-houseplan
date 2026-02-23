export type FacadeSide =
  | 'architecturalLeft'
  | 'architecturalRight'
  | 'left'
  | 'right';

export type FacadeContext = {
  facade: FacadeSide;
  outward: 1 | -1;
};

export function createFacadeContext(
  facade: 'architecturalLeft' | 'architecturalRight'
): FacadeContext {
  const outward =
    facade === 'architecturalLeft'
      ? -1
      : 1;

  return { facade, outward };
}

export function worldSideFromOutward(outward: 1 | -1): 'left' | 'right' {
  return outward === 1 ? 'right' : 'left';
}
