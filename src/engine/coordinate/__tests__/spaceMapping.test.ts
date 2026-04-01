import test from 'node:test';
import assert from 'node:assert/strict';
import { archArrayToWorld, archPointToWorldVec3, archToWorldVec3, archToWorldXZ } from '../../spaceMapping';

test('architectural origin maps correctly', () => {
  const origin = archToWorldXZ({ x: 0, z: 0 });
  assert.equal(origin.x, 0);
  assert.equal(Math.abs(origin.z), 0);
});

test('positive architectural Z maps consistently to world direction', () => {
  assert.deepEqual(archToWorldXZ({ x: 2, z: 5 }), { x: 2, z: -5 });
});

test('archToWorldXZ always produces expected values', () => {
  const input = { x: -3.5, z: 1.25 };
  assert.deepEqual(archToWorldXZ(input), archToWorldXZ(input));
});

test('archToWorldVec3 preserves height correctly', () => {
  const world = archToWorldVec3(1, 7.2, 4);
  assert.equal(world.y, 7.2);
  assert.equal(world.z, -4);
});

test('no mirrored front/back orientation appears', () => {
  const mapped = archArrayToWorld([{ x: 0, z: 1 }, { x: 0, z: 2 }]);
  assert.ok(mapped[0].z > mapped[1].z);
});

test('round-trip conversion remains stable across vector helpers', () => {
  const a = archToWorldVec3(3, 2, -6);
  const b = archPointToWorldVec3({ x: 3, y: 2, z: -6 });
  assert.deepEqual(a.toArray(), b.toArray());
});
