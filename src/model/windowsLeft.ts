import { ceilingHeights } from './houseSpec';
import { buildSideWindows, type SideWindowSpec } from './builders/sideWindowBuilder';
import type { FacadeSegment } from './builders/sideFacade';
import { getEnvelopeOuterPolygon } from './envelope';

export const RIGHT_WORLD_FACADE_SEGMENTS: readonly FacadeSegment[] = [
  { id: 'L_A', z0: 0.0, z1: 4.0, x: 4.8 },
  { id: 'L_B', z0: 4.0, z1: 8.45, x: 4.1 },
  { id: 'L_C', z0: 8.45, z1: 12.0, x: 3.5 },
] as const;

const sideWindowSpecs: SideWindowSpec[] = [
  {
    id: 'SIDE_L_EXT',
    kind: 'small',
    zCenter: 1.2,
    width: 1.0,
    groundY0: 0.0,
    groundY1: 2.15,
    firstY0: 0.0,
    firstY1: 0.0,
  },
  {
    id: 'SIDE_L_TALL_1',
    kind: 'tall',
    zCenter: 4.6,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
  {
    id: 'SIDE_L_TALL_2',
    kind: 'tall',
    zCenter: 6.8,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
  {
    id: 'SIDE_L_TALL_3',
    kind: 'tall',
    zCenter: 9.35,
    width: 1.1,
    groundY0: 0.0,
    groundY1: ceilingHeights.ground,
    firstY0: ceilingHeights.ground,
    firstY1: 5.0,
  },
];

const pts = getEnvelopeOuterPolygon();
const sideZMin = Math.min(...pts.map(p => p.z));
const sideZMax = Math.max(...pts.map(p => p.z));
const mirrorZ = (z:number) => sideZMin + sideZMax - z;

export const windowsLeft = {
  meshes: buildSideWindows(sideWindowSpecs, {
    profile: RIGHT_WORLD_FACADE_SEGMENTS,
    outwardX: 1,
    zTransform: mirrorZ,
    alignToFacadePanels: true,
  }),
  profile: RIGHT_WORLD_FACADE_SEGMENTS,
};
