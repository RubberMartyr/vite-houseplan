import { getEnvelopeOuterPolygon } from '../envelope';
import { runtimeFlags } from '../runtimeFlags';

const isWallDebugEnabled = () => runtimeFlags.debugWindows || import.meta.env.DEV;

type XZ = { x: number; z: number };

const EPS_Z = 1e-6;
const DEBUG_WALL_X = true;
const DEBUG_WALL_X_ONLY_OUTWARD: 1 | -1 | null = null;
const DEBUG_WALL_X_SAMPLE_LIMIT = 50;

function isDiagonalEdge(a: XZ, b: XZ) {
  const dx = Math.abs(a.x - b.x);
  const dz = Math.abs(a.z - b.z);
  return dx > 1e-6 && dz > 1e-6;
}

export function debugDumpEnvelopeEdges() {
  const poly = getEnvelopeOuterPolygon() as XZ[];

  const diag: Array<{ i: number; a: XZ; b: XZ; dx: number; dz: number }> = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = Math.abs(a.x - b.x);
    const dz = Math.abs(a.z - b.z);
    if (dx > 1e-6 && dz > 1e-6) diag.push({ i, a, b, dx, dz });
  }

  console.log('[wallSurfaceResolver] Envelope vertices:', poly);
  console.log('[wallSurfaceResolver] Diagonal edges:', diag);
}


export function debugWallIntersectionsAtZ(zQuery: number) {
  const poly = getEnvelopeOuterPolygon();
  const hits: { x: number; a: { x: number; z: number }; b: { x: number; z: number } }[] = [];

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];

    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin || zQuery > zMax) continue;
    if (Math.abs(a.z - b.z) < 1e-6) continue;

    const t = (zQuery - a.z) / (b.z - a.z);
    const x = a.x + t * (b.x - a.x);
    hits.push({ x, a: { x: a.x, z: a.z }, b: { x: b.x, z: b.z } });
  }

  hits.sort((p, q) => p.x - q.x);

  console.log('[debugWallIntersectionsAtZ]', {
    zQuery,
    hitCount: hits.length,
    xs: hits.map((h) => h.x),
    hits,
  });

  return hits;
}

export function getOuterWallHitAtZ(outward: 1 | -1, zQuery: number): {
  xOuter: number;
  tangentXZ: { x: number; z: number };
} {
  const poly = getEnvelopeOuterPolygon();

  const hits: Array<{
    x: number;
    ax: number; az: number;
    bx: number; bz: number;
  }> = [];

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];

    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin || zQuery > zMax) continue;
    if (Math.abs(a.z - b.z) < 1e-6) continue;

    const t = (zQuery - a.z) / (b.z - a.z);
    const x = a.x + t * (b.x - a.x);

    hits.push({ x, ax: a.x, az: a.z, bx: b.x, bz: b.z });
  }

  if (!hits.length) {
    console.error(`[wallSurfaceResolver] No wall intersection at z=${zQuery}`, {
      outward,
      zQuery,
      polygon: poly,
    });
    return { xOuter: 0, tangentXZ: { x: 0, z: 1 } };
  }

  const pick = outward === 1
    ? hits.reduce((best, h) => (h.x > best.x ? h : best), hits[0])
    : hits.reduce((best, h) => (h.x < best.x ? h : best), hits[0]);

  let tx = pick.bx - pick.ax;
  let tz = pick.bz - pick.az;
  const len = Math.hypot(tx, tz) || 1;
  tx /= len;
  tz /= len;

  return { xOuter: pick.x, tangentXZ: { x: tx, z: tz } };
}

export function getOuterWallXAtZ(outward: 1 | -1, zQuery: number): number {
  const poly = getEnvelopeOuterPolygon() as XZ[];

  const candidates: Array<{
    edgeIndex: number;
    a: XZ;
    b: XZ;
    t: number;
    x: number;
  }> = [];

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];

    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin - EPS_Z || zQuery > zMax + EPS_Z) continue;
    if (Math.abs(a.z - b.z) < EPS_Z) continue;

    const t = (zQuery - a.z) / (b.z - a.z);
    if (t < -1e-4 || t > 1 + 1e-4) continue;

    const x = a.x + t * (b.x - a.x);
    candidates.push({ edgeIndex: i, a, b, t, x });
  }

  if (!candidates.length) {
    console.error(`[wallSurfaceResolver] No wall intersection at z=${zQuery}`, {
      outward,
      zQuery,
      polygon: poly,
    });
    return 0;
  }

  const chosen =
    outward === 1
      ? candidates.reduce((best, c) => (c.x > best.x ? c : best), candidates[0])
      : candidates.reduce((best, c) => (c.x < best.x ? c : best), candidates[0]);

  if (DEBUG_WALL_X && (DEBUG_WALL_X_ONLY_OUTWARD === null || outward === DEBUG_WALL_X_ONLY_OUTWARD)) {
    const zKey = Math.round(zQuery * 100) / 100;

    const sorted = [...candidates].sort((p, q) => p.x - q.x);
    const short =
      sorted.length > DEBUG_WALL_X_SAMPLE_LIMIT
        ? [...sorted.slice(0, 8), { edgeIndex: -999, a: { x: 0, z: 0 }, b: { x: 0, z: 0 }, t: 0, x: Number.NaN }, ...sorted.slice(-8)]
        : sorted;

    console.groupCollapsed(
      `[wallSurfaceResolver] getOuterWallXAtZ outward=${outward} z=${zKey} candidates=${candidates.length} chosenEdge=${chosen.edgeIndex} x=${chosen.x.toFixed(4)}`
    );

    console.log('CHOSEN EDGE', {
      edgeIndex: chosen.edgeIndex,
      x: chosen.x,
      t: chosen.t,
      a: chosen.a,
      b: chosen.b,
      diagonal: isDiagonalEdge(chosen.a, chosen.b),
    });

    console.log(
      'CANDIDATES (sorted by x)',
      short.map((c) => ({
        edge: c.edgeIndex,
        x: Number.isNaN(c.x) ? '...' : +c.x.toFixed(4),
        t: Number.isNaN(c.t) ? '...' : +c.t.toFixed(4),
        a: c.a,
        b: c.b,
        diagonal: c.edgeIndex < 0 ? '...' : isDiagonalEdge(c.a, c.b),
      }))
    );

    console.groupEnd();
  }

  return chosen.x;
}

export function getWallPlanesAtZ(outward: 1 | -1, z: number, thickness: number) {
  const hit = getOuterWallHitAtZ(outward, z);
  const xOuter = hit.xOuter;
  if (isWallDebugEnabled()) {
    console.log('[WALL RESOLVE] envelopeX:', xOuter);
  }
  const xInner = xOuter - outward * thickness;
  return { xOuter, xInner, tangentXZ: hit.tangentXZ };
}
