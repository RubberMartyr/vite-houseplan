import type { OpeningEdgeRef, OpeningSpec, OpeningStyleSpec } from '../../architecturalTypes';

export type LeftFacadeStack = {
  id: string;
  groundEdge: OpeningEdgeRef;
  firstEdge: OpeningEdgeRef;
  width: number;
  groundHeight: number;
  firstHeight: number;
  positions: readonly {
    idSuffix?: string;
    groundOffset: number;
    firstOffset?: number;
    includeFirst: boolean;
  }[];
};

export function createLeftFacadeStackOpenings(
  stacks: readonly LeftFacadeStack[],
  styles: {
    lowerTall: OpeningStyleSpec;
    upperTall: OpeningStyleSpec;
    short: OpeningStyleSpec;
  },
): OpeningSpec[] {
  return stacks.flatMap((stack) =>
    stack.positions.flatMap((position) => {
      const idSuffix = position.idSuffix ? `_${position.idSuffix}` : '';

      const openings: OpeningSpec[] = [
        {
          id: `LEFT_STACK_${stack.id}${idSuffix}_G`,
          kind: 'window',
          levelId: stack.groundEdge.levelId,
          edge: stack.groundEdge,
          offset: position.groundOffset,
          width: stack.width,
          sillHeight: 0,
          height: stack.groundHeight,
          style: position.includeFirst ? styles.lowerTall : styles.short,
        },
      ];

      if (!position.includeFirst) {
        return openings;
      }

      openings.push({
        id: `LEFT_STACK_${stack.id}${idSuffix}_F`,
        kind: 'window',
        levelId: stack.firstEdge.levelId,
        edge: stack.firstEdge,
        offset: position.firstOffset ?? position.groundOffset,
        width: stack.width,
        sillHeight: 0,
        height: stack.firstHeight,
        style: styles.upperTall,
      });

      return openings;
    }),
  );
}
