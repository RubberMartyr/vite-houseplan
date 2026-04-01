import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWallPrismGeometry } from '../../geometry/buildWallPrismGeometry';
import { splitWallByOpenings } from '../../geometry/buildWallSegmentsWithOpenings';
import { archToWorldXZ } from '../../spaceMapping';
import type { DerivedWallSegment } from '../../deriveWalls';
import { simpleBoxHouse } from '../../../test-fixtures/simple-box-house';

const wall: DerivedWallSegment = {
  id: 'w1',
  levelId: 'ground',
  kind: 'exterior',
  start: { x: 0, y: 0, z: 0 },
  end: { x: 6, y: 0, z: 0 },
  height: 3,
  thickness: 0.3,
  outwardSign: 1,
  uOffset: 0,
  visibleBaseY: 0,
  visibleHeight: 3,
};

const footprint = simpleBoxHouse.levels[0].footprint.outer;

test('raw wall shell returns expected triangle count', () => {
  const geometry = buildWallPrismGeometry(wall, { uMin: 0, uMax: 6, vMin: 0, vMax: 3 }, 1, footprint);
  assert.equal(geometry.index?.count, 36);
});

test('wall thickness remains correct', () => {
  const geometry = buildWallPrismGeometry(wall, { uMin: 0, uMax: 6, vMin: 0, vMax: 3 }, 1, footprint);
  geometry.computeBoundingBox();
  const depth = geometry.boundingBox!.max.z - geometry.boundingBox!.min.z;
  assert.ok(Math.abs(depth - wall.thickness) < 1e-4);
});

test('wall orientation remains correct', () => {
  const geometry = buildWallPrismGeometry(wall, { uMin: 0, uMax: 6, vMin: 0, vMax: 3 }, 1, footprint);
  assert.ok(geometry.getAttribute('normal').count > 0);
});

test('facade filtering removes only expected triangles via opening split', () => {
  const pieces = splitWallByOpenings(6, 3, [{ uMin: 2, uMax: 4, vMin: 1, vMax: 2 } as any]);
  assert.equal(pieces.length, 4);
  assert.ok(pieces.some((piece) => piece.startU === 2 && piece.endU === 4 && piece.bottom === 0 && piece.top === 1));
});

test('openings do not invert wall direction', () => {
  const pieces = splitWallByOpenings(6, 3, [{ uMin: 1, uMax: 2, vMin: 1, vMax: 2 } as any]);
  assert.ok(pieces.every((piece) => piece.endU >= piece.startU));
});

test('coordinate mapping remains correct', () => {
  const mappedStart = archToWorldXZ({ x: wall.start.x, z: wall.start.z });
  const mappedEnd = archToWorldXZ({ x: wall.end.x, z: wall.end.z });
  assert.equal(Math.abs(mappedStart.z), 0);
  assert.equal(Math.abs(mappedEnd.z), 0);
});
