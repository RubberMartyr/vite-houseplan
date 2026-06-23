import type { ArchitecturalHouse } from '../../../architecturalTypes';
type Props = {
    initialJson: string;
    onApplyArchitecturalHouse: (house: ArchitecturalHouse) => void;
};
export declare function JsonEditorTab({ initialJson, onApplyArchitecturalHouse }: Props): import("react/jsx-runtime").JSX.Element;
export {};
