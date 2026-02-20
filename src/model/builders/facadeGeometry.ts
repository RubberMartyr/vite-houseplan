import { RIGHT_WORLD_FACADE_SEGMENTS } from './windowFactory';
import { xFaceForProfileAtZ } from './sideFacade';
import type { FacadeContext } from './facadeContext';

export function xFaceForRightWorldAtZ(z: number): number {
  return xFaceForProfileAtZ(RIGHT_WORLD_FACADE_SEGMENTS, z);
}

export function resolveFacadeX(ctx: FacadeContext, z: number): number {
  const x = xFaceForRightWorldAtZ(z);
  return ctx.facade === 'right' ? x : -x;
}
