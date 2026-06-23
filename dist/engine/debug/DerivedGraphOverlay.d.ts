import type { DerivedHouse } from '../derive/types/DerivedHouse';
type Props = {
    derived: DerivedHouse;
};
export declare function getDerivedGraphSummary(derived: DerivedHouse): string[];
export declare function DerivedGraphOverlay({ derived }: Props): import("react/jsx-runtime").JSX.Element;
export {};
