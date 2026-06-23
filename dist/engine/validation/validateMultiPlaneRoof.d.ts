import type { MultiPlaneRoofSpec, RoofFaceSpec, RidgeSegmentSpec, XZ } from '../types';
type ValidationBase = {
    code: string;
    message: string;
    roofId: string;
    ridgeId?: string;
    faceId?: string;
    path?: string;
};
export type ValidationError = ValidationBase & {
    severity: 'error';
};
export type ValidationWarning = ValidationBase & {
    severity: 'warning';
};
export type RoofValidationDebug = {
    invalidRidges: RidgeSegmentSpec[];
    invalidFaces: RoofFaceSpec[];
    suspiciousFaces: RoofFaceSpec[];
    invalidFacePolygons: {
        faceId: string;
        polygon: XZ[];
    }[];
};
export type MultiPlaneRoofValidationResult = {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    debug: RoofValidationDebug;
};
export declare function validateMultiPlaneRoof(roof: MultiPlaneRoofSpec): MultiPlaneRoofValidationResult;
export {};
