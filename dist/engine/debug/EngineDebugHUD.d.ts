import type { DerivedHouse } from '../derive/types/DerivedHouse';
import type { EngineDebugStats } from './types';
type Props = {
    derived: DerivedHouse;
};
export declare function buildEngineDebugHudLines(stats: EngineDebugStats): string[];
export declare function EngineDebugHUD({ derived }: Props): import("react/jsx-runtime").JSX.Element;
export {};
