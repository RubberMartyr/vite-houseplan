import type { DerivedHouse } from '../derive/types/DerivedHouse';
type Props = {
    derived: DerivedHouse;
};
export declare function shouldRenderDebugLayer(): boolean;
export declare function EngineDebugLayer({ derived }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
