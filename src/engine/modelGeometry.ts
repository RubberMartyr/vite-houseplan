import type { ArchitecturalHouse, LevelSpec, SiteSpec, Vec2 } from './architecturalTypes';

export type HouseViewerModel = Partial<Omit<ArchitecturalHouse, 'site'>> & {
  site?: Partial<SiteSpec> & {
    footprint?: Partial<SiteSpec['footprint']>;
    parcel?: SiteSpec['parcel'];
    surfaces?: SiteSpec['surfaces'];
    objects?: SiteSpec['objects'];
    boundaries?: SiteSpec['boundaries'];
  };
};

type MaybeModel = HouseViewerModel | null | undefined | unknown;

export type RenderableGeometryMode = 'empty' | 'site-only' | 'house-only' | 'site-and-house';

export type RenderableGeometrySummary = {
  siteFootprint: Vec2[] | null;
  parcel: Vec2[] | null;
  levelFootprints: Array<{ level: LevelSpec; outer: Vec2[] }>;
  hasSiteFootprint: boolean;
  validLevelCount: number;
  hasRenderableGeometry: boolean;
  mode: RenderableGeometryMode;
  errors: string[];
  warnings: string[];
};

export function isFinitePointXZ(value: unknown): value is Vec2 {
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
  return Array.isArray(value) && value.length >= 3 && value.every(isFinitePointXZ);
}

export function getSiteFootprint(model: MaybeModel): Vec2[] | null {
  if (typeof model !== 'object' || model === null) {
    return null;
  }

  const site = (model as HouseViewerModel).site;
  const footprintOuter = site?.footprint?.outer;
  if (isValidPolygon(footprintOuter)) {
    return footprintOuter;
  }

  const parcelOuter = site?.parcel?.outer;
  if (isValidPolygon(parcelOuter)) {
    return parcelOuter;
  }

  return null;
}

export function getParcelPolygon(model: MaybeModel): Vec2[] | null {
  if (typeof model !== 'object' || model === null) {
    return null;
  }

  const parcelOuter = (model as HouseViewerModel).site?.parcel?.outer;
  return isValidPolygon(parcelOuter) ? parcelOuter : null;
}

export function getLevelFootprints(model: MaybeModel): Array<{ level: LevelSpec; outer: Vec2[] }> {
  if (typeof model !== 'object' || model === null) {
    return [];
  }

  return ((model as HouseViewerModel).levels ?? [])
    .map((level) => ({ level: level as LevelSpec, outer: (level as Partial<LevelSpec>)?.footprint?.outer }))
    .filter((entry): entry is { level: LevelSpec; outer: Vec2[] } => isValidPolygon(entry.outer));
}

export const getValidLevelFootprints = getLevelFootprints;

export function getRenderableGeometrySummary(model: MaybeModel): RenderableGeometrySummary {
  const siteFootprint = getSiteFootprint(model);
  const parcel = getParcelPolygon(model);
  const levelFootprints = getLevelFootprints(model);
  const warnings: string[] = [];

  if (typeof model === 'object' && model !== null && Array.isArray((model as HouseViewerModel).levels)) {
    for (const level of (model as HouseViewerModel).levels ?? []) {
      if (!isValidPolygon((level as Partial<LevelSpec>)?.footprint?.outer)) {
        warnings.push(`Level ${(level as Partial<LevelSpec>).id ?? '(unknown)'} has no valid footprint.outer and will be skipped.`);
      } else if (!Array.isArray((model as HouseViewerModel).rooms) || ((model as HouseViewerModel).rooms ?? []).length === 0) {
        warnings.push(`Level ${(level as Partial<LevelSpec>).id ?? '(unknown)'} has a footprint but no rooms; rendering can continue.`);
      }
    }
  }

  const hasSiteFootprint = siteFootprint !== null;
  const validLevelCount = levelFootprints.length;
  const hasRenderableGeometry = hasSiteFootprint || validLevelCount > 0;
  const mode: RenderableGeometryMode = !hasRenderableGeometry
    ? 'empty'
    : hasSiteFootprint && validLevelCount > 0
      ? 'site-and-house'
      : hasSiteFootprint
        ? 'site-only'
        : 'house-only';

  return {
    siteFootprint,
    parcel,
    levelFootprints,
    hasSiteFootprint,
    validLevelCount,
    hasRenderableGeometry,
    mode,
    errors: hasRenderableGeometry ? [] : ['No renderable geometry found.'],
    warnings,
  };
}

export function normalizeViewerModel(model: MaybeModel): ArchitecturalHouse {
  const source = typeof model === 'object' && model !== null ? (model as HouseViewerModel) : {};
  const levels = getLevelFootprints(source).map(({ level }) => level);
  const siteFootprint = getSiteFootprint(source);
  const sourceSite = source.site;
  const site = siteFootprint
    ? ({
        ...sourceSite,
        footprint: {
          id: sourceSite?.footprint?.id ?? 'site-footprint',
          outer: siteFootprint,
          holes: sourceSite?.footprint?.holes,
          edges: sourceSite?.footprint?.edges ?? [],
          semanticZones: sourceSite?.footprint?.semanticZones ?? [],
        },
        surfaces: sourceSite?.surfaces ?? [],
        objects: sourceSite?.objects ?? [],
        boundaries: {
          fences: sourceSite?.boundaries?.fences ?? [],
          hedges: sourceSite?.boundaries?.hedges ?? [],
          gates: sourceSite?.boundaries?.gates ?? [],
        },
      } as SiteSpec)
    : undefined;

  return {
    ...(source as Partial<ArchitecturalHouse>),
    wallThickness: source.wallThickness ?? 0.3,
    levels,
    rooms: source.rooms ?? [],
    openings: source.openings ?? [],
    roofs: source.roofs ?? [],
    site,
  } as ArchitecturalHouse;
}
