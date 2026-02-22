import { getEnvelopeOuterPolygon } from '../envelope';
import type { FacadeContext } from './facadeContext';

export function resolveFacadeX(ctx: FacadeContext, _z: number): number {
  const outer = getEnvelopeOuterPolygon();
  const xs = outer.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  // outward +1 => +X wall, outward -1 => -X wall
  return ctx.outward === 1 ? maxX : minX;
}
