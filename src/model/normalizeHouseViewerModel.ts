import type { OpeningSpec, RoomSpec } from '../engine/architecturalTypes';

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

export type PreviewValidationMessage = {
  path: string;
  message: string;
};

export type PreviewValidationResult = {
  errors: PreviewValidationMessage[];
  warnings: PreviewValidationMessage[];
  info: PreviewValidationMessage[];
};

export type RenderModel = {
  parcel?: RenderParcel;
  levels: RenderLevel[];
  rooms: RoomSpec[];
  openings: OpeningSpec[];
  validation: PreviewValidationResult;
  diagnostics: {
    warnings: string[];
    errors: string[];
    info: string[];
    skippedLevels: {
      id?: string;
      reason: string;
    }[];
    inputSummary: {
      hasModel: boolean;
      hasSiteParcel: boolean;
      hasBaseSlab: boolean;
      parcelPointCount: number;
      levelCount: number;
      roomCount: number;
      openingCount: number;
      renderableLevelCount: number;
      renderableRoomCount: number;
      renderableOpeningCount: number;
    };
  };
};

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null;

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

  return value.map(normalizePoint).filter((p): p is RenderPoint => Boolean(p));
}

const message = (path: string, messageText: string): PreviewValidationMessage => ({ path, message: messageText });

export function getParcelPolygon(json: any): RenderPoint[] | null {
  const model = json ?? {};
  const outer = normalizePointArray(model?.site?.parcel?.outer ?? model?.parcel?.outer ?? model?.site?.footprint?.outer);
  return outer.length >= 3 ? outer : null;
}

export function getBaseSlabPolygon(json: any): RenderPoint[] | null {
  const model = json ?? {};
  const outer = normalizePointArray(model?.baseSlab?.outer ?? model?.baseSlab?.footprint?.outer);
  return outer.length >= 3 ? outer : null;
}

export function getLevelFootprints(json: any): RenderLevel[] {
  const model = json ?? {};
  const rawLevels = Array.isArray(model?.levels) ? model.levels : [];

  return rawLevels
    .map((level: any, index: number): RenderLevel | null => {
      const id = String(level?.id ?? `level-${index}`);
      const outer = normalizePointArray(level?.footprint?.outer ?? level?.outer);

      if (outer.length < 3) {
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
        confidence: toNumber(level?.footprint?.confidence) ?? toNumber(level?.confidence) ?? undefined,
      };
    })
    .filter((level: RenderLevel | null): level is RenderLevel => Boolean(level));
}

export function getRenderableRooms(json: any): RoomSpec[] {
  const model = json ?? {};
  const levels = getPreviewLevels(model);
  const levelIds = new Set(levels.map((level) => level.id));
  const rawRooms = Array.isArray(model?.rooms) ? model.rooms : [];

  return rawRooms.flatMap((room: any, index: number): RoomSpec[] => {
    const levelId = String(room?.levelId ?? '');
    const polygon = normalizePointArray(room?.polygon);

    if (!levelIds.has(levelId) || polygon.length < 3) {
      return [];
    }

    return [
      {
        id: String(room?.id ?? `room-${index}`),
        name: String(room?.name ?? room?.label ?? room?.id ?? `Room ${index + 1}`),
        levelId,
        polygon,
        edges: Array.from({ length: polygon.length }, (_, edgeIndex) => ({
          type: room?.edges?.[edgeIndex]?.type === 'open' || room?.edges?.[edgeIndex]?.type === 'exterior' ? room.edges[edgeIndex].type : 'wall',
        })),
      },
    ];
  });
}

