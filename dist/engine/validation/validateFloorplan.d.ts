import type { ArchitecturalHouse } from '../architecturalTypes';
export declare const VALIDATION_TOLERANCES: {
    readonly coordinateEpsilon: 0.02;
    readonly edgeOverlapMin: 0.1;
    readonly tinyGapArea: 0.25;
    readonly majorGapArea: 1;
    readonly tJunctionSnapDistance: 0.1;
    readonly cornerTouchDistance: 0.05;
};
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationIssue = {
    code: 'ROOM_OVERLAP' | 'ROOM_OUTSIDE_FOOTPRINT' | 'ROOM_GAP_IN_FOOTPRINT' | 'ROOM_INVALID_POLYGON' | 'ROOM_EDGE_COUNT_MISMATCH' | 'ROOM_EDGE_MISMATCH' | 'INTERIOR_WALL_ON_EXTERIOR_BOUNDARY' | 'ROOM_PARTIAL_SHARED_EDGE' | 'ROOM_ZERO_AREA' | 'ROOM_DUPLICATE_VERTEX' | 'ROOM_UNCLOSED_TOPOLOGY' | 'ROOM_T_JUNCTION' | 'ROOM_UNSUPPORTED_HOLE' | 'ROOM_TOO_THIN' | 'ROOM_SELF_INTERSECTION' | 'ROOM_MISSING_LEVEL' | 'ROOM_EMPTY_SET' | 'ROOM_CORNER_TOUCH' | 'ROOM_FRAGMENT_EDGE' | 'ROOM_MICRO_GAP' | 'ROOM_MICRO_OVERLAP';
    severity: ValidationSeverity;
    message: string;
    levelId?: string;
    roomIds?: string[];
    edge?: {
        a: {
            x: number;
            z: number;
        };
        b: {
            x: number;
            z: number;
        };
    };
    polygon?: {
        x: number;
        z: number;
    }[];
    meta?: Record<string, unknown>;
};
export type AdjacencyRelationshipType = 'exact_shared' | 'partial_shared' | 't_junction' | 'corner_touch' | 'exterior_boundary' | 'open_transition';
export type RoomAdjacencyEdge = {
    roomAId: string;
    roomBId: string;
    sharedLength: number;
    relationshipType: AdjacencyRelationshipType;
    overlapRatio: number;
    hasTypeMismatch: boolean;
    hasTJunction: boolean;
};
export type FloorplanValidationResult = {
    ok: boolean;
    roomCount: number;
    levelCount: number;
    issueCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    issues: ValidationIssue[];
    perLevel: Record<string, {
        roomCount: number;
        issues: ValidationIssue[];
        uncoveredPolygons?: {
            x: number;
            z: number;
        }[][];
        coveredPolygons?: {
            x: number;
            z: number;
        }[][];
        overlapPairs?: {
            roomA: string;
            roomB: string;
        }[];
        adjacencyEdges?: RoomAdjacencyEdge[];
    }>;
};
export declare function validateFloorplan(arch: ArchitecturalHouse): FloorplanValidationResult;
export declare function validateFloorplanReport(architecturalHouse: ArchitecturalHouse): ValidationIssue[];
