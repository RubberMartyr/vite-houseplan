import * as THREE from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeOuterPolygon } from './envelope';
import { levelHeights } from './houseSpec';
import {
  CUTOUT_DEPTH,
  CUTOUT_MARGIN,
  EPS,
  FRAME_BORDER,
  FRAME_DEPTH,
  GLASS_INSET,
  GLASS_THICKNESS,
  SILL_HEIGHT,
} from './constants/windowConstants';
import { frameMaterial } from './materials/windowMaterials';
import { buildFrameGeometry } from './builders/buildFrameGeometry';
import { buildSill, type WindowMesh } from './builders/buildSill';

export type RearWindowCutout = {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  level: 'ground' | 'first';
};

type FacadeSpan = {
  minX: number;
  maxX: number;
  maxZ: number;
  width: number;
};

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

  const innerWidth = width - 2 * FRAME_BORDER;
  const innerHeight = height - 2 * FRAME_BORDER;

  const frameGeometry = buildFrameGeometry(width, height);
  const glassGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, GLASS_THICKNESS);

  const frameZ = zFace + EPS - FRAME_DEPTH / 2;
  const glassZ = frameZ - GLASS_INSET;

  const framePosition: [number, number, number] = [xCenter, yCenter, frameZ];
  const glassPosition: [number, number, number] = [xCenter, yCenter, glassZ];

  const meshes: WindowMesh[] = [
    {
      id: `${idBase}_FRAME`,
      geometry: frameGeometry,
      position: framePosition,
      rotation: [0, 0, 0],
      material: frameMaterial,
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
        position: [xCenter + xOffset, yCenter, frameZ],
        rotation: [0, 0, 0],
        material: frameMaterial,
      });
    }
  }

  return meshes;
}

const groundSpan = getRearFacadeSpan(getEnvelopeOuterPolygon());
const firstSpan = getRearFacadeSpan(getEnvelopeFirstOuterPolygon());

function makeCutout({
  width,
  height,
  xCenter,
  yCenter,
  zCenter,
  level,
}: {
  width: number;
  height: number;
  xCenter: number;
  yCenter: number;
  zCenter: number;
  level: 'ground' | 'first';
}): RearWindowCutout {
  const geometry = new THREE.BoxGeometry(width + CUTOUT_MARGIN * 2, height + CUTOUT_MARGIN * 2, CUTOUT_DEPTH);
  geometry.translate(0, 0, -CUTOUT_DEPTH / 2);

  return {
    geometry,
    position: [xCenter, yCenter, zCenter] as [number, number, number],
    rotation: [0, 0, 0],
    level,
  };
}

const groundWindows = (() => {
  const width = 5.6;
  const height = 2.45;
  const leftMargin = 1.0;
  const xCenter = groundSpan.minX + leftMargin + width / 2;
  const yBottom = 0;

  const windowMeshes = makeWindowMeshes({
    idBase: 'REAR_GROUND_BIG',
    width,
    height,
    xCenter,
    yBottom,
    zFace: groundSpan.maxZ,
    mullions: 2,
  });

  const sill = buildSill({
    id: 'REAR_GROUND_SILL',
    width: width + 0.04,
    xCenter,
    yCenter: SILL_HEIGHT / 2,
    zFace: groundSpan.maxZ,
  });

  return [...windowMeshes, sill];
})();

const firstFloorWindows = (() => {
  const sillOffset = 0.8;
  const windowWidth = 1.1;
  const windowHeight = 1.6;
  const yBottom = levelHeights.firstFloor + sillOffset;

  const leftMargin = 1.7;
  const spacing = 2.0;

  const firstCenter = firstSpan.minX + leftMargin + windowWidth / 2;
  const secondCenter = firstSpan.minX + leftMargin + windowWidth + spacing + windowWidth / 2;

  const sillWidth = windowWidth + 0.04;
  const sillYCenter = levelHeights.firstFloor + sillOffset - SILL_HEIGHT / 2;
  const sillZFace = firstSpan.maxZ;

  return [
    ...makeWindowMeshes({
      idBase: 'REAR_FIRST_LEFT',
      width: windowWidth,
      height: windowHeight,
      xCenter: firstCenter,
      yBottom,
      zFace: firstSpan.maxZ,
      mullions: 1,
    }),
    buildSill({
      id: 'REAR_FIRST_LEFT_SILL',
      width: sillWidth,
      xCenter: firstCenter,
      yCenter: sillYCenter,
      zFace: sillZFace,
    }),
    ...makeWindowMeshes({
      idBase: 'REAR_FIRST_RIGHT',
      width: windowWidth,
      height: windowHeight,
      xCenter: secondCenter,
      yBottom,
      zFace: firstSpan.maxZ,
      mullions: 1,
    }),
    buildSill({
      id: 'REAR_FIRST_RIGHT_SILL',
      width: sillWidth,
      xCenter: secondCenter,
      yCenter: sillYCenter,
      zFace: sillZFace,
    }),
  ];
})();

export const windowsRear: { meshes: WindowMesh[] } = {
  meshes: [...groundWindows, ...firstFloorWindows],
};

const groundCutout: RearWindowCutout = makeCutout({
  width: 5.6,
  height: 2.45,
  xCenter: groundSpan.minX + 1.0 + 5.6 / 2,
  yCenter: 2.45 / 2,
  zCenter: groundSpan.maxZ,
  level: 'ground',
});

const firstCutouts: RearWindowCutout[] = (() => {
  const sillOffset = 0.8;
  const windowWidth = 1.1;
  const windowHeight = 1.6;
  const yCenter = levelHeights.firstFloor + sillOffset + windowHeight / 2;
  const leftMargin = 1.7;
  const spacing = 2.0;

  const firstCenter = firstSpan.minX + leftMargin + windowWidth / 2;
  const secondCenter = firstSpan.minX + leftMargin + windowWidth + spacing + windowWidth / 2;

  return [
    makeCutout({
      width: windowWidth,
      height: windowHeight,
      xCenter: firstCenter,
      yCenter,
      zCenter: firstSpan.maxZ,
      level: 'first',
    }),
    makeCutout({
      width: windowWidth,
      height: windowHeight,
      xCenter: secondCenter,
      yCenter,
      zCenter: firstSpan.maxZ,
      level: 'first',
    }),
  ];
})();

export const rearWindowCutouts: RearWindowCutout[] = [groundCutout, ...firstCutouts];
