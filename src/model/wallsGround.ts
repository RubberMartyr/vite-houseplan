import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Matrix4,
  MeshStandardMaterial,
  Path,
  Quaternion,
  Shape,
  Vector3,
} from 'three';
import { getEnvelopeInnerPolygon, getEnvelopeOuterPolygon } from './envelope';
import { ceilingHeights, wallThickness } from './houseSpec';
import { rearWindowCutouts } from './windowsRear';
import { RIGHT_FACADE_SEGMENTS, SIDE, getSideWindowZCenter, makeMirrorZ, sideWindowSpecs } from './windowsSide';

const wallHeight = ceilingHeights.ground;
const exteriorThickness = wallThickness.exterior;
const FACADE_PANEL_THICKNESS = 0.025;
const EPSILON = 0.01;
const MIN_HOLE_W = 0.05;
const MIN_HOLE_H = 0.05;
const PANEL_EPS = 0.002;
const REVEAL_FACE = 0.05;
const REVEAL_DEPTH = exteriorThickness;
const REVEAL_MATERIAL = new MeshStandardMaterial({ color: '#e8e5df', roughness: 0.85, metalness: 0.05 });
const envelopeOuter = getEnvelopeOuterPolygon();
const envelopeBounds = (() => {
  return {
    minZ: Math.min(...envelopeOuter.map((point) => point.z)),
    maxZ: Math.max(...envelopeOuter.map((point) => point.z)),
  };
})();
const envelopeMinX = Math.min(...envelopeOuter.map((point) => point.x));
const mirrorZ = makeMirrorZ(envelopeBounds.minZ, envelopeBounds.maxZ);
const openingEpsilon = 0.01;

type OpeningBox = { id: string; box: Box3 };

function getXFaceForRightAtZ(z: number) {
  if (z <= RIGHT_FACADE_SEGMENTS[0].z1) return RIGHT_FACADE_SEGMENTS[0].x;
  if (z <= RIGHT_FACADE_SEGMENTS[1].z1) return RIGHT_FACADE_SEGMENTS[1].x;
  return RIGHT_FACADE_SEGMENTS[2].x;
}

function applyOpeningsToWallGeometry(geometry: ExtrudeGeometry, openings: OpeningBox[]) {
  const nonIndexed = geometry.toNonIndexed();
  const position = nonIndexed.getAttribute('position');
  const uv = nonIndexed.getAttribute('uv');

  const keptPositions: number[] = [];
  const keptUVs: number[] = [];
  let removedTotal = 0;
  let keptTotal = 0;

  const v0 = new Vector3();
  const v1 = new Vector3();
  const v2 = new Vector3();
  const centroid = new Vector3();

  for (let i = 0; i < position.count; i += 3) {
    v0.fromBufferAttribute(position as any, i);
    v1.fromBufferAttribute(position as any, i + 1);
    v2.fromBufferAttribute(position as any, i + 2);

    centroid.set(
      (v0.x + v1.x + v2.x) / 3,
      (v0.y + v1.y + v2.y) / 3,
      (v0.z + v1.z + v2.z) / 3
    );

    const insideOpening = openings.some(({ box }) => box.containsPoint(centroid));

    if (insideOpening) {
      removedTotal += 3;
      continue;
    }

    keptPositions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    if (uv) {
      const uvAttr = uv as any;
      keptUVs.push(
        uvAttr.getX(i),
        uvAttr.getY(i),
        uvAttr.getX(i + 1),
        uvAttr.getY(i + 1),
        uvAttr.getX(i + 2),
        uvAttr.getY(i + 2)
      );
    }
    keptTotal += 3;
  }

  const opened = new BufferGeometry();
  opened.setAttribute('position', new Float32BufferAttribute(keptPositions, 3));
  if (uv && keptUVs.length === (keptPositions.length / 3) * 2) {
    opened.setAttribute('uv', new Float32BufferAttribute(keptUVs, 2));
  }
  opened.computeVertexNormals();

  console.log('✅ wallsGround openings result', { removedTotal, keptTotal, openingCount: openings.length });

  return { geometry: opened, stats: { removedTotal, keptTotal, openingCount: openings.length } };
}

