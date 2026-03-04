import { getEnvelopeOuterPolygon } from '../envelope';
import { runtimeFlags } from '../runtimeFlags';

const isWallDebugEnabled = () => runtimeFlags.debugWindows || import.meta.env.DEV;

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
  const poly = getEnvelopeOuterPolygon();
  const xs: number[] = [];

  if (isWallDebugEnabled()) {
    console.log('[WALL RESOLVE] zQuery:', zQuery);
    console.log('[WALL RESOLVE] outward:', outward);
  }

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];

    if (isWallDebugEnabled()) {
      console.log('[WALL RESOLVE] segment:', {
        index: i,
        a,
        b,
      });
    }

    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin || zQuery > zMax) continue;
    if (Math.abs(a.z - b.z) < 1e-6) continue;

    const t = (zQuery - a.z) / (b.z - a.z);
    const x = a.x + t * (b.x - a.x);
    xs.push(x);

    if (isWallDebugEnabled()) {
      console.log('[WALL RESOLVE] intersectionX:', x);
    }
  }

  if (!xs.length) {
    if (isWallDebugEnabled()) {
      console.log('[WALL RESOLVE] xsCandidates:', xs);
      console.log('[WALL RESOLVE] chosenX:', 0);
    }
    return 0;
  }

  const chosenX = outward === 1 ? Math.max(...xs) : Math.min(...xs);

  if (isWallDebugEnabled()) {
    console.log('[WALL RESOLVE] xsCandidates:', xs);
    console.log('[WALL RESOLVE] chosenX:', chosenX);
  }

  return chosenX;
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
