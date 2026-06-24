export type RenderPoint = {
  x: number;
  z: number;
};

export type RenderParcel = {
  outer: RenderPoint[];
  source?: string;
};

export type RenderLevel = {
  id: string;
  name: string;
  elevation: number;
  height: number;
  slab: {
    thickness: number;
    inset: number;
  };
  outer: RenderPoint[];
  sourceFootprintId?: string;
  confidence?: number;
};

export type RenderModel = {
  parcel?: RenderParcel;
  levels: RenderLevel[];
  diagnostics: {
    warnings: string[];
    errors: string[];
    skippedLevels: {
      id?: string;
      reason: string;
    }[];
    inputSummary: {
      hasModel: boolean;
      hasSiteParcel: boolean;
      parcelPointCount: number;
      levelCount: number;
      renderableLevelCount: number;
    };
  };
};

export function normalizeHouseViewerModel(input: any): RenderModel {
  const warnings: string[] = [];
  const errors: string[] = [];
  const skippedLevels: { id?: string; reason: string }[] = [];

  function toNumber(value: any): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function normalizePoint(point: any): RenderPoint | null {
    if (!point) return null;

    const x = toNumber(point.x ?? point[0]);
    const z = toNumber(point.z ?? point.y ?? point[1]);

    if (x === null || z === null) return null;

    return { x, z };
  }

  function normalizePointArray(value: any): RenderPoint[] {
    if (!Array.isArray(value)) return [];

    return value
      .map(normalizePoint)
      .filter((p): p is RenderPoint => Boolean(p));
  }

  const model = input ?? {};

  const parcelOuter = normalizePointArray(model?.site?.parcel?.outer ?? model?.parcel?.outer ?? model?.site?.footprint?.outer);

  const parcel =
    parcelOuter.length >= 3
      ? {
          outer: parcelOuter,
          source: model?.site?.parcel?.source ?? model?.parcel?.source ?? 'unknown',
        }
      : undefined;

  if ((model?.site?.parcel || model?.parcel || model?.site?.footprint) && parcelOuter.length < 3) {
    warnings.push('site.parcel exists but has fewer than 3 valid points.');
  }

  const rawLevels = Array.isArray(model?.levels) ? model.levels : [];

  const levels: RenderLevel[] = rawLevels
    .map((level: any, index: number): RenderLevel | null => {
      const id = String(level?.id ?? `level-${index}`);

      const outer = normalizePointArray(level?.footprint?.outer ?? level?.outer);

      if (outer.length < 3) {
        skippedLevels.push({
          id,
          reason: 'Missing or invalid footprint.outer. Need at least 3 valid points.',
        });
        return null;
      }

      return {
        id,
        name: String(level?.name ?? level?.label ?? id),
        elevation: toNumber(level?.elevation) ?? 0,
        height: toNumber(level?.height) ?? 2.8,
        slab: {
          thickness: toNumber(level?.slab?.thickness) ?? 0.3,
          inset: toNumber(level?.slab?.inset) ?? 0,
        },
        outer,
        sourceFootprintId: level?.footprint?.id,
        confidence:
          toNumber(level?.footprint?.confidence) ??
          toNumber(level?.confidence) ??
          undefined,
      };
    })
    .filter((level: RenderLevel | null): level is RenderLevel => Boolean(level));

  if (!input) {
    warnings.push('No model was provided to HouseViewer.');
  }

  if (!parcel && levels.length === 0) {
    warnings.push('No renderable parcel or building levels found.');
  }

  return {
    parcel,
    levels,
    diagnostics: {
      warnings,
      errors,
      skippedLevels,
      inputSummary: {
        hasModel: Boolean(input),
        hasSiteParcel: Boolean(model?.site?.parcel ?? model?.parcel ?? model?.site?.footprint),
        parcelPointCount: parcelOuter.length,
        levelCount: rawLevels.length,
        renderableLevelCount: levels.length,
      },
    },
  };
}
