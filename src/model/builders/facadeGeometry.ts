import { getEnvelopeOuterPolygon } from '../envelope';
import type { FacadeContext } from './facadeContext';

export function resolveFacadeX(ctx: FacadeContext, _z: number): number {
  const outer = getEnvelopeOuterPolygon();
  const minX = Math.min(...outer.map((p) => p.x));
  const maxX = Math.max(...outer.map((p) => p.x));

  return ctx.facade === 'left' ? minX : maxX;
}
