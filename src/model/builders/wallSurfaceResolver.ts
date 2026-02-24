import { getEnvelopeOuterPolygon } from '../envelope';

export function getOuterWallXAtZ(outward: 1 | -1, zQuery: number): number {
  const z = zQuery;
  console.log('getOuterWallXAtZ', { outward, z });

  const poly = getEnvelopeOuterPolygon();

  const xs: number[] = [];

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];

    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin || zQuery > zMax) continue;

    if (Math.abs(a.z - b.z) < 1e-6) continue;

    const t = (zQuery - a.z) / (b.z - a.z);
    const x = a.x + t * (b.x - a.x);
    xs.push(x);
  }

  if (!xs.length) {
    console.error(`[wallSurfaceResolver] No wall intersection at z=${zQuery}`, {
      outward,
      zQuery,
      polygon: poly,
    });
    return 0;
  }

  return outward === 1 ? Math.max(...xs) : Math.min(...xs);
}

export function getWallPlanesAtZ(outward: 1 | -1, z: number, thickness: number) {
  const xOuter = getOuterWallXAtZ(outward, z);
  const xInner = xOuter - outward * thickness;
  return { xOuter, xInner };
}
