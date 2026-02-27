import type { FaceRegion, HalfPlane, MultiPlaneRoofSpec, RidgePerpCut, RoofFaceSpec, RidgeSegmentSpec, XZ } from '../types';

const EPS = 1e-6;

type Severity = 'error' | 'warning';

type ValidationBase = {
  code: string;
  message: string;
  roofId: string;
  ridgeId?: string;
  faceId?: string;
  path?: string;
};

export type ValidationError = ValidationBase & { severity: 'error' };
export type ValidationWarning = ValidationBase & { severity: 'warning' };

export type RoofValidationDebug = {
  invalidRidges: RidgeSegmentSpec[];
  invalidFaces: RoofFaceSpec[];
  suspiciousFaces: RoofFaceSpec[];
  invalidFacePolygons: { faceId: string; polygon: XZ[] }[];
};

export type MultiPlaneRoofValidationResult = {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  debug: RoofValidationDebug;
};

function ridgePointAt(ridge: { start: XZ; end: XZ }, t: number): XZ {
  return {
    x: ridge.start.x + (ridge.end.x - ridge.start.x) * t,
    z: ridge.start.z + (ridge.end.z - ridge.start.z) * t,
  };
}

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
  if (Math.abs(denom) < 1e-9) return null;
  const ap = { x: a.x - p.x, z: a.z - p.z };
  const t = (ap.x * s.z - ap.z * s.x) / denom;
  if (t < -1e-9 || t > 1 + 1e-9) return null;
  return { x: p.x + t * r.x, z: p.z + t * r.z };
}

function clipPolyByHalfPlane(poly: XZ[], hp: HalfPlane): XZ[] {
  const inside = (p: XZ) => {
    const s = signedSide(p, hp.a, hp.b);
    return hp.keep === 'left' ? s >= -1e-9 : s <= 1e-9;
  };

  const out: XZ[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const P = poly[i];
    const Q = poly[i + 1];
    const Pin = inside(P);
    const Qin = inside(Q);

    if (Pin && Qin) {
      out.push(Q);
    } else if (Pin && !Qin) {
      const I = intersectSegmentWithLine(P, Q, hp.a, hp.b);
      if (I) out.push(I);
    } else if (!Pin && Qin) {
      const I = intersectSegmentWithLine(P, Q, hp.a, hp.b);
      if (I) out.push(I);
      out.push(Q);
    }
  }

  if (out.length < 3) return out;
  const first = out[0];
  const last = out[out.length - 1];
  if (Math.abs(first.x - last.x) > 1e-9 || Math.abs(first.z - last.z) > 1e-9) {
    out.push({ ...first });
  }
  return out;
}

function ridgePerpCutToHalfPlane(
  ridge: { start: XZ; end: XZ },
  t: number,
  keep: 'ahead' | 'behind'
): HalfPlane {
  const E = ridgePointAt(ridge, t);
  const dx = ridge.end.x - ridge.start.x;
  const dz = ridge.end.z - ridge.start.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;

  const nx = -uz;
  const nz = ux;

  const A = { x: E.x - nx * 1000, z: E.z - nz * 1000 };
  const B = { x: E.x + nx * 1000, z: E.z + nz * 1000 };

  const test = { x: E.x + ux * 0.01, z: E.z + uz * 0.01 };
  const s = signedSide(test, A, B);
  const keepAhead: 'left' | 'right' = s >= 0 ? 'left' : 'right';

  if (keep === 'ahead') return { a: A, b: B, keep: keepAhead };
  return { a: A, b: B, keep: keepAhead === 'left' ? 'right' : 'left' };
}

function resolveFaceRegionToHalfPlanes(region: FaceRegion, roof: MultiPlaneRoofSpec): HalfPlane[] | null {
  if (region.type === 'halfPlanes') return region.planes;
  if (region.type !== 'compound') return null;

  const halfPlanes: HalfPlane[] = [];
  for (const item of region.items) {
    const cut = item as RidgePerpCut;
    if (cut.type === 'ridgePerpCut') {
      const ridge = roof.ridgeSegments.find((r) => r.id === cut.ridgeId);
      if (!ridge) return null;
      halfPlanes.push(ridgePerpCutToHalfPlane(ridge, cut.t, cut.keep));
      continue;
    }

    halfPlanes.push(item as HalfPlane);
  }

  return halfPlanes;
}

function getFallbackClipPolygon(roof: MultiPlaneRoofSpec): XZ[] {
  const points = roof.ridgeSegments.flatMap((ridge) => [ridge.start, ridge.end]);
  if (points.length === 0) {
    return [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: 10, z: 10 },
      { x: -10, z: 10 },
      { x: -10, z: -10 },
    ];
  }

  const xs = points.map((p) => p.x);
  const zs = points.map((p) => p.z);
  const minX = Math.min(...xs) - 10;
  const maxX = Math.max(...xs) + 10;
  const minZ = Math.min(...zs) - 10;
  const maxZ = Math.max(...zs) + 10;

  return [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ },
    { x: minX, z: minZ },
  ];
}

function validateFaceRegion(roof: MultiPlaneRoofSpec, face: RoofFaceSpec): XZ[] | null {
  if (face.region.type === 'ridgeCapTriangle') {
    return null;
  }
  const halfPlanes = resolveFaceRegionToHalfPlanes(face.region, roof);
  if (!halfPlanes) return [];

  let out = getFallbackClipPolygon(roof);
  for (const plane of halfPlanes) {
    out = clipPolyByHalfPlane(out, plane);
    if (out.length < 4) return out;
  }
  return out;
}

