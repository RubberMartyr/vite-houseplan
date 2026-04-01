import type { XZ } from '../architecturalTypes';

const EPS = 1e-6;

export function openRing(ring: XZ[]): XZ[] {
  if (ring.length < 2) return ring;

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (Math.abs(first.x - last.x) < EPS && Math.abs(first.z - last.z) < EPS) {
    return ring.slice(0, -1);
  }

  return ring;
}

export function findEdgeIndexAtZ(ring: XZ[], zTarget: number, eps = EPS): number | null {
  const r = openRing(ring);

  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];

    if (Math.abs(a.z - zTarget) < eps && Math.abs(b.z - zTarget) < eps) {
      return i;
    }
  }

  return null;
}

export function findFacadeEdgeIndex(ring: XZ[], which: 'minZ' | 'maxZ'): number {
  const r = openRing(ring);

  if (r.length < 2) {
    throw new Error('findFacadeEdgeIndex: ring has fewer than 2 vertices');
  }

  const zs = r.map((point) => point.z);
  const zTarget = which === 'minZ' ? Math.min(...zs) : Math.max(...zs);
  const idx = findEdgeIndexAtZ(r, zTarget);

  if (idx == null) {
    throw new Error(`findFacadeEdgeIndex: No horizontal edge found at ${which} (z=${zTarget})`);
  }

  return idx;
}
