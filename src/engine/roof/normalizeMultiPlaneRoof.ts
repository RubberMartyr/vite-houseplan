import type { MultiPlaneRoofSpec } from '../types';

export function normalizeMultiPlaneRoof(
  roof: MultiPlaneRoofSpec
): MultiPlaneRoofSpec {
  const clone = JSON.parse(JSON.stringify(roof)) as MultiPlaneRoofSpec;

  for (const face of clone.faces) {
    if (face.kind !== 'ridgeSideSegment') continue;
    if (!face.region || face.region.type !== 'compound') continue;

    const ridge = clone.ridgeSegments.find(r => r.id === face.ridgeId);
    if (!ridge || !face.side) continue;

    const alreadyHasExplicitDivider = face.region.items.some(
      (item: any) =>
        item &&
        typeof item === 'object' &&
        'a' in item &&
        'b' in item &&
        'keep' in item &&
        !('type' in item)
    );

    if (!alreadyHasExplicitDivider) {
      face.region.items.unshift({
        a: ridge.start,
        b: ridge.end,
        keep: face.side,
      });
    }

    // Expand symbolic ridgeDivider if present (backward compatibility)
    face.region.items = face.region.items.map((item: any) => {
      if (item?.type === 'ridgeDivider') {
        return {
          a: ridge.start,
          b: ridge.end,
          keep: item.keep,
        };
      }

      return item;
    });
  }

  return clone;
}
