export type OpeningSide =
  | 'front'
  | 'rear'
  | 'left'
  | 'right';

export function normalizeOpeningSide(side: string): OpeningSide {
  if (side === 'back' || side === 'backside') {
    return 'rear';
  }

  if (side === 'frontside') {
    return 'front';
  }

  if (side === 'front' || side === 'rear' || side === 'left' || side === 'right') {
    return side;
  }

  throw new Error(`Unsupported opening side: ${side}`);
}
