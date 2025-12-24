import * as THREE from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeOuterPolygon } from './envelope';
import { levelHeights } from './houseSpec';

type WindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
};

type FacadeSpan = {
  minX: number;
  maxX: number;
  maxZ: number;
  width: number;
};

const FRAME_DEPTH = 0.08;
const EPS = 0.01;
const FRAME_BORDER = 0.07;
const GLASS_INSET = 0.015;
const EXPECTED_REAR_WIDTH = 7.6;
const WIDTH_TOLERANCE = 0.05;

function getRearFacadeSpan(points: { x: number; z: number }[]): FacadeSpan {
  const maxZ = points.reduce((max, point) => Math.max(max, point.z), -Infinity);
  const rearPoints = points.filter((point) => Math.abs(point.z - maxZ) < 1e-6);
  const minX = rearPoints.reduce((min, point) => Math.min(min, point.x), Infinity);
  const maxX = rearPoints.reduce((max, point) => Math.max(max, point.x), -Infinity);
  const width = maxX - minX;

  if (Math.abs(width - EXPECTED_REAR_WIDTH) > WIDTH_TOLERANCE) {
    console.warn(
      `[windowsRear] Rear facade width (${width.toFixed(3)}m) differs from expected ${EXPECTED_REAR_WIDTH}m`
    );
  }

  return { minX, maxX, maxZ, width };
}

function makeWindowMeshes(params: {
  idBase: string;
  width: number;
  height: number;
  xCenter: number;
  yBottom: number;
  zFace: number;
  mullions?: number;
}): WindowMesh[] {
  const { idBase, width, height, xCenter, yBottom, zFace, mullions = 0 } = params;
  const yCenter = yBottom + height / 2;

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, -halfHeight);
  outerShape.lineTo(halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, halfHeight);
  outerShape.lineTo(-halfWidth, -halfHeight);

  const innerPath = new THREE.Path();
  innerPath.moveTo(-innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, innerHeight / 2);
  innerPath.lineTo(innerWidth / 2, -innerHeight / 2);
  innerPath.lineTo(-innerWidth / 2, -innerHeight / 2);
  outerShape.holes.push(innerPath);

  const frameGeometry = new THREE.ExtrudeGeometry(outerShape, {
    depth: FRAME_DEPTH,
    bevelEnabled: false,
  });
  frameGeometry.translate(0, 0, -FRAME_DEPTH / 2);

  const glassGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, 0.01);

  const framePosition: [number, number, number] = [xCenter, yCenter, zFace + EPS];
  const glassPosition: [number, number, number] = [
    xCenter,
    yCenter,
    zFace + EPS - GLASS_INSET,
  ];

  const meshes: WindowMesh[] = [
    {
      id: `${idBase}_FRAME`,
      geometry: frameGeometry,
      position: framePosition,
      rotation: [0, 0, 0],
    },
    {
      id: `${idBase}_GLASS`,
      geometry: glassGeometry,
      position: glassPosition,
      rotation: [0, 0, 0],
    },
  ];

  if (mullions > 0) {
    const mullionWidth = FRAME_BORDER / 2;
    const spacing = innerWidth / (mullions + 1);
    for (let i = 1; i <= mullions; i += 1) {
      const xOffset = -innerWidth / 2 + spacing * i;
      meshes.push({
        id: `${idBase}_MULLION_${i}`,
        geometry: new THREE.BoxGeometry(mullionWidth, innerHeight, FRAME_DEPTH),
        position: [xCenter + xOffset, yCenter, zFace + EPS],
        rotation: [0, 0, 0],
      });
    }
  }

  return meshes;
}

const groundSpan = getRearFacadeSpan(getEnvelopeOuterPolygon());
const firstSpan = getRearFacadeSpan(getEnvelopeFirstOuterPolygon());

const groundWindows = (() => {
  const width = 5.6;
  const height = 2.45;
  const leftMargin = 1.0;
  const xCenter = groundSpan.minX + leftMargin + width / 2;
  const yBottom = 0;

  return makeWindowMeshes({
    idBase: 'REAR_GROUND_BIG',
    width,
    height,
    xCenter,
    yBottom,
    zFace: groundSpan.maxZ,
  });
})();

const firstFloorWindows = (() => {
  const sillOffset = 0.8; // 3.40 (sill) - 2.60 (first floor base)
  const windowWidth = 1.1;
  const windowHeight = 1.6; // 5.00 - 3.40
  const yBottom = levelHeights.firstFloor + sillOffset;

  const leftMargin = 1.7;
  const spacing = 2.0;

  const firstCenter = firstSpan.minX + leftMargin + windowWidth / 2;
  const secondCenter = firstSpan.minX + leftMargin + windowWidth + spacing + windowWidth / 2;

  return [
    ...makeWindowMeshes({
      idBase: 'REAR_FIRST_LEFT',
      width: windowWidth,
      height: windowHeight,
      xCenter: firstCenter,
      yBottom,
      zFace: firstSpan.maxZ,
    }),
    ...makeWindowMeshes({
      idBase: 'REAR_FIRST_RIGHT',
      width: windowWidth,
      height: windowHeight,
      xCenter: secondCenter,
      yBottom,
      zFace: firstSpan.maxZ,
    }),
  ];
})();

export const windowsRear: { meshes: WindowMesh[] } = {
  meshes: [...groundWindows, ...firstFloorWindows],
};
