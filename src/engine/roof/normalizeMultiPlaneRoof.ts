import type { MultiPlaneRoofSpec } from '../types';

export function normalizeMultiPlaneRoof(
  roof: MultiPlaneRoofSpec
): MultiPlaneRoofSpec {
  const clone = JSON.parse(JSON.stringify(roof)) as MultiPlaneRoofSpec;

  for (const face of clone.faces) {
    if (face.kind !== 'ridgeSideSegment') continue;
    if (!face.region || face.region.type !== 'compound') continue;

    face.region.items = face.region.items.map((item: any) => {
      if (item?.type === 'ridgeDivider') {
        const ridge = clone.ridgeSegments.find((r) => r.id === item.ridgeId);
        if (!ridge) return item;

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
