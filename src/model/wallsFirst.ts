import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape } from 'three';
import { getEnvelopeFirstOuterPolygon, getEnvelopeInnerPolygon } from './envelope';
import { ceilingHeights, levelHeights, wallThickness } from './houseSpec';

const wallHeight = ceilingHeights.first;
const exteriorThickness = wallThickness.exterior;
const firstFloorLevel = levelHeights.firstFloor;
const EPSILON = 1e-4;

export const wallsFirst = {
  shell: (() => {
    const outer = getEnvelopeFirstOuterPolygon();
    const inner = getEnvelopeInnerPolygon(exteriorThickness, outer);
    const rearZ = outer.reduce((max, point) => Math.max(max, point.z), -Infinity);

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

    const removeRearFaces = (geom: BufferGeometry, rearFaceZ: number) => {
      const nonIndexed = geom.toNonIndexed();
      const position = nonIndexed.getAttribute('position');
      const normal = nonIndexed.getAttribute('normal');
      const uv = nonIndexed.getAttribute('uv');

      const keptPositions: number[] = [];
      const keptNormals: number[] = [];
      const keptUvs: number[] = [];

      const triangleCount = position.count / 3;

      for (let tri = 0; tri < triangleCount; tri += 1) {
        const baseIndex = tri * 3;
        const indices = [baseIndex, baseIndex + 1, baseIndex + 2];
        const zValues = indices.map((index) => position.getZ(index));
        const isRearFace = zValues.every((z) => Math.abs(z - rearFaceZ) < EPSILON);

        if (isRearFace) {
          continue;
        }

        indices.forEach((index) => {
          keptPositions.push(position.getX(index), position.getY(index), position.getZ(index));

          if (normal) {
            keptNormals.push(normal.getX(index), normal.getY(index), normal.getZ(index));
          }

          if (uv) {
            keptUvs.push(uv.getX(index), uv.getY(index));
          }
        });
      }

      const filtered = new BufferGeometry();
      filtered.setAttribute('position', new Float32BufferAttribute(keptPositions, 3));

      if (keptNormals.length > 0) {
        filtered.setAttribute('normal', new Float32BufferAttribute(keptNormals, 3));
      }

      if (keptUvs.length > 0) {
        filtered.setAttribute('uv', new Float32BufferAttribute(keptUvs, 2));
      }

      filtered.computeVertexNormals();

      return filtered;
    };

    const filteredGeometry = removeRearFaces(geometry, rearZ);

    return {
      geometry: filteredGeometry,
      position: [0, firstFloorLevel, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    };
  })(),
};
