export type FacadeSide =
  | 'architecturalLeft'
  | 'architecturalRight'
  | 'left'
  | 'right';

export type FacadeContext = {
  facade: FacadeSide;
  outward: 1 | -1;
};

export function createFacadeContext(facade: FacadeSide): FacadeContext {
  // Temporary compatibility:
  // Treat 'left' as architecturalLeft and 'right' as architecturalRight.
  const normalized =
    facade === 'left'
      ? 'architecturalLeft'
      : facade === 'right'
      ? 'architecturalRight'
      : facade;

  // Your desired semantic mapping:
  // architecturalLeft should map to world +X (outward +1)
  const outward: 1 | -1 =
    normalized === 'architecturalLeft' ? 1 : -1;

  if (import.meta.env.DEV) {
    if (normalized === 'architecturalLeft' && outward !== 1) {
      throw new Error('architecturalLeft must map to outward=+1');
    }
    if (normalized === 'architecturalRight' && outward !== -1) {
      throw new Error('architecturalRight must map to outward=-1');
    }
  }

  return { facade: normalized, outward };
}

export function worldSideFromOutward(outward: 1 | -1): 'left' | 'right' {
  return outward === 1 ? 'right' : 'left';
}
