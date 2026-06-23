import type { DerivedWallSegment } from '../engine/deriveWalls';
type EngineWallsDebugProps = {
    segments: DerivedWallSegment[];
    visible?: boolean;
};
export declare function EngineWallsDebug({ segments, visible }: EngineWallsDebugProps): import("react/jsx-runtime").JSX.Element | null;
export {};
