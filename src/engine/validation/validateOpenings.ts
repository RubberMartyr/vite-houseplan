import type { ArchitecturalHouse } from '../architecturalTypes';

const EPS = 1e-6;
const MIN_OPENING_DIMENSION = 0.05;

export function validateOpenings(house: ArchitecturalHouse) {
  const levelById = new Map(house.levels.map((lvl, idx) => [lvl.id, { lvl, idx }]));

  for (const op of house.openings ?? []) {
    const rec = levelById.get(op.levelId);
    if (!rec) {
      throw new Error(`Opening ${op.id}: invalid levelId ${op.levelId}`);
    }

    const { lvl } = rec;
    if (!lvl.footprint?.outer?.length) {
      throw new Error(`Opening ${op.id}: level has no footprint.outer`);
    }

    if (op.edge.levelId !== op.levelId) {
      throw new Error(
        `Opening ${op.id}: edge.levelId (${op.edge.levelId}) must match opening.levelId (${op.levelId})`
      );
    }

    if (op.width <= 0 || op.height <= 0) {
      throw new Error(`Opening ${op.id}: width/height must be > 0`);
    }

    if (op.width < MIN_OPENING_DIMENSION || op.height < MIN_OPENING_DIMENSION) {
      throw new Error(
        `Opening ${op.id}: width/height must be >= ${MIN_OPENING_DIMENSION}m (got width=${op.width}, height=${op.height})`
      );
    }

    if (op.sillHeight < -EPS) {
      throw new Error(`Opening ${op.id}: sillHeight must be >= 0`);
    }

    if (op.sillHeight + op.height > lvl.height + EPS) {
      throw new Error(`Opening ${op.id}: exceeds wall height (sill+height > level.height)`);
    }

    const outer = lvl.footprint.outer;
    const n = outer.length;
    const edgeIndex = op.edge.edgeIndex;
    if (edgeIndex < 0 || edgeIndex >= n) {
      throw new Error(`Opening ${op.id}: invalid edgeIndex ${edgeIndex}`);
    }

    const a = outer[edgeIndex];
    const b = outer[(edgeIndex + 1) % n];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dz * dz);

    if (len < EPS) {
      throw new Error(`Opening ${op.id}: edge length too small`);
    }

    if (op.offset < -EPS) {
      throw new Error(`Opening ${op.id}: offset must be >= 0`);
    }

    if (op.offset + op.width > len + EPS) {
      throw new Error(`Opening ${op.id}: offset+width exceeds edge length`);
    }
  }
}
