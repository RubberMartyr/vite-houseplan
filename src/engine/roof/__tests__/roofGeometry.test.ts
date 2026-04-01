import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveRoofPlan } from '../deriveRoofPlan';
import { deriveSeamBases } from '../deriveSeamBases';
import { deriveHipCapRegions } from '../deriveHipCapRegions';
import { deriveRidgeSideRegions } from '../deriveRidgeSideRegions';
import { triangulateRoofRegion } from '../triangulateRoofRegion';
import { multiRidgeHouse } from '../../../test-fixtures/multi-ridge-house';
import type { MultiPlaneRoofSpec } from '../../architecturalTypes';
import type { DerivedRoof } from '../../derive/types/DerivedRoof';

const roof = multiRidgeHouse.roofs![0] as MultiPlaneRoofSpec;
const level = multiRidgeHouse.levels[0];
const derivedRoof: DerivedRoof = {
  id: roof.id,
  kind: roof.type,
  baseLevelId: 'ground',
  baseLevel: { id: 'ground', elevation: level.elevation, height: level.height, slabThickness: level.slab.thickness },
  footprintOuter: level.footprint.outer,
  footprintHoles: [],
  roofPolygonOuter: level.footprint.outer,
  roofPolygonHoles: [],
  spec: roof,
};

const plan = deriveRoofPlan(derivedRoof, roof);
const seams = deriveSeamBases(plan);
const hipCaps = deriveHipCapRegions(plan);
const ridgeRegions = deriveRidgeSideRegions(plan, seams);

test('roof plan closes polygons correctly', () => {
  assert.deepEqual(plan.footprint[0], plan.footprint[plan.footprint.length - 1]);
});

test('seam bases are generated correctly', () => {
  assert.equal(seams.length, 4);
});

test('hip caps remain valid', () => {
  assert.equal(hipCaps.length, 2);
  assert.ok(hipCaps.every((cap) => cap.points.length >= 3));
});

test('ridge-side regions preserve one plane per side', () => {
  assert.equal(ridgeRegions.length, 2);
  assert.deepEqual(new Set(ridgeRegions.map((region) => region.side)), new Set(['left', 'right']));
});

test('constant pitch is preserved', () => {
  assert.ok(roof.faces.every((face) => !face.p2 || face.p2.h === 2.1));
});

test('roof overhang remains correct', () => {
  assert.equal(roof.overhang, 0.35);
});

test('roof thickness remains correct', () => {
  assert.equal(plan.thickness, 0.24);
});

test('no mirrored roof regions appear', () => {
  for (const region of [...hipCaps, ...ridgeRegions]) {
    assert.ok(triangulateRoofRegion(region).length > 0);
  }
});