export function getRenderableOpenings(json: any): OpeningSpec[] {
  const model = json ?? {};
  const levels = getPreviewLevels(model);
  const levelById = new Map(levels.map((level) => [level.id, level]));
  const rawOpenings = Array.isArray(model?.openings) ? model.openings : [];

  return rawOpenings.flatMap((opening: any, index: number): OpeningSpec[] => {
    const levelId = String(opening?.levelId ?? opening?.edge?.levelId ?? '');
    const level = levelById.get(levelId);
    const edgeIndex = toNumber(opening?.edge?.edgeIndex ?? opening?.edgeIndex);

    if (!level || edgeIndex === null || edgeIndex < 0 || edgeIndex >= level.outer.length) {
      return [];
    }

    const width = toNumber(opening?.width);
    const height = toNumber(opening?.height);
    const offset = toNumber(opening?.offset);
    const sillHeight = toNumber(opening?.sillHeight ?? opening?.sill);

    if (width === null || height === null || offset === null || sillHeight === null || width <= 0 || height <= 0) {
      return [];
    }

    return [
      {
        id: String(opening?.id ?? `opening-${index}`),
        kind: opening?.kind === 'door' ? 'door' : 'window',
        levelId,
        edge: {
          levelId,
          ring: 'outer',
          edgeIndex,
          fromEnd: Boolean(opening?.edge?.fromEnd ?? opening?.fromEnd),
        },
        offset,
        width,
        sillHeight,
        height,
        style: isRecord(opening?.style) ? opening.style : undefined,
      },
    ];
  });
}

function getPreviewLevels(json: any): RenderLevel[] {
  const levels = getLevelFootprints(json);
  if (levels.length > 0) {
    return levels;
  }

  const baseSlabOuter = getBaseSlabPolygon(json);
  if (!baseSlabOuter) {
    return [];
  }

  return [
    {
      id: String(json?.baseSlab?.levelId ?? json?.baseSlab?.id ?? 'base-slab'),
      name: String(json?.baseSlab?.name ?? 'Base slab'),
      elevation: toNumber(json?.baseSlab?.elevation) ?? 0,
      height: toNumber(json?.baseSlab?.height) ?? 0.15,
      slab: {
        thickness: toNumber(json?.baseSlab?.thickness ?? json?.baseSlab?.slab?.thickness) ?? 0.3,
        inset: toNumber(json?.baseSlab?.inset ?? json?.baseSlab?.slab?.inset) ?? 0,
      },
      outer: baseSlabOuter,
      sourceFootprintId: String(json?.baseSlab?.footprint?.id ?? 'base-slab-footprint'),
    },
  ];
}

