import * as THREE from 'three';
import { FootprintPoint, getEnvelopeFirstOuterPolygon } from './envelope';

const EAVES_Y = 5.7;
const RIDGE_Y = 9.85;
const THICKNESS = 0.2;

function computeBounds(points: FootprintPoint[]) {
  return points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minZ: Math.min(acc.minZ, point.z),
      maxZ: Math.max(acc.maxZ, point.z),
    }),
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  );
}

function createRoofSide(
  xCenter: number,
  zStart: number,
  yStart: number,
  zEnd: number,
  yEnd: number,
  widthX: number
): { geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] } {
  const length = zEnd - zStart;
  const angle = Math.atan2(yEnd - yStart, length);

  const geometry = new THREE.BoxGeometry(widthX, THICKNESS, Math.abs(length));
  geometry.translate(0, THICKNESS / 2, 0);

  const centerY = (yStart + yEnd) / 2;
  const centerZ = (zStart + zEnd) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const position: [number, number, number] = [
    xCenter,
    centerY + (cos * THICKNESS) / 2,
    centerZ - (sin * THICKNESS) / 2,
  ];

  return {
    geometry,
    position,
    rotation: [-angle, 0, 0],
  };
}

function createRidgeLine(xMin: number, xMax: number, y: number, z: number): THREE.BufferGeometry {
  const points = [new THREE.Vector3(xMin, y, z), new THREE.Vector3(xMax, y, z)];
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function buildRoofMeshes(): {
  meshes: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number]; rotation: [number, number, number] }>;
  ridgeLines: Array<{ geometry: THREE.BufferGeometry; position: [number, number, number] }>;
} {
  const footprint = getEnvelopeFirstOuterPolygon();
  const bounds = computeBounds(footprint);

  const frontZ = bounds.minZ;
  const backZ = bounds.maxZ;
  const ridgeZ = (frontZ + backZ) / 2;
  const midX = (bounds.minX + bounds.maxX) / 2;
  const widthX = bounds.maxX - bounds.minX;

  const sideA = createRoofSide(midX, frontZ, EAVES_Y, ridgeZ, RIDGE_Y, widthX);
  const sideB = createRoofSide(midX, ridgeZ, RIDGE_Y, backZ, EAVES_Y, widthX);

  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(frontZ, EAVES_Y);
  triangleShape.lineTo(ridgeZ, RIDGE_Y);
  triangleShape.lineTo(backZ, EAVES_Y);
  triangleShape.lineTo(frontZ, EAVES_Y);

  const gableGeometry = new THREE.ShapeGeometry(triangleShape);

  const meshes = [
    sideA,
    sideB,
    {
      geometry: gableGeometry,
      position: [bounds.minX, 0, 0],
      rotation: [0, Math.PI / 2, 0],
    },
    {
      geometry: gableGeometry,
      position: [bounds.maxX, 0, 0],
      rotation: [0, -Math.PI / 2, 0],
    },
  ];

  const ridgeLines = [
    {
      geometry: createRidgeLine(bounds.minX, bounds.maxX, RIDGE_Y, ridgeZ),
      position: [0, 0, 0] as [number, number, number],
    },
  ];

  return { meshes, ridgeLines };
}
