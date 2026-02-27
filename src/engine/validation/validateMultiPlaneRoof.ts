import type { FaceRegion, HalfPlane, MultiPlaneRoofSpec, RoofFaceSpec, XZ } from '../types';

const EPS = 1e-6;

export type RoofValidationMessage = {
  code:
    | 'RIDGE_ZERO_LENGTH'
    | 'RIDGE_DUPLICATE_ID'
    | 'RIDGE_HEIGHT_INVALID'
    | 'FACE_MISSING_RIDGE'
    | 'FACE_RIDGE_RANGE_ORDER'
    | 'FACE_RIDGE_RANGE_BOUNDS'
    | 'FACE_INVALID_REGION'
    | 'FACE_CAP_END_INVALID'
    | 'FACE_SUSPICIOUS_RIDGE_RANGE';
  message: string;
  roofId: string;
  ridgeId?: string;
  faceId?: string;
};

export type MultiPlaneRoofValidationResult = {
  errors: RoofValidationMessage[];
  warnings: RoofValidationMessage[];
  debug: {
    invalidRidges: MultiPlaneRoofSpec['ridgeSegments'];
    invalidFaces: RoofFaceSpec[];
    suspiciousFaces: RoofFaceSpec[];
  };
};

function signedSide(p: XZ, a: XZ, b: XZ): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = p.x - a.x;
  const apz = p.z - a.z;
  return apx * abz - apz * abx;
}

function intersectSegmentWithLine(p: XZ, q: XZ, a: XZ, b: XZ): XZ | null {
  const r = { x: q.x - p.x, z: q.z - p.z };
  const s = { x: b.x - a.x, z: b.z - a.z };
  const denom = r.x * s.z - r.z * s.x;
  if (Math.abs(denom) < EPS) return null;

  const ap = { x: a.x - p.x, z: a.z - p.z };
  const t = (ap.x * s.z - ap.z * s.x) / denom;
  if (t < -EPS || t > 1 + EPS) return null;

  return { x: p.x + t * r.x, z: p.z + t * r.z };
}

function clipPolyByHalfPlane(poly: XZ[], hp: HalfPlane): XZ[] {
  const inside = (p: XZ) => {
    const s = signedSide(p, hp.a, hp.b);
    return hp.keep === 'left' ? s >= -EPS : s <= EPS;
  };

  const out: XZ[] = [];
  const closed = [...poly, poly[0]];

  for (let i = 0; i < closed.length - 1; i += 1) {
    const p = closed[i];
    const q = closed[i + 1];
    const pin = inside(p);
    const qin = inside(q);

    if (pin && qin) {
      out.push(q);
    } else if (pin && !qin) {
      const hit = intersectSegmentWithLine(p, q, hp.a, hp.b);
      if (hit) out.push(hit);
    } else if (!pin && qin) {
      const hit = intersectSegmentWithLine(p, q, hp.a, hp.b);
      if (hit) out.push(hit);
      out.push(q);
    }
  }

  if (out.length < 3) return out;

  const deduped: XZ[] = [];
  for (const point of out) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.abs(prev.x - point.x) > EPS || Math.abs(prev.z - point.z) > EPS) {
      deduped.push(point);
    }
  }

  return deduped;
}

function ridgePointAt(ridge: { start: XZ; end: XZ }, t: number): XZ {
  return {
    x: ridge.start.x + (ridge.end.x - ridge.start.x) * t,
    z: ridge.start.z + (ridge.end.z - ridge.start.z) * t,
  };
}

function ridgePerpCutToHalfPlane(ridge: { start: XZ; end: XZ }, t: number, keep: 'ahead' | 'behind'): HalfPlane {
  const e = ridgePointAt(ridge, t);

  const dx = ridge.end.x - ridge.start.x;
  const dz = ridge.end.z - ridge.start.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;

  const ux = dx / len;
  const uz = dz / len;
  const nx = -uz;
  const nz = ux;

  const a = { x: e.x - nx * 1000, z: e.z - nz * 1000 };
  const b = { x: e.x + nx * 1000, z: e.z + nz * 1000 };

  const test = { x: e.x + ux * 0.01, z: e.z + uz * 0.01 };
  const s = signedSide(test, a, b);
  const keepAhead: 'left' | 'right' = s >= 0 ? 'left' : 'right';

  if (keep === 'ahead') return { a, b, keep: keepAhead };
  return { a, b, keep: keepAhead === 'left' ? 'right' : 'left' };
}

function resolveFaceRegionToHalfPlanes(region: FaceRegion, roof: MultiPlaneRoofSpec): HalfPlane[] | null {
  if (region.type === 'halfPlanes') return region.planes;
  if (region.type !== 'compound') return null;

  const halfPlanes: HalfPlane[] = [];
  for (const item of region.items) {
    if ('type' in item && item.type === 'ridgePerpCut') {
      const ridge = roof.ridgeSegments.find((r) => r.id === item.ridgeId);
      if (!ridge) return null;
      halfPlanes.push(ridgePerpCutToHalfPlane(ridge, item.t, item.keep));
      continue;
    }

    halfPlanes.push(item as HalfPlane);
  }

  return halfPlanes;
}

