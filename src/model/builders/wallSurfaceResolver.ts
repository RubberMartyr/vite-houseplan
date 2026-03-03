import { getEnvelopeOuterPolygon } from '../envelope';

export function getOuterWallXAtZ(outward: 1 | -1, zQuery: number): number {
  const poly = getEnvelopeOuterPolygon();
  const xs: number[] = [];

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];

    const dx = Math.abs(b.x - a.x);
    const dz = Math.abs(b.z - a.z);

    if (dx > 1e-6) continue;
    if (dz < 1e-6) continue;

    const zMin = Math.min(a.z, b.z);
    const zMax = Math.max(a.z, b.z);

    if (zQuery < zMin || zQuery > zMax) continue;

    xs.push(a.x);
  }

  if (!xs.length) {
    console.error(`[wallSurfaceResolver] No vertical wall at z=${zQuery}`, {
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
  console.log('Envelope X:', xOuter);
  const xInner = xOuter - outward * thickness;
  return { xOuter, xInner };
}
