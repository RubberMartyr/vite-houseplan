import { buildSideWindows, type SideWindowSpec } from './builders/sideWindowBuilder';
import type { FacadeSegment } from './builders/sideFacade';

export const ARCH_RIGHT_FACADE_SEGMENTS: readonly FacadeSegment[] = [
  { id: 'R_FLAT', z0: 0.0, z1: 50.0, x: -4.8 },
] as const;

const rightSpecs: SideWindowSpec[] = [
  {
    id: 'SIDE_R_DOOR',
    kind: 'small',
    zCenter: 5.5,
    width: 1.0,
    groundY0: 0.0,
    groundY1: 2.15,
    firstY0: 0,
    firstY1: 0,
  },
  {
    id: 'SIDE_R_WIN',
    kind: 'small',
    zCenter: 5.5,
    width: 0.9,
    groundY0: 0,
    groundY1: 0,
    firstY0: 4.1,
    firstY1: 5.0,
  },
];

export const windowsRight = {
  meshes: buildSideWindows(rightSpecs, { profile: ARCH_RIGHT_FACADE_SEGMENTS, outwardX: -1 }),
};
