export type PointXZ = {
    x: number;
    z: number;
};
export type DraftHouseModel = {
    parcel?: {
        outer: PointXZ[];
        source?: 'official-api' | 'manual' | 'unknown';
    };
    levels?: DraftHouseLevel[];
    walls?: DraftWall[];
    roof?: unknown;
    openings?: unknown[];
    rooms?: unknown[];
    diagnostics?: {
        stage?: string;
        warnings?: string[];
        confidence?: number;
    };
};
export type DraftHouseLevel = {
    id: string;
    name?: string;
    elevation?: number;
    height?: number;
    slab?: {
        thickness?: number;
        inset?: number;
    };
    footprint?: {
        outer: PointXZ[];
        confidence?: number;
    };
};
export type DraftWall = {
    id: string;
    levelId?: string;
    start: PointXZ;
    end: PointXZ;
    height?: number;
    thickness?: number;
};
export type HouseviewerJson = any;
export type HouseViewerProps = {
    model?: DraftHouseModel | HouseviewerJson | null;
    mode?: 'wireframe' | 'solid';
    showHelpers?: boolean;
    className?: string;
};
