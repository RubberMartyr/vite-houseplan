import test from 'node:test';
import assert from 'node:assert/strict';
import { getParcelPolygon, getRenderableGeometrySummary, getValidLevelFootprints } from '../modelGeometry';

const parcel = [
  { x: 0, z: 0 },
  { x: 10, z: 0 },
  { x: 10, z: 20 },
  { x: 0, z: 20 },
];

const footprint = [
  { x: 2, z: 4 },
  { x: 8, z: 4 },
  { x: 8, z: 12 },
  { x: 2, z: 12 },
];

function level() {
  return {
    id: 'ground',
    name: 'Ground',
    elevation: 0,
    height: 2.8,
    slab: { thickness: 0.3, inset: 0 },
    footprint: { outer: footprint },
  };
}

test('parcel-only model is renderable without building levels', () => {
  const model = { site: { parcel: { outer: parcel } }, levels: [], rooms: [], openings: [] };
  const summary = getRenderableGeometrySummary(model);
  assert.deepEqual(getParcelPolygon(model), parcel);
  assert.equal(summary.hasRenderableGeometry, true);
  assert.equal(summary.errors.length, 0);
  assert.equal(getValidLevelFootprints(model).length, 0);
});

test('house-only model remains renderable from level footprint', () => {
  const model = { wallThickness: 0.3, levels: [level()], rooms: [], openings: [] };
  const summary = getRenderableGeometrySummary(model);
  assert.equal(summary.hasRenderableGeometry, true);
  assert.equal(summary.levelFootprints.length, 1);
  assert.equal(summary.parcel, null);
});

test('parcel plus house model exposes both renderable geometry sources', () => {
  const model = { site: { parcel: { outer: parcel } }, wallThickness: 0.3, levels: [level()], rooms: [], openings: [] };
  const summary = getRenderableGeometrySummary(model);
  assert.equal(summary.hasRenderableGeometry, true);
  assert.deepEqual(summary.parcel, parcel);
  assert.equal(summary.levelFootprints.length, 1);
});

test('empty model does not crash and reports no renderable geometry', () => {
  const summary = getRenderableGeometrySummary({});
  assert.equal(summary.hasRenderableGeometry, false);
  assert.deepEqual(summary.errors, ['No renderable geometry found.']);
  assert.deepEqual(summary.levelFootprints, []);
});