export function validateMultiPlaneRoof(roof: MultiPlaneRoofSpec): MultiPlaneRoofValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const invalidRidges: RidgeSegmentSpec[] = [];
  const invalidFaces: RoofFaceSpec[] = [];
  const suspiciousFaces: RoofFaceSpec[] = [];
  const invalidFacePolygons: { faceId: string; polygon: XZ[] }[] = [];

  const ridgeIds = new Set<string>();
  const ridgeById = new Map<string, RidgeSegmentSpec>();

  for (const ridge of roof.ridgeSegments) {
    ridgeById.set(ridge.id, ridge);

    if (ridgeIds.has(ridge.id)) {
      errors.push({
        severity: 'error',
        code: 'RIDGE_DUPLICATE_ID',
        message: `Duplicate ridge id "${ridge.id}".`,
        roofId: roof.id,
        ridgeId: ridge.id,
        path: `ridgeSegments[id=${ridge.id}]`,
      });
      invalidRidges.push(ridge);
    }
    ridgeIds.add(ridge.id);

    const length = Math.hypot(ridge.end.x - ridge.start.x, ridge.end.z - ridge.start.z);
    if (length <= EPS) {
      errors.push({
        severity: 'error',
        code: 'RIDGE_DEGENERATE',
        message: `Ridge "${ridge.id}" start and end are identical or too close.`,
        roofId: roof.id,
        ridgeId: ridge.id,
        path: `ridgeSegments[id=${ridge.id}].start/end`,
      });
      invalidRidges.push(ridge);
    }

    if (ridge.height <= 0) {
      errors.push({
        severity: 'error',
        code: 'RIDGE_HEIGHT_INVALID',
        message: `Ridge "${ridge.id}" height must be above base level (>0).`,
        roofId: roof.id,
        ridgeId: ridge.id,
        path: `ridgeSegments[id=${ridge.id}].height`,
      });
      invalidRidges.push(ridge);
    }
  }

  for (const face of roof.faces) {
    let hasError = false;

    if (face.kind === 'ridgeSideSegment') {
      if (!face.ridgeId || !ridgeById.has(face.ridgeId)) {
        errors.push({
          severity: 'error',
          code: 'FACE_RIDGE_MISSING',
          message: `Face "${face.id}" references unknown ridgeId.`,
          roofId: roof.id,
          faceId: face.id,
          ridgeId: face.ridgeId,
          path: `faces[id=${face.id}].ridgeId`,
        });
        hasError = true;
      }

      const t0 = face.ridgeT0;
      const t1 = face.ridgeT1;
      if (typeof t0 !== 'number' || typeof t1 !== 'number') {
        errors.push({
          severity: 'error',
          code: 'FACE_TRANGE_MISSING',
          message: `Face "${face.id}" must define ridgeT0 and ridgeT1.`,
          roofId: roof.id,
          faceId: face.id,
          path: `faces[id=${face.id}].ridgeT0/ridgeT1`,
        });
        hasError = true;
      } else {
        if (t0 < 0 || t0 > 1 || t1 < 0 || t1 > 1) {
          errors.push({
            severity: 'error',
            code: 'FACE_TRANGE_BOUNDS',
            message: `Face "${face.id}" ridgeT values must be within [0,1].`,
            roofId: roof.id,
            faceId: face.id,
            path: `faces[id=${face.id}].ridgeT0/ridgeT1`,
          });
          hasError = true;
          suspiciousFaces.push(face);
        }

        if (t0 >= t1) {
          errors.push({
            severity: 'error',
            code: 'FACE_TRANGE_ORDER',
            message: `Face "${face.id}" requires ridgeT0 < ridgeT1.`,
            roofId: roof.id,
            faceId: face.id,
            path: `faces[id=${face.id}].ridgeT0/ridgeT1`,
          });
          hasError = true;
          suspiciousFaces.push(face);
        } else if (t1 - t0 < 0.02) {
          warnings.push({
            severity: 'warning',
            code: 'FACE_TRANGE_TINY',
            message: `Face "${face.id}" has a very small ridge segment span (${(t1 - t0).toFixed(3)}).`,
            roofId: roof.id,
            faceId: face.id,
            path: `faces[id=${face.id}].ridgeT0/ridgeT1`,
          });
          suspiciousFaces.push(face);
        }
      }

      if (face.capEnd) {
        warnings.push({
          severity: 'warning',
          code: 'FACE_CAPEND_UNUSED',
          message: `Face "${face.id}" defines capEnd but is ridgeSideSegment.`,
          roofId: roof.id,
          faceId: face.id,
          path: `faces[id=${face.id}].capEnd`,
        });
      }
    } else if (face.kind === 'hipCap') {
      if (face.capEnd && !face.ridgeId && face.region.type !== 'ridgeCapTriangle') {
        errors.push({
          severity: 'error',
          code: 'FACE_CAPEND_CONTEXT',
          message: `Face "${face.id}" capEnd requires a ridgeSideSegment context.`,
          roofId: roof.id,
          faceId: face.id,
          path: `faces[id=${face.id}].capEnd`,
        });
        hasError = true;
      }
    }

    const clipped = validateFaceRegion(roof, face);
    if (Array.isArray(clipped) && clipped.length > 0 && clipped.length < 4) {
      errors.push({
        severity: 'error',
        code: 'FACE_REGION_EMPTY',
        message: `Face "${face.id}" region clipping produced an empty/degenerate polygon.`,
        roofId: roof.id,
        faceId: face.id,
        path: `faces[id=${face.id}].region`,
      });
      invalidFacePolygons.push({ faceId: face.id, polygon: clipped });
      hasError = true;
    }

    if (hasError) {
      invalidFaces.push(face);
    }
  }

  return {
    errors,
    warnings,
    debug: {
      invalidRidges,
      invalidFaces,
      suspiciousFaces,
      invalidFacePolygons,
    },
  };
}
