export interface Dimension2D {
  width: number;
  depth: number;
}

export interface WallThickness {
  exterior: number;
  interior: number;
}

export interface CeilingHeights {
  main: number;
  foyer: number;
  bedrooms: number;
}

export interface ZoneWidths {
  zoneA: number;
  zoneB?: number;
}

export interface ZPartition {
  key: string;
  label: string;
  depth: number;
  ceiling?: keyof CeilingHeights;
}

export interface HouseSpec {
  footprint: Dimension2D;
  walls: WallThickness;
  ceilings: CeilingHeights;
  zones: ZoneWidths;
  zPartitions: ZPartition[];
}

const houseSpec: HouseSpec = {
  footprint: {
    width: 1000,
    depth: 1600,
  },
  walls: {
    exterior: 20,
    interior: 10,
  },
  ceilings: {
    main: 285,
    foyer: 300,
    bedrooms: 275,
  },
  zones: {
    zoneA: 520,
  },
  zPartitions: [
    { key: 'foyer', label: 'Foyer', depth: 150, ceiling: 'foyer' },
    { key: 'living', label: 'Living', depth: 450, ceiling: 'main' },
    { key: 'kitchen', label: 'Kitchen / Dining', depth: 350, ceiling: 'main' },
    { key: 'corridor', label: 'Corridor', depth: 90, ceiling: 'main' },
    { key: 'beds', label: 'Bedrooms', depth: 320, ceiling: 'bedrooms' },
    { key: 'rear', label: 'Bath / Utility', depth: 150, ceiling: 'bedrooms' },
  ],
};

export default houseSpec;
