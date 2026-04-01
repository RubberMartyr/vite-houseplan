import type {
  LevelSpec,
  MultiPlaneRoofSpec,
  OpeningSpec,
  RoofSpec,
  Vec2,
} from './architecturalTypes';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isVec2(value: unknown): value is Vec2 {
  return isObject(value)
    && typeof value.x === 'number'
    && typeof value.z === 'number';
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'string';
}

function hasNumber(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'number';
}

export function isRoofSpec(value: unknown): value is RoofSpec {
  if (!isObject(value) || !hasString(value, 'id') || !hasString(value, 'type') || !hasString(value, 'baseLevelId')) {
    return false;
  }

  const type = value.type;
  if (type === 'flat') {
    return hasNumber(value, 'thickness');
  }

  if (type === 'gable') {
    return hasNumber(value, 'eaveHeight') && hasNumber(value, 'ridgeHeight');
  }

  if (type === 'multi-ridge') {
    return hasNumber(value, 'eaveHeight') && Array.isArray(value.ridgeSegments);
  }

  if (type === 'multi-plane') {
    return isMultiPlaneRoofSpec(value);
  }

  return false;
}

export function isMultiPlaneRoofSpec(value: unknown): value is MultiPlaneRoofSpec {
  return isObject(value)
    && value.type === 'multi-plane'
    && hasString(value, 'id')
    && hasString(value, 'baseLevelId')
    && hasNumber(value, 'eaveHeight')
    && Array.isArray(value.ridgeSegments)
    && Array.isArray(value.faces);
}

export function isLevelSpec(value: unknown): value is LevelSpec {
  if (!isObject(value)) {
    return false;
  }

  if (!hasString(value, 'id') || !hasString(value, 'name') || !hasNumber(value, 'elevation') || !hasNumber(value, 'height')) {
    return false;
  }

  const footprint = value.footprint;
  const slab = value.slab;

  return isObject(footprint)
    && Array.isArray(footprint.outer)
    && footprint.outer.every(isVec2)
    && isObject(slab)
    && hasNumber(slab, 'thickness')
    && hasNumber(slab, 'inset');
}

export function isOpeningSpec(value: unknown): value is OpeningSpec {
  if (!isObject(value)) {
    return false;
  }

  return hasString(value, 'id')
    && (value.kind === 'window' || value.kind === 'door')
    && hasString(value, 'levelId')
    && hasNumber(value, 'offset')
    && hasNumber(value, 'width')
    && hasNumber(value, 'sillHeight')
    && hasNumber(value, 'height')
    && isObject(value.edge)
    && hasString(value.edge, 'levelId')
    && value.edge.ring === 'outer'
    && hasNumber(value.edge, 'edgeIndex');
}
