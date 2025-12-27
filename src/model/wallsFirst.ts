import { BoxGeometry, ExtrudeGeometry, MeshStandardMaterial, Path, Shape } from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeInnerPolygon } from './envelope';
import { ceilingHeights, levelHeights, wallThickness } from './houseSpec';
import {
  getSideWindowZCenter,
  makeMirrorZ,
  RIGHT_FACADE_SEGMENTS,
  sideWindowSpecs,
  sideZMax,
  sideZMin,
} from './windowsSide';

const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;
const firstFloorLevel = levelHeights.firstFloor;
const FACADE_PANEL_THICKNESS = 0.025;
const EPSILON = 0.01;
const MIN_HOLE_W = 0.05;
const MIN_HOLE_H = 0.05;
const PANEL_EPS = 0.002;
const REVEAL_FACE = 0.05;
const REVEAL_DEPTH = exteriorThickness;
const REVEAL_MATERIAL = new MeshStandardMaterial({ color: '#e8e5df', roughness: 0.85, metalness: 0.05 });
const mirrorZ = makeMirrorZ(sideZMin, sideZMax);

type SegmentId = (typeof RIGHT_FACADE_SEGMENTS)[number]['id'];
type Opening = { id: string; zCenter: number; widthZ: number; y0: number; y1: number };

export const wallsFirst = {
  shell: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);
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

    return {
      geometry,
      position: [0, firstFloorLevel, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),

  rearFacade: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
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

    const yMinLocal = 0.8;
    const yMaxLocal = 2.4;
    const firstWindowStart = leftX + 1.7;
    const openings = [
      toLocalRect({
        xMin: firstWindowStart,
        xMax: firstWindowStart + 1.1,
        yMin: yMinLocal,
        yMax: yMaxLocal,
      }),
      toLocalRect({
        xMin: firstWindowStart + 1.1 + 2.0,
        xMax: firstWindowStart + 1.1 + 2.0 + 1.1,
        yMin: yMinLocal,
        yMax: yMaxLocal,
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
      position: [panelCenterX, firstFloorLevel + panelHeight / 2, rearZ - panelDepth / 2] as [number, number, number],
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
    const holes = collectFirstHolesForSegment(segment, mirrorZ).map((opening) => ({
      z0: opening.zCenter - opening.widthZ / 2 - segment.z0,
      z1: opening.zCenter + opening.widthZ / 2 - segment.z0,
      y0: opening.y0,
      y1: opening.y1,
      id: opening.id,
    }));

    holes.forEach((hole) => {
      console.log('✅ SIDE PANEL HOLE (first)', {
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

    console.log('✅ SIDE PANEL SEGMENT (first)', segment.id, {
      z0: segment.z0,
      z1: segment.z1,
      xFace: segment.x,
      holes: holes.length,
    });

    return {
      geometry: panelGeometry,
      position: [
        segment.x + PANEL_EPS - FACADE_PANEL_THICKNESS / 2,
        firstFloorLevel + wallHeight / 2,
        panelCenterZ,
      ] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  });
}

function makeRightFacadeReveals(mirrorZ: (z: number) => number) {
  return RIGHT_FACADE_SEGMENTS.flatMap((segment) => {
    const widthZ = segment.z1 - segment.z0;
    const panelCenterZ = (segment.z0 + segment.z1) / 2;
    const panelCenterY = firstFloorLevel + wallHeight / 2;
    const holes = collectFirstHolesForSegment(segment, mirrorZ).map((opening) => ({
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
          id: `${hole.id}-reveal-left-first`,
        },
        {
          geometry: new BoxGeometry(REVEAL_DEPTH, holeHeight, REVEAL_FACE),
          position: [revealX, panelCenterY + midYLocal, panelCenterZ + rightZLocal] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          material: REVEAL_MATERIAL,
          id: `${hole.id}-reveal-right-first`,
        },
        {
          geometry: new BoxGeometry(REVEAL_DEPTH, REVEAL_FACE, clearWidth),
          position: [revealX, panelCenterY + topYLocal, panelCenterZ + midZLocal] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          material: REVEAL_MATERIAL,
          id: `${hole.id}-reveal-top-first`,
        },
        {
          geometry: new BoxGeometry(REVEAL_DEPTH, REVEAL_FACE, clearWidth),
          position: [revealX, panelCenterY + bottomYLocal, panelCenterZ + midZLocal] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          material: REVEAL_MATERIAL,
          id: `${hole.id}-reveal-bottom-first`,
        },
      ];
    });
  });
}

function collectFirstHolesForSegment(segment: (typeof RIGHT_FACADE_SEGMENTS)[number], mirrorZ: (z: number) => number) {
  return sideWindowSpecs
    .filter((spec) => spec.firstY1 - spec.firstY0 > MIN_HOLE_H)
    .map((spec) => {
      const zCenter = getSideWindowZCenter(spec, mirrorZ);
      const widthZ = spec.width;
      const isTall = spec.kind === 'tall' || spec.type === 'tall';
      const y0 = isTall ? 0 : spec.firstY0 - firstFloorLevel;
      const y1 = isTall ? wallHeight : spec.firstY1 - firstFloorLevel;
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
