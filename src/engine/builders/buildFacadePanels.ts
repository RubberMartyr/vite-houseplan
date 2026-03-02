import * as THREE from 'three';
import type { Vec2 } from '../architecturalTypes';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import type { EngineMesh } from './buildWindowMeshes';

export type FacadePanelMesh = EngineMesh;

type BuildFacadePanelsInput = {
  outer: Vec2[];
  levelIndex: number;
  wallHeight: number;
  wallBase: number;
  panelThickness?: number;
  openings: DerivedOpeningRect[];
};

const MIN_HOLE_SIZE = 1e-4;
const PANEL_OFFSET_EPS = 1e-3;

function polygonSignedAreaXZ(points: Vec2[]): number {
  let area2 = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area2 += current.x * next.z - next.x * current.z;
  }

  return area2 / 2;
}

export function buildFacadePanelsWithOpenings({
  outer,
  levelIndex,
  wallHeight,
  wallBase,
  panelThickness = 0.025,
  openings,
}: BuildFacadePanelsInput): FacadePanelMesh[] {
  const panels: FacadePanelMesh[] = [];
  const isCounterClockwise = polygonSignedAreaXZ(outer) > 0;

  if (outer.length < 2) return panels;

  for (let edgeIndex = 0; edgeIndex < outer.length; edgeIndex += 1) {
    const a = outer[edgeIndex];
    const b = outer[(edgeIndex + 1) % outer.length];

    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const width = Math.hypot(dx, dz);

    if (width < MIN_HOLE_SIZE) continue;

    const tx = dx / width;
    const tz = dz / width;

    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -wallHeight / 2);
    shape.lineTo(width / 2, -wallHeight / 2);
    shape.lineTo(width / 2, wallHeight / 2);
    shape.lineTo(-width / 2, wallHeight / 2);
    shape.closePath();

    const edgeOpenings = openings.filter((op) => op.levelIndex === levelIndex && op.edgeIndex === edgeIndex);

    for (const opening of edgeOpenings) {
      const xMin = opening.uMin - width / 2;
      const xMax = opening.uMax - width / 2;
      const yMin = opening.vMin - wallHeight / 2;
      const yMax = opening.vMax - wallHeight / 2;

      if (xMax - xMin <= MIN_HOLE_SIZE || yMax - yMin <= MIN_HOLE_SIZE) continue;

      const hole = new THREE.Path();
      hole.moveTo(xMin, yMin);
      hole.lineTo(xMax, yMin);
      hole.lineTo(xMax, yMax);
      hole.lineTo(xMin, yMax);
      hole.closePath();
      shape.holes.push(hole);
    }

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: panelThickness,
      bevelEnabled: false,
    });

    geom.translate(0, 0, -panelThickness / 2);
    geom.computeVertexNormals();

    const midpointX = (a.x + b.x) / 2;
    const midpointZ = (a.z + b.z) / 2;
    const outward = isCounterClockwise ? { x: tz, z: -tx } : { x: -tz, z: tx };
    const yaw = Math.atan2(outward.x, outward.z);
    const outwardOffset = panelThickness / 2 + PANEL_OFFSET_EPS;

    panels.push({
      id: `wall_L${levelIndex}_E${edgeIndex}`,
      geometry: geom,
      position: [
        midpointX + outward.x * outwardOffset,
        wallBase + wallHeight / 2,
        midpointZ + outward.z * outwardOffset,
      ],
      rotation: [0, yaw, 0],
      materialKey: 'wall',
    });
  }

  console.log('FACADE PANELS COUNT:', panels.length);
  console.log('RETURNING PANELS:', panels.length);

  return panels;
}
