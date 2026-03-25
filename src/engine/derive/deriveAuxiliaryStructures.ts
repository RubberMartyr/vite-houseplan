import type { ArchitecturalHouse, CarportSpec, XZ } from '../architecturalTypes';
import type { DerivedRoof } from './types/DerivedRoof';
import type { DerivedSlab } from './deriveSlabs';
import type { DerivedCarport } from './types/DerivedCarport';

type DeriveAuxiliaryStructuresContext = {
  slabs: DerivedSlab[];
  roofs: DerivedRoof[];
};

type EdgeClass = 'front' | 'back' | 'houseSide' | 'outerSide';

type PolygonEdge = {
  start: XZ;
  end: XZ;
  kind: EdgeClass;
};

const EPSILON = 1e-6;

function uniquePoints(points: XZ[]): XZ[] {
  if (points.length < 2) return points;

  const first = points[0];
  const last = points[points.length - 1];
  if (Math.abs(first.x - last.x) < EPSILON && Math.abs(first.z - last.z) < EPSILON) {
    return points.slice(0, -1);
  }

  return points;
}

function findMainFlatRoof(roofs: DerivedRoof[]): DerivedRoof | null {
  const flatRoofs = roofs.filter((roof) => roof.kind === 'flat');
  if (flatRoofs.length === 0) return null;

  return flatRoofs.reduce((current, candidate) => {
    const currentElevation = current.baseLevel.elevation + current.baseLevel.height;
    const candidateElevation = candidate.baseLevel.elevation + candidate.baseLevel.height;

    if (candidateElevation > currentElevation) {
      return candidate;
    }

    return current;
  });
}

function deriveCarportElevation(carport: CarportSpec, roofs: DerivedRoof[]): number {
  const mainFlatRoof = findMainFlatRoof(roofs);
  if (!mainFlatRoof) {
    throw new Error(`Carport ${carport.id}: no flat roof available for elevation reference.`);
  }

  const mainRoofBaseElevation = mainFlatRoof.baseLevel.elevation + mainFlatRoof.baseLevel.height;
  return mainRoofBaseElevation + carport.heightOffsetFromRoof;
}

function classifyEdge(edge: { start: XZ; end: XZ }, minX: number, maxX: number, minZ: number, maxZ: number): EdgeClass | null {
  const meanX = (edge.start.x + edge.end.x) / 2;
  const meanZ = (edge.start.z + edge.end.z) / 2;

  if (Math.abs(meanZ - minZ) < EPSILON) return 'front';
  if (Math.abs(meanZ - maxZ) < EPSILON) return 'back';
  if (Math.abs(meanX - minX) < EPSILON) return 'houseSide';
  if (Math.abs(meanX - maxX) < EPSILON) return 'outerSide';

  return null;
}

function insetPoint(point: XZ, centroid: XZ, insetDistance: number): XZ {
  const dx = centroid.x - point.x;
  const dz = centroid.z - point.z;
  const length = Math.hypot(dx, dz);
  if (length < EPSILON) return point;

  return {
    x: point.x + (dx / length) * insetDistance,
    z: point.z + (dz / length) * insetDistance,
  };
}

function placeColumnsOnEdge(edge: PolygonEdge, spacing: number, insetDistance: number, centroid: XZ): XZ[] {
  const length = Math.hypot(edge.end.x - edge.start.x, edge.end.z - edge.start.z);
  if (length < EPSILON) {
    return [insetPoint(edge.start, centroid, insetDistance)];
  }

  const count = Math.max(1, Math.floor(length / spacing));
  const points: XZ[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = edge.start.x + (edge.end.x - edge.start.x) * t;
    const z = edge.start.z + (edge.end.z - edge.start.z) * t;
    points.push(insetPoint({ x, z }, centroid, insetDistance));
  }

  return points;
}

function dedupeColumns(columns: XZ[]): XZ[] {
  const map = new Map<string, XZ>();

  for (const column of columns) {
    const key = `${column.x.toFixed(4)}:${column.z.toFixed(4)}`;
    if (!map.has(key)) {
      map.set(key, column);
    }
  }

  return [...map.values()];
}

function deriveCarportColumns(carport: CarportSpec): XZ[] {
  const outer = uniquePoints(carport.footprint.outer);
  const xs = outer.map((point) => point.x);
  const zs = outer.map((point) => point.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const centroid: XZ = {
    x: xs.reduce((sum, value) => sum + value, 0) / xs.length,
    z: zs.reduce((sum, value) => sum + value, 0) / zs.length,
  };

  const edges: PolygonEdge[] = [];
  for (let index = 0; index < outer.length; index++) {
    const start = outer[index];
    const end = outer[(index + 1) % outer.length];
    const kind = classifyEdge({ start, end }, minX, maxX, minZ, maxZ);

    if (kind) {
      edges.push({ start, end, kind });
    }
  }

  const enabledSides: Record<EdgeClass, boolean> = {
    front: carport.columns.sides.front,
    back: carport.columns.sides.back,
    houseSide: carport.columns.sides.houseSide,
    outerSide: carport.columns.sides.outerSide,
  };

  const rawColumns = edges
    .filter((edge) => enabledSides[edge.kind])
    .flatMap((edge) =>
      placeColumnsOnEdge(edge, carport.columns.spacing, carport.columns.insetFromEdge, centroid)
    );

  return dedupeColumns(rawColumns);
}

export function deriveAuxiliaryStructures(
  arch: ArchitecturalHouse,
  context: DeriveAuxiliaryStructuresContext
): DerivedCarport[] {
  const { auxiliary = [] } = arch;
  const groundElevation = Math.min(...context.slabs.map((slab) => slab.elevationTop));

  return auxiliary.map((structure) => {
    const carportElevation = deriveCarportElevation(structure, context.roofs);
    const columns = deriveCarportColumns(structure).map((position) => ({
      position,
      height: Math.max(0, carportElevation - groundElevation),
      size: structure.columns.size,
    }));

    return {
      id: structure.id,
      roofPolygon: uniquePoints(structure.footprint.outer),
      elevation: carportElevation,
      thickness: structure.thickness,
      columns,
      material: structure.material,
    };
  });
}