function makeRearOpeningBoxes() {
  const matrix = new Matrix4();
  const quat = new Quaternion();
  return rearWindowCutouts
    .filter((cutout) => cutout.level === 'ground')
    .map((cutout, index) => {
      if (!cutout.geometry.boundingBox) {
        cutout.geometry.computeBoundingBox();
      }
      const box = cutout.geometry.boundingBox!.clone();
      const position = new Vector3(...cutout.position);
      matrix.compose(position, quat, new Vector3(1, 1, 1));
      box.applyMatrix4(matrix);
      return { id: `rear-${index}`, box };
    });
}

function makeSideOpeningBoxes() {
  const outward = SIDE === 'right' ? 1 : -1;
  return sideWindowSpecs
    .map((spec) => {
      const zCenter = getSideWindowZCenter(spec, mirrorZ);
      const xFace = SIDE === 'right' ? getXFaceForRightAtZ(zCenter) : envelopeMinX;
      const xOuter = xFace + outward * openingEpsilon;
      const xInner = xOuter - outward * exteriorThickness;
      const minY = Math.max(0, spec.groundY0);
      const maxY = Math.min(wallHeight, spec.groundY1);
      if (maxY - minY < MIN_HOLE_H || spec.width < MIN_HOLE_W) {
        return null;
      }

      const halfWidth = spec.width / 2;
      const box = new Box3(
        new Vector3(Math.min(xOuter, xInner) - openingEpsilon, minY, zCenter - halfWidth - openingEpsilon),
        new Vector3(Math.max(xOuter, xInner) + openingEpsilon, maxY, zCenter + halfWidth + openingEpsilon)
      );

      return { id: spec.id, box };
    })
    .filter(Boolean) as OpeningBox[];
}