function faceRegionProducesClip(face: RoofFaceSpec, roof: MultiPlaneRoofSpec): boolean {
  if (face.region.type === 'ridgeCapTriangle') {
    const ridgeId = face.region.ridgeId;
    const ridge = roof.ridgeSegments.find((r) => r.id === ridgeId);
    return Boolean(ridge);
  }

  const halfPlanes = resolveFaceRegionToHalfPlanes(face.region, roof);
  if (!halfPlanes) return false;

  let poly: XZ[] = [
    { x: -1000, z: -1000 },
    { x: 1000, z: -1000 },
    { x: 1000, z: 1000 },
    { x: -1000, z: 1000 },
  ];

  for (const hp of halfPlanes) {
    poly = clipPolyByHalfPlane(poly, hp);
    if (poly.length < 3) return false;
  }

  return poly.length >= 3;
}

export function validateMultiPlaneRoof(roof: MultiPlaneRoofSpec): MultiPlaneRoofValidationResult {
  const errors: RoofValidationMessage[] = [];
  const warnings: RoofValidationMessage[] = [];
  const invalidRidges: MultiPlaneRoofSpec['ridgeSegments'] = [];
  const invalidFaces: RoofFaceSpec[] = [];
  const suspiciousFaces: RoofFaceSpec[] = [];

  const ridgeIdSet = new Set<string>();

  for (const ridge of roof.ridgeSegments) {
    const dx = ridge.end.x - ridge.start.x;
    const dz = ridge.end.z - ridge.start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    let invalid = false;

    if (ridgeIdSet.has(ridge.id)) {
      invalid = true;
      errors.push({
        code: 'RIDGE_DUPLICATE_ID',
        message: `Ridge '${ridge.id}' is duplicated.`,
        roofId: roof.id,
        ridgeId: ridge.id,
      });
    }
    ridgeIdSet.add(ridge.id);

    if (length <= EPS) {
      invalid = true;
      errors.push({
        code: 'RIDGE_ZERO_LENGTH',
        message: `Ridge '${ridge.id}' has zero/near-zero length.`,
        roofId: roof.id,
        ridgeId: ridge.id,
      });
    }

    if (!(ridge.height > 0)) {
      invalid = true;
      errors.push({
        code: 'RIDGE_HEIGHT_INVALID',
        message: `Ridge '${ridge.id}' height must be above base level (> 0).`,
        roofId: roof.id,
        ridgeId: ridge.id,
      });
    }

    if (invalid) invalidRidges.push(ridge);
  }

  for (const face of roof.faces) {
    let invalid = false;

    if (face.kind === 'ridgeSideSegment') {
      if (!face.ridgeId || !ridgeIdSet.has(face.ridgeId)) {
        invalid = true;
        errors.push({
          code: 'FACE_MISSING_RIDGE',
          message: `Face '${face.id}' references missing ridge '${String(face.ridgeId)}'.`,
          roofId: roof.id,
          faceId: face.id,
          ridgeId: face.ridgeId,
        });
      }

      const t0 = face.ridgeT0;
      const t1 = face.ridgeT1;
      if (typeof t0 !== 'number' || typeof t1 !== 'number' || Number.isNaN(t0) || Number.isNaN(t1)) {
        invalid = true;
        errors.push({
          code: 'FACE_RIDGE_RANGE_ORDER',
          message: `Face '${face.id}' requires numeric ridgeT0/ridgeT1.`,
          roofId: roof.id,
          faceId: face.id,
          ridgeId: face.ridgeId,
        });
      } else {
        if (!(t0 < t1)) {
          invalid = true;
          errors.push({
            code: 'FACE_RIDGE_RANGE_ORDER',
            message: `Face '${face.id}' has invalid range: ridgeT0 (${t0}) must be < ridgeT1 (${t1}).`,
            roofId: roof.id,
            faceId: face.id,
            ridgeId: face.ridgeId,
          });
        }

        if (t0 < 0 || t0 > 1 || t1 < 0 || t1 > 1) {
          invalid = true;
          errors.push({
            code: 'FACE_RIDGE_RANGE_BOUNDS',
            message: `Face '${face.id}' has ridge range outside [0,1].`,
            roofId: roof.id,
            faceId: face.id,
            ridgeId: face.ridgeId,
          });
        }

        if (t0 <= 0.01 || t1 >= 0.99 || t1 - t0 < 0.02) {
          suspiciousFaces.push(face);
          warnings.push({
            code: 'FACE_SUSPICIOUS_RIDGE_RANGE',
            message: `Face '${face.id}' has suspicious ridge range (${t0}..${t1}).`,
            roofId: roof.id,
            faceId: face.id,
            ridgeId: face.ridgeId,
          });
        }
      }
    }

    if (face.capEnd && face.kind !== 'ridgeSideSegment') {
      invalid = true;
      errors.push({
        code: 'FACE_CAP_END_INVALID',
        message: `Face '${face.id}' uses capEnd but is not ridgeSideSegment.`,
        roofId: roof.id,
        faceId: face.id,
      });
    }

    if (!faceRegionProducesClip(face, roof)) {
      invalid = true;
      errors.push({
        code: 'FACE_INVALID_REGION',
        message: `Face '${face.id}' region clips to empty or invalid polygon.`,
        roofId: roof.id,
        faceId: face.id,
        ridgeId: face.ridgeId,
      });
    }

    if (invalid) invalidFaces.push(face);
  }

  return {
    errors,
    warnings,
    debug: {
      invalidRidges,
      invalidFaces,
      suspiciousFaces,
    },
  };
}
