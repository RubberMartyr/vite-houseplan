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

export function buildFacadePanelsWithOpenings({
  outer,
  levelIndex,
  wallHeight,
  wallBase,
  panelThickness = 0.025,
  openings,
}: BuildFacadePanelsInput): FacadePanelMesh[] {
  const panels: FacadePanelMesh[] = [];

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
    const outward = edgeOpenings[0]?.outwardXZ ?? { x: tz, z: -tx };
    const yaw = Math.atan2(outward.x, outward.z);

    panels.push({
      id: `wall_L${levelIndex}_E${edgeIndex}`,
      geometry: geom,
      position: [midpointX, wallBase + wallHeight / 2, midpointZ],
      rotation: [0, yaw, 0],
      materialKey: 'wall',
    });
  }

  return panels;
}