export const wallsGround = {
  shell: (() => {
    const outer = getEnvelopeOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness);
    const toShapePoints = (points: { x: number; z: number }[]) => {
      const openPoints =
        points.length > 1 && points[0].x === points[points.length - 1].x && points[0].z === points[points.length - 1].z
          ? points.slice(0, -1)
          : points;

      return openPoints;
    };

    const outerShape = new Shape();
    const outerPoints = toShapePoints(outer);
    outerPoints.forEach((point, index) => {
      if (index === 0) {
        outerShape.moveTo(point.x, -point.z);
      } else {
        outerShape.lineTo(point.x, -point.z);
      }
    });
    outerShape.closePath();

    const holePath = new Path();
    const innerPoints = toShapePoints(inner);
    innerPoints.forEach((point, index) => {
      if (index === 0) {
        holePath.moveTo(point.x, -point.z);
      } else {
        holePath.lineTo(point.x, -point.z);
      }
    });
    holePath.closePath();
    outerShape.holes.push(holePath);

    const geometry = new ExtrudeGeometry(outerShape, { depth: wallHeight, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const openings = [...makeRearOpeningBoxes(), ...makeSideOpeningBoxes()];
    const { geometry: openedGeometry, stats } = applyOpeningsToWallGeometry(geometry, openings);

    return {
      geometry: openedGeometry,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      openingsStats: stats,
    };
  })(),

  rearFacade: (() => {
    const outer = getEnvelopeOuterPolygon();
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const rearEdgePoints = outer.filter((point) => Math.abs(point.z - rearZ) < 1e-6);
    const leftX = rearEdgePoints.reduce((min, point) => Math.min(min, point.x), Infinity);
    const rightX = rearEdgePoints.reduce((max, point) => Math.max(max, point.x), -Infinity);
    const width = rightX - leftX;
    const panelCenterX = (leftX + rightX) / 2;
    const panelHeight = wallHeight;
    const panelDepth = FACADE_PANEL_THICKNESS;

    const toLocalRect = (rect: { xMin: number; xMax: number; yMin: number; yMax: number }) => ({
      xMin: rect.xMin - panelCenterX,
      xMax: rect.xMax - panelCenterX,
      yMin: rect.yMin - panelHeight / 2,
      yMax: rect.yMax - panelHeight / 2,
    });

    const shape = new Shape();
    shape.moveTo(-width / 2, -panelHeight / 2);
    shape.lineTo(width / 2, -panelHeight / 2);
    shape.lineTo(width / 2, panelHeight / 2);
    shape.lineTo(-width / 2, panelHeight / 2);
    shape.closePath();

    const openings = [
      toLocalRect({
        xMin: leftX + 1.0,
        xMax: leftX + 6.6,
        yMin: 0.0,
        yMax: 2.45,
      }),
    ];

    openings.forEach((rect) => {
      const path = new Path();
      path.moveTo(rect.xMin, rect.yMin);
      path.lineTo(rect.xMax, rect.yMin);
      path.lineTo(rect.xMax, rect.yMax);
      path.lineTo(rect.xMin, rect.yMax);
      path.closePath();
      shape.holes.push(path);
    });

    const panelGeometry = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false });
    panelGeometry.translate(0, 0, -panelDepth / 2);
    panelGeometry.computeVertexNormals();

    return {
      geometry: panelGeometry,
      position: [panelCenterX, panelHeight / 2, rearZ - panelDepth / 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  rightFacades: (() => makeRightFacadePanels(mirrorZ))(),
  rightReveals: (() => makeRightFacadeReveals(mirrorZ))(),
};

function makeRightFacadePanels(mirrorZ: (z: number) => number) {
  return RIGHT_FACADE_SEGMENTS.map((segment) => {
    const widthZ = segment.z1 - segment.z0;
    const panelCenterZ = (segment.z0 + segment.z1) / 2;
    const holes = collectGroundHolesForSegment(segment, mirrorZ).map((opening) => ({
      z0: opening.zCenter - opening.widthZ / 2 - segment.z0,
      z1: opening.zCenter + opening.widthZ / 2 - segment.z0,
      y0: opening.y0,
      y1: opening.y1,
      id: opening.id,
    }));

    holes.forEach((hole) => {
      console.log('✅ SIDE PANEL HOLE (ground)', {
        segment: segment.id,
        zRange: [hole.z0, hole.z1],
        yRange: [hole.y0, hole.y1],
      });
    });

    const panelGeometry = makeFacadePanelWithHoles({
      width: widthZ,
      height: wallHeight,
      holes,
      thickness: FACADE_PANEL_THICKNESS,
    });

    console.log('✅ SIDE PANEL SEGMENT (ground)', segment.id, {
      z0: segment.z0,
      z1: segment.z1,
      xFace: segment.x,
      holes: holes.length,
    });

    return {
      geometry: panelGeometry,
      position: [segment.x + PANEL_EPS - FACADE_PANEL_THICKNESS / 2, wallHeight / 2, panelCenterZ] as [
        number,
        number,
        number,
      ],
      rotation: [0, 0, 0] as [number, number, number],
    };
  });
}

function makeRightFacadeReveals(mirrorZ: (z: number) => number) {
  return RIGHT_FACADE_SEGMENTS.flatMap((segment) => {
    const widthZ = segment.z1 - segment.z0;
    const panelCenterZ = (segment.z0 + segment.z1) / 2;
    const panelCenterY = wallHeight / 2;
    const holes = collectGroundHolesForSegment(segment, mirrorZ).map((opening) => ({
      z0: opening.zCenter - opening.widthZ / 2 - segment.z0,
      z1: opening.zCenter + opening.widthZ / 2 - segment.z0,
      y0: opening.y0,
      y1: opening.y1,
      id: opening.id,
    }));

    return holes.flatMap((hole) => {
      const holeWidth = hole.z1 - hole.z0;
      const holeHeight = hole.y1 - hole.y0;
      const clearWidth = Math.max(0.01, holeWidth - 2 * REVEAL_FACE);
      const leftZLocal = hole.z0 + REVEAL_FACE / 2 - widthZ / 2;
      const rightZLocal = hole.z1 - REVEAL_FACE / 2 - widthZ / 2;
      const midZLocal = (hole.z0 + hole.z1) / 2 - widthZ / 2;
      const topYLocal = hole.y1 - REVEAL_FACE / 2 - wallHeight / 2;
      const bottomYLocal = hole.y0 + REVEAL_FACE / 2 - wallHeight / 2;
      const midYLocal = (hole.y0 + hole.y1) / 2 - wallHeight / 2;
      const revealX = segment.x - REVEAL_DEPTH / 2 + PANEL_EPS;

      return [
        {
          geometry: new BoxGeometry(REVEAL_DEPTH, holeHeight, REVEAL_FACE),
          position: [revealX, panelCenterY + midYLocal, panelCenterZ + leftZLocal] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          material: REVEAL_MATERIAL,
          id: `${hole.id}-reveal-left`,
        },
        {
          geometry: new BoxGeometry(REVEAL_DEPTH, holeHeight, REVEAL_FACE),
          position: [revealX, panelCenterY + midYLocal, panelCenterZ + rightZLocal] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          material: REVEAL_MATERIAL,
          id: `${hole.id}-reveal-right`,
        },
        {
          geometry: new BoxGeometry(REVEAL_DEPTH, REVEAL_FACE, clearWidth),
          position: [revealX, panelCenterY + topYLocal, panelCenterZ + midZLocal] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          material: REVEAL_MATERIAL,
          id: `${hole.id}-reveal-top`,
        },
        {
          geometry: new BoxGeometry(REVEAL_DEPTH, REVEAL_FACE, clearWidth),
          position: [revealX, panelCenterY + bottomYLocal, panelCenterZ + midZLocal] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          material: REVEAL_MATERIAL,
          id: `${hole.id}-reveal-bottom`,
        },
      ];
    });
  });
}

function collectGroundHolesForSegment(segment: (typeof RIGHT_FACADE_SEGMENTS)[number], mirrorZ: (z: number) => number) {
  return sideWindowSpecs
    .map((spec) => {
      const zCenter = getSideWindowZCenter(spec, mirrorZ);
      const widthZ = spec.width;
      const y0 = spec.groundY0;
      const y1 = spec.groundY1;
      return { id: spec.id, zCenter, widthZ, y0, y1 };
    })
    .filter((opening) => {
      const halfWidth = opening.widthZ / 2;
      const z0 = opening.zCenter - halfWidth;
      const z1 = opening.zCenter + halfWidth;
      const overlaps = z1 > segment.z0 - EPSILON && z0 < segment.z1 + EPSILON;
      const tallEnough = opening.y1 - opening.y0 >= MIN_HOLE_H;
      const wideEnough = opening.widthZ >= MIN_HOLE_W;
      return overlaps && tallEnough && wideEnough;
    });
}

function makeFacadePanelWithHoles({
  width,
  height,
  holes,
  thickness,
}: {
  width: number;
  height: number;
  holes: { z0: number; z1: number; y0: number; y1: number }[];
  thickness: number;
}) {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, height);
  shape.lineTo(0, height);
  shape.closePath();

  holes.forEach((hole) => {
    const path = new Path();
    path.moveTo(hole.z0, hole.y0);
    path.lineTo(hole.z1, hole.y0);
    path.lineTo(hole.z1, hole.y1);
    path.lineTo(hole.z0, hole.y1);
    path.closePath();
    shape.holes.push(path);
  });

  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geometry.translate(-width / 2, -height / 2, -thickness / 2);
  geometry.rotateY(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}
