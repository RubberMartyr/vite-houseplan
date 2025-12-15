import houseSpec, { HouseSpec, ZPartition } from './houseSpec';

export interface LayoutOptions {
  maxWidth?: number;
  maxDepth?: number;
}

export interface ScaledRange {
  raw: [number, number];
  scaled: [number, number];
  length: number;
  scaledLength: number;
}

export interface GroundLayout {
  scale: number;
  footprint: {
    width: number;
    depth: number;
    scaledWidth: number;
    scaledDepth: number;
  };
  walls: {
    exterior: number;
    interior: number;
    scaledExterior: number;
    scaledInterior: number;
  };
  interior: {
    width: number;
    depth: number;
    offsetX: number;
    offsetZ: number;
    scaledWidth: number;
    scaledDepth: number;
    scaledOffsetX: number;
    scaledOffsetZ: number;
  };
  zones: {
    a: ScaledRange;
    b: ScaledRange;
  };
  partitions: Array<
    ZPartition & {
      range: [number, number];
      scaledRange: [number, number];
    }
  >;
}

const computeScale = (
  footprintWidth: number,
  footprintDepth: number,
  options?: LayoutOptions
) => {
  if (!options) return 1;
  const maxWidth = options.maxWidth ?? footprintWidth;
  const maxDepth = options.maxDepth ?? footprintDepth;
  const scale = Math.min(maxWidth / footprintWidth, maxDepth / footprintDepth);
  return Math.min(scale, 1);
};

const withScale = (value: number, scale: number) => value * scale;

export const createGroundLayout = (
  spec: HouseSpec = houseSpec,
  options?: LayoutOptions
): GroundLayout => {
  const scale = computeScale(spec.footprint.width, spec.footprint.depth, options);

  const interiorWidth = spec.footprint.width - spec.walls.exterior * 2;
  const interiorDepth = spec.footprint.depth - spec.walls.exterior * 2;

  const zoneAWidth = spec.zones.zoneA;
  const zoneBWidth =
    spec.zones.zoneB ?? interiorWidth - zoneAWidth - spec.walls.interior;

  const interiorStartX = spec.walls.exterior;
  const interiorStartZ = spec.walls.exterior;

  const zoneAStart = interiorStartX;
  const zoneAEnd = zoneAStart + zoneAWidth;
  const zoneBStart = zoneAEnd + spec.walls.interior;
  const zoneBEnd = zoneBStart + zoneBWidth;

  let currentZ = interiorStartZ;
  const partitions = spec.zPartitions.map((section, idx) => {
    const start = currentZ;
    const end = start + section.depth;
    currentZ = end;
    if (idx < spec.zPartitions.length - 1) {
      currentZ += spec.walls.interior;
    }
    return {
      ...section,
      range: [start, end] as [number, number],
      scaledRange: [withScale(start, scale), withScale(end, scale)] as [
        number,
        number,
      ],
    };
  });

  return {
    scale,
    footprint: {
      width: spec.footprint.width,
      depth: spec.footprint.depth,
      scaledWidth: withScale(spec.footprint.width, scale),
      scaledDepth: withScale(spec.footprint.depth, scale),
    },
    walls: {
      exterior: spec.walls.exterior,
      interior: spec.walls.interior,
      scaledExterior: withScale(spec.walls.exterior, scale),
      scaledInterior: withScale(spec.walls.interior, scale),
    },
    interior: {
      width: interiorWidth,
      depth: interiorDepth,
      offsetX: interiorStartX,
      offsetZ: interiorStartZ,
      scaledWidth: withScale(interiorWidth, scale),
      scaledDepth: withScale(interiorDepth, scale),
      scaledOffsetX: withScale(interiorStartX, scale),
      scaledOffsetZ: withScale(interiorStartZ, scale),
    },
    zones: {
      a: {
        raw: [zoneAStart, zoneAEnd],
        scaled: [withScale(zoneAStart, scale), withScale(zoneAEnd, scale)],
        length: zoneAWidth,
        scaledLength: withScale(zoneAWidth, scale),
      },
      b: {
        raw: [zoneBStart, zoneBEnd],
        scaled: [withScale(zoneBStart, scale), withScale(zoneBEnd, scale)],
        length: zoneBWidth,
        scaledLength: withScale(zoneBWidth, scale),
      },
    },
    partitions,
  };
};

export default createGroundLayout;
