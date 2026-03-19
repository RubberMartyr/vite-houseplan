import type { OpeningStyleSpec } from '../../architecturalTypes';
import { DEFAULT_FRAME_EDGES, DEFAULT_OPENING_STYLE } from '../../openings/openingDefaults';

export function normalizeOpeningStyle(style: OpeningStyleSpec | undefined):
  Required<
    Pick<
      OpeningStyleSpec,
      'frameThickness' | 'frameDepth' | 'glassInset' | 'glassThickness'
    >
  > &
  OpeningStyleSpec {
  return {
    ...DEFAULT_OPENING_STYLE,
    ...(style ?? {}),
    frameEdges: {
      ...DEFAULT_FRAME_EDGES,
      ...(style?.frameEdges ?? {}),
    },
  };
}
