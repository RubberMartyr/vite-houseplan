import type { XZ } from '../../types';

export interface DerivedCarportColumn {
  position: XZ;
  height: number;
  size: number;
}

export interface DerivedCarport {
  id: string;
  roofPolygon: XZ[];
  elevation: number;
  thickness: number;
  columns: DerivedCarportColumn[];
  material: {
    roof: string;
    columns: string;
    underside: string;
  };
}
