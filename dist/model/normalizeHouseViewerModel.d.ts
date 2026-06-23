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
export declare function normalizeHouseViewerModel(input: any): RenderModel;
