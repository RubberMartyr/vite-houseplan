import type { ArchitecturalHouse, LevelSpec, SiteSpec, Vec2 } from './architecturalTypes';

type MaybeModel = Partial<ArchitecturalHouse> | null | undefined | unknown;

export type RenderableGeometrySummary = {
  parcel: Vec2[] | null;
  levelFootprints: Array<{ level: LevelSpec; outer: Vec2[] }>;
  hasRenderableGeometry: boolean;
  errors: string[];
  warnings: string[];
};

function isVec2(value: unknown): value is Vec2 {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Vec2).x === 'number' &&
    Number.isFinite((value as Vec2).x) &&
    typeof (value as Vec2).z === 'number' &&
    Number.isFinite((value as Vec2).z)
  );
}

export function isValidPolygon(value: unknown): value is Vec2[] {
  return Array.isArray(value) && value.length >= 3 && value.every(isVec2);
}

export function getParcelPolygon(model: MaybeModel): Vec2[] | null {
  if (typeof model !== 'object' || model === null) {
    return null;
  }

  const site = (model as { site?: SiteSpec & { parcel?: { outer?: unknown } } }).site;
  const parcelOuter = site?.parcel?.outer;

  if (isValidPolygon(parcelOuter)) {
    return parcelOuter;
  }

  return null;
}

export function getValidLevelFootprints(model: MaybeModel): Array<{ level: LevelSpec; outer: Vec2[] }> {
  if (typeof model !== 'object' || model === null || !Array.isArray((model as Partial<ArchitecturalHouse>).levels)) {
    return [];
  }

  return ((model as Partial<ArchitecturalHouse>).levels ?? [])
    .map((level) => ({ level: level as LevelSpec, outer: (level as Partial<LevelSpec>)?.footprint?.outer }))
    .filter((entry): entry is { level: LevelSpec; outer: Vec2[] } => isValidPolygon(entry.outer));
}

export function getRenderableGeometrySummary(model: MaybeModel): RenderableGeometrySummary {
  const parcel = getParcelPolygon(model);
  const levelFootprints = getValidLevelFootprints(model);
  const warnings: string[] = [];

  if (typeof model === 'object' && model !== null && Array.isArray((model as Partial<ArchitecturalHouse>).levels)) {
    for (const level of (model as Partial<ArchitecturalHouse>).levels ?? []) {
      if (!isValidPolygon((level as Partial<LevelSpec>)?.footprint?.outer)) {
        warnings.push(`Level ${(level as Partial<LevelSpec>).id ?? '(unknown)'} has no valid footprint.outer and will be skipped.`);
      } else if (!Array.isArray((model as Partial<ArchitecturalHouse>).rooms) || ((model as Partial<ArchitecturalHouse>).rooms ?? []).length === 0) {
        warnings.push(`Level ${(level as Partial<LevelSpec>).id ?? '(unknown)'} has a footprint but no rooms; rendering can continue.`);
      }
    }
  }

  const hasRenderableGeometry = parcel !== null || levelFootprints.length > 0;

  return {
    parcel,
    levelFootprints,
    hasRenderableGeometry,
    errors: hasRenderableGeometry ? [] : ['No renderable geometry found.'],
    warnings,
  };
}
