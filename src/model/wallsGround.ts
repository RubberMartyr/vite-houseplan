import {
  BoxGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
} from 'three';
import layoutGround from './layoutGround';
import { ceilingHeights, wallThickness } from './houseSpec';

type Opening = {
  xMin: number;
  xMax: number;
  bottom: number;
  height: number;
  zMin: number;
  zMax: number;
};

type OpeningMeshes = {
  frame: Mesh;
  glass: Mesh;
};

type WallsGround = {
  walls: Mesh[];
  frames: Mesh[];
  glass: Mesh[];
};

const wallMaterial = new MeshStandardMaterial({
  color: 0xf3f0eb,
  side: DoubleSide,
});
const frameMaterial = new MeshStandardMaterial({ color: 0x1c1c1c });
const glassMaterial = new MeshPhysicalMaterial({
  color: 0xdceeff,
  transparent: true,
  opacity: 1,
  transmission: 1,
  roughness: 0.05,
  metalness: 0,
  thickness: 0.02,
});

const { width: footprintWidth, depth: footprintDepth } = layoutGround.footprint;
const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;

function createExtrudedRectangle(
  xMin: number,
  xMax: number,
  zMin: number,
  zMax: number,
  height: number,
  yOffset = 0
): Mesh {
  const shape = new Shape();
  shape.moveTo(xMin, -zMin);
  shape.lineTo(xMax, -zMin);
  shape.lineTo(xMax, -zMax);
  shape.lineTo(xMin, -zMax);
  shape.lineTo(xMin, -zMin);

  const geometry = new ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, yOffset, 0);

  return new Mesh(geometry, wallMaterial);
}

function buildFacadeSegments(
  xStart: number,
  xEnd: number,
  zMin: number,
  zMax: number,
  openings: Opening[]
): Mesh[] {
  const sections: Mesh[] = [];
  const sorted = [...openings]
    .map((opening) => normalizeOpening(opening))
    .sort((a, b) => a.xMin - b.xMin);
  let cursor = xStart;

  sorted.forEach((opening) => {
    const openingTop = Math.min(opening.bottom + opening.height, wallHeight);
    const openingHeight = Math.max(0, openingTop - opening.bottom);

    if (opening.xMin > cursor) {
      sections.push(
        createExtrudedRectangle(cursor, opening.xMin, opening.zMin, opening.zMax, wallHeight)
      );
    }

    if (opening.bottom > 0 && openingHeight > 0) {
      sections.push(
        createExtrudedRectangle(
          opening.xMin,
          opening.xMax,
          opening.zMin,
          opening.zMax,
          opening.bottom
        )
      );
    }

    if (openingHeight > 0 && openingTop < wallHeight) {
      sections.push(
        createExtrudedRectangle(
          opening.xMin,
          opening.xMax,
          opening.zMin,
          opening.zMax,
          wallHeight - openingTop,
          openingTop
        )
      );
    }

    cursor = Math.max(cursor, opening.xMax);
  });

  if (cursor < xEnd) {
    sections.push(createExtrudedRectangle(cursor, xEnd, zMin, zMax, wallHeight));
  }

  return sections;
}

function normalizeOpening(opening: Opening): Opening {
  const clampedHeight = Math.max(0, Math.min(opening.height, wallHeight - opening.bottom));
  return {
    ...opening,
    height: clampedHeight,
  };
}

function createOpeningMeshes(opening: Opening): OpeningMeshes {
  const normalizedOpening = normalizeOpening(opening);
  const inset = 0.05;
  const depth = Math.max(0.02, normalizedOpening.zMax - normalizedOpening.zMin - inset * 2);
  const frameDepth = depth * 0.4;

  const frameGeometry = new BoxGeometry(
    normalizedOpening.xMax - normalizedOpening.xMin,
    normalizedOpening.height,
    frameDepth
  );
  const glassGeometry = new BoxGeometry(
    normalizedOpening.xMax - normalizedOpening.xMin - inset * 2,
    Math.max(0, normalizedOpening.height - inset * 2),
    Math.max(0.01, depth - inset * 2)
  );

  const frame = new Mesh(frameGeometry, frameMaterial);
  frame.position.set(
    (normalizedOpening.xMin + normalizedOpening.xMax) / 2,
    normalizedOpening.bottom + normalizedOpening.height / 2,
    (normalizedOpening.zMin + normalizedOpening.zMax) / 2
  );

  const glass = new Mesh(glassGeometry, glassMaterial);
  glass.position.set(
    (normalizedOpening.xMin + normalizedOpening.xMax) / 2,
    normalizedOpening.bottom + normalizedOpening.height / 2,
    (normalizedOpening.zMin + normalizedOpening.zMax) / 2
  );

  return { frame, glass };
}

const zoneA = layoutGround.zones.living;
const zoneB = layoutGround.zones.service;
const facadeOpenings: Record<'front' | 'rear', Opening[]> = {
  front: [],
  rear: [],
};

const livingCenter = (zoneA.xMin + zoneA.xMax) / 2;
const serviceCenter = (zoneB.xMin + zoneB.xMax) / 2;

facadeOpenings.front.push({
  xMin: livingCenter - 1.2,
  xMax: livingCenter + 1.2,
  bottom: 0.9,
  height: 1.8,
  zMin: 0,
  zMax: exteriorThickness,
});

facadeOpenings.front.push({
  xMin: serviceCenter - 0.95 / 2,
  xMax: serviceCenter + 0.95 / 2,
  bottom: 0,
  height: 2.1,
  zMin: 0,
  zMax: exteriorThickness,
});

facadeOpenings.rear.push({
  xMin: livingCenter - 4 / 2,
  xMax: livingCenter + 4 / 2,
  bottom: 0,
  height: 2.4,
  zMin: footprintDepth - exteriorThickness,
  zMax: footprintDepth,
});

facadeOpenings.rear.push({
  xMin: serviceCenter - 0.9 / 2,
  xMax: serviceCenter + 0.9 / 2,
  bottom: 0,
  height: 2.1,
  zMin: footprintDepth - exteriorThickness,
  zMax: footprintDepth,
});

const walls: Mesh[] = [];
const frames: Mesh[] = [];
const glass: Mesh[] = [];

facadeOpenings.front.forEach((opening) => {
  const meshes = createOpeningMeshes(opening);
  meshes.frame.visible = false;
  meshes.glass.visible = false;
  frames.push(meshes.frame);
  glass.push(meshes.glass);
});

facadeOpenings.rear.forEach((opening) => {
  const meshes = createOpeningMeshes(opening);
  meshes.frame.visible = false;
  meshes.glass.visible = false;
  frames.push(meshes.frame);
  glass.push(meshes.glass);
});

walls.push(
  ...buildFacadeSegments(0, footprintWidth, 0, exteriorThickness, facadeOpenings.front)
);
walls.push(
  ...buildFacadeSegments(
    0,
    footprintWidth,
    footprintDepth - exteriorThickness,
    footprintDepth,
    facadeOpenings.rear
  )
);

walls.push(createExtrudedRectangle(0, exteriorThickness, 0, footprintDepth, wallHeight));
walls.push(
  createExtrudedRectangle(
    footprintWidth - exteriorThickness,
    footprintWidth,
    0,
    footprintDepth,
    wallHeight
  )
);

const wallsGround: WallsGround = {
  walls,
  frames,
  glass,
};

export default wallsGround;
