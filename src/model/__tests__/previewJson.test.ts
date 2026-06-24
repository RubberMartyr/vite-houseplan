import { getBaseSlabPolygon, getLevelFootprints, getParcelPolygon, getRenderableOpenings, getRenderableRooms, normalizeHouseViewerModel, validatePreviewJson } from '../normalizeHouseViewerModel';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const square = [
  { x: 0, z: 0 },
  { x: 4, z: 0 },
  { x: 4, z: 4 },
  { x: 0, z: 4 },
];

const empty = normalizeHouseViewerModel({});
assert(empty.levels.length === 0, 'empty JSON should not create levels');
assert(empty.diagnostics.info.length > 0, 'empty JSON should report info instead of throwing');

const parcelOnly = { site: { parcel: { outer: square } } };
assert(getParcelPolygon(parcelOnly)?.length === 4, 'parcel-only JSON should expose the parcel polygon');
assert(normalizeHouseViewerModel(parcelOnly).parcel?.outer.length === 4, 'parcel-only JSON should render the parcel');

const baseSlabOnly = { baseSlab: { outer: square } };
assert(getBaseSlabPolygon(baseSlabOnly)?.length === 4, 'baseSlab-only JSON should expose the base slab polygon');
assert(normalizeHouseViewerModel(baseSlabOnly).levels.length === 1, 'baseSlab-only JSON should render a slab level');

const levelOnly = { levels: [{ id: 'ground', footprint: { outer: square } }] };
assert(getLevelFootprints(levelOnly).length === 1, 'level-footprint-only JSON should expose level footprints');
assert(normalizeHouseViewerModel(levelOnly).levels[0].id === 'ground', 'level-footprint-only JSON should render the level');

const mixed = {
  ...levelOnly,
  rooms: [
    { id: 'valid-room', levelId: 'ground', polygon: square },
    { id: 'invalid-room', levelId: 'missing', polygon: square },
  ],
  openings: [
    { id: 'valid-opening', kind: 'window', levelId: 'ground', edge: { edgeIndex: 0 }, offset: 0.5, width: 1, sillHeight: 0.9, height: 1 },
    { id: 'invalid-opening', kind: 'window', levelId: 'ground', edge: { edgeIndex: 99 }, offset: 0.5, width: 1, sillHeight: 0.9, height: 1 },
  ],
};

assert(getRenderableRooms(mixed).length === 1, 'invalid rooms should be skipped');
assert(getRenderableOpenings(mixed).length === 1, 'openings with missing referenced edges should be skipped');

const validation = validatePreviewJson(mixed);
assert(validation.errors.length === 0, 'preview validation should not throw or emit hard errors for skippable preview data');
assert(validation.warnings.some((entry) => entry.path === 'rooms[1].levelId'), 'invalid rooms should produce warnings');
assert(validation.warnings.some((entry) => entry.path === 'openings[1].edge.edgeIndex'), 'invalid openings should produce warnings');