export function validatePreviewJson(json: any): PreviewValidationResult {
  const errors: PreviewValidationMessage[] = [];
  const warnings: PreviewValidationMessage[] = [];
  const info: PreviewValidationMessage[] = [];
  const model = json ?? {};

  if (json == null) {
    info.push(message('$', 'No preview JSON was provided.'));
  }

  if ((model?.site?.parcel || model?.parcel || model?.site?.footprint) && !getParcelPolygon(model)) {
    warnings.push(message('site.parcel.outer', 'Parcel was skipped because it needs at least 3 valid points.'));
  }

  if (model?.baseSlab && !getBaseSlabPolygon(model)) {
    warnings.push(message('baseSlab.outer', 'Base slab was skipped because it needs at least 3 valid points.'));
  }

  const rawLevels = Array.isArray(model?.levels) ? model.levels : [];
  rawLevels.forEach((level: any, index: number) => {
    const id = String(level?.id ?? `level-${index}`);
    const outer = normalizePointArray(level?.footprint?.outer ?? level?.outer);
    if (outer.length < 3) {
      warnings.push(message(`levels[${index}].footprint.outer`, `Level "${id}" was skipped because it needs at least 3 valid points.`));
    }
  });

  const previewLevels = getPreviewLevels(model);
  const levelIds = new Set(previewLevels.map((level) => level.id));
  const rawRooms = Array.isArray(model?.rooms) ? model.rooms : [];
  const renderableRooms = getRenderableRooms(model);
  rawRooms.forEach((room: any, index: number) => {
    const levelId = String(room?.levelId ?? '');
    const polygon = normalizePointArray(room?.polygon);
    if (!levelIds.has(levelId)) {
      warnings.push(message(`rooms[${index}].levelId`, `Room "${room?.id ?? index}" was skipped because level "${levelId || 'unknown'}" does not exist.`));
    } else if (polygon.length < 3) {
      warnings.push(message(`rooms[${index}].polygon`, `Room "${room?.id ?? index}" was skipped because it needs at least 3 valid points.`));
    }
  });

  const rawOpenings = Array.isArray(model?.openings) ? model.openings : [];
  const renderableOpenings = getRenderableOpenings(model);
  rawOpenings.forEach((opening: any, index: number) => {
    const levelId = String(opening?.levelId ?? opening?.edge?.levelId ?? '');
    const level = previewLevels.find((entry) => entry.id === levelId);
    const edgeIndex = toNumber(opening?.edge?.edgeIndex ?? opening?.edgeIndex);
    if (!level) {
      warnings.push(message(`openings[${index}].levelId`, `Opening "${opening?.id ?? index}" was skipped because level "${levelId || 'unknown'}" does not exist.`));
    } else if (edgeIndex === null || edgeIndex < 0 || edgeIndex >= level.outer.length) {
      warnings.push(message(`openings[${index}].edge.edgeIndex`, `Opening "${opening?.id ?? index}" was skipped because its referenced edge does not exist.`));
    } else if (!renderableOpenings.some((entry) => entry.id === String(opening?.id ?? `opening-${index}`))) {
      warnings.push(message(`openings[${index}]`, `Opening "${opening?.id ?? index}" was skipped because width, height, offset, and sillHeight are required.`));
    }
  });

  if (!getParcelPolygon(model) && previewLevels.length === 0) {
    info.push(message('$', 'No renderable parcel, base slab, or level footprint was found.'));
  }

  info.push(message('$', `Renderable preview geometry: parcel=${getParcelPolygon(model) ? 1 : 0}, levels=${previewLevels.length}, rooms=${renderableRooms.length}, openings=${renderableOpenings.length}.`));


  return { errors, warnings, info };
}

export function normalizeHouseViewerModel(input: any): RenderModel {
  const validation = validatePreviewJson(input);
  const model = input ?? {};
  const parcelOuter = getParcelPolygon(model);
  const parcel = parcelOuter
    ? {
        outer: parcelOuter,
        source: model?.site?.parcel?.source ?? model?.parcel?.source ?? 'unknown',
      }
    : undefined;
  const levels = getPreviewLevels(model);
  const rawLevels = Array.isArray(model?.levels) ? model.levels : [];
  const rawRooms = Array.isArray(model?.rooms) ? model.rooms : [];
  const rawOpenings = Array.isArray(model?.openings) ? model.openings : [];
  const rooms = getRenderableRooms(model);
  const openings = getRenderableOpenings(model);

  const skippedLevels = rawLevels.flatMap((level: any, index: number) => {
    const id = String(level?.id ?? `level-${index}`);
    const outer = normalizePointArray(level?.footprint?.outer ?? level?.outer);
    return outer.length < 3 ? [{ id, reason: 'Missing or invalid footprint.outer. Need at least 3 valid points.' }] : [];
  });

  return {
    parcel,
    levels,
    rooms,
    openings,
    validation,
    diagnostics: {
      warnings: validation.warnings.map((entry) => `${entry.path}: ${entry.message}`),
      errors: validation.errors.map((entry) => `${entry.path}: ${entry.message}`),
      info: validation.info.map((entry) => `${entry.path}: ${entry.message}`),
      skippedLevels,
      inputSummary: {
        hasModel: Boolean(input),
        hasSiteParcel: Boolean(model?.site?.parcel ?? model?.parcel ?? model?.site?.footprint),
        hasBaseSlab: Boolean(model?.baseSlab),
        parcelPointCount: normalizePointArray(model?.site?.parcel?.outer ?? model?.parcel?.outer ?? model?.site?.footprint?.outer).length,
        levelCount: rawLevels.length,
        roomCount: rawRooms.length,
        openingCount: rawOpenings.length,
        renderableLevelCount: levels.length,
        renderableRoomCount: rooms.length,
        renderableOpeningCount: openings.length,
      },
    },
  };
}
