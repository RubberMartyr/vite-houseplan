import test from 'node:test';
import assert from 'node:assert/strict';
import { architecturalHouse, architecturalProperty } from '../architecturalHouse';
import { deriveHouse } from '../derive/deriveHouse';
import { deriveAuxiliaryStructures } from '../derive/deriveAuxiliaryStructures';
import {
  getLevelFootprints,
  getRenderableGeometrySummary,
  getSiteFootprint,
  isFinitePointXZ,
  isValidPolygon,
  normalizeViewerModel,
} from '../modelGeometry';

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

test('validates finite XZ points and polygons', () => {
  assert.equal(isFinitePointXZ({ x: 1, z: 2 }), true);
  assert.equal(isFinitePointXZ({ x: Number.NaN, z: 2 }), false);
  assert.equal(isValidPolygon(parcel), true);
  assert.equal(isValidPolygon(parcel.slice(0, 2)), false);
});

test('site-footprint-only model is renderable without building levels', () => {
  const model = { site: { footprint: { outer: parcel } }, levels: [], rooms: [], openings: [] };
  const summary = getRenderableGeometrySummary(model);
  assert.deepEqual(getSiteFootprint(model), parcel);
  assert.equal(summary.hasRenderableGeometry, true);
  assert.equal(summary.hasSiteFootprint, true);
  assert.equal(summary.mode, 'site-only');
  assert.equal(summary.errors.length, 0);
  assert.equal(getLevelFootprints(model).length, 0);
});

test('site-footprint-only normalized model keeps site extras explicitly empty', () => {
  const model = { site: { footprint: { outer: parcel } }, levels: [], rooms: [], openings: [] };
  const normalized = normalizeViewerModel(model);
  const derived = deriveHouse(normalized, { site: normalized.site });

  assert.deepEqual(normalized.site?.footprint.outer, parcel);
  assert.equal(normalized.site?.surfaces?.length, 0);
  assert.equal(normalized.site?.objects?.length, 0);
  assert.equal(normalized.site?.boundaries?.fences.length, 0);
  assert.equal(normalized.site?.boundaries?.hedges.length, 0);
  assert.equal(normalized.site?.boundaries?.gates.length, 0);
  assert.equal(derived.carports.length, 0);
});

test('full demo property exposes site extras only from explicit model data', () => {
  const normalized = normalizeViewerModel(architecturalProperty);
  const derived = deriveHouse(normalized, { site: normalized.site });

  assert.equal((normalized.site?.surfaces?.length ?? 0) > 0, true);
  assert.equal((normalized.site?.objects?.length ?? 0) > 0, true);
  assert.equal(normalized.site?.objects?.some((object) => object.type === 'carport'), true);
  assert.equal(derived.carports.length > 0, true);
});

test('site-parcel-only model is renderable without building levels', () => {
  const model = { site: { parcel: { outer: parcel } }, levels: [], rooms: [], openings: [] };
  const summary = getRenderableGeometrySummary(model);
  assert.deepEqual(getSiteFootprint(model), parcel);
  assert.equal(summary.hasRenderableGeometry, true);
  assert.equal(summary.mode, 'site-only');
  assert.equal(getLevelFootprints(model).length, 0);
});

test('house-only model remains renderable from level footprint', () => {
  const model = { wallThickness: 0.3, levels: [level()], rooms: [], openings: [] };
  const summary = getRenderableGeometrySummary(model);
  assert.equal(summary.hasRenderableGeometry, true);
  assert.equal(summary.levelFootprints.length, 1);
  assert.equal(summary.siteFootprint, null);
  assert.equal(summary.mode, 'house-only');
});

test('site plus house model exposes both renderable geometry sources', () => {
  const model = { site: { parcel: { outer: parcel } }, wallThickness: 0.3, levels: [level()], rooms: [], openings: [] };
  const summary = getRenderableGeometrySummary(model);
  assert.equal(summary.hasRenderableGeometry, true);
  assert.deepEqual(summary.siteFootprint, parcel);
  assert.equal(summary.levelFootprints.length, 1);
  assert.equal(summary.mode, 'site-and-house');
});

test('empty model does not crash and reports no renderable geometry', () => {
  const summary = getRenderableGeometrySummary({});
  assert.equal(summary.hasRenderableGeometry, false);
  assert.equal(summary.mode, 'empty');
  assert.deepEqual(summary.errors, ['No renderable geometry found.']);
  assert.deepEqual(summary.levelFootprints, []);
});

test('deriveHouse does not throw for partial site-only or empty models', () => {
  deriveHouse({ site: { footprint: { outer: parcel } }, levels: [], rooms: [], openings: [] });
  deriveHouse({});
});

test('deriveHouse still handles the existing full architectural house', () => {
  const derived = deriveHouse(architecturalHouse);
  assert.equal(derived.slabs.length > 0, true);
});

test('deriveAuxiliaryStructures skips a carport when no flat roof reference exists', () => {
  const carport = {
    id: 'carport-main',
    type: 'flat' as const,
    footprint: { outer: footprint },
    heightOffsetFromRoof: 0.2,
    thickness: 0.2,
    attachedTo: { side: 'front' as const },
    material: { roof: '#cccccc', columns: '#999999', underside: '#eeeeee' },
    columns: {
      spacing: 2,
      insetFromEdge: 0.1,
      size: 0.12,
      sides: { front: true, rear: true, houseSide: true, outerSide: true },
    },
  };

  assert.deepEqual(deriveAuxiliaryStructures({ ...architecturalHouse, auxiliary: [carport] }, { roofs: [] }), []);
});
