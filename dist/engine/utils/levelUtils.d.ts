import type { ArchitecturalHouse, LevelSpec } from '../architecturalTypes';
export declare function getSortedLevels(house: ArchitecturalHouse): LevelSpec[];
export declare function getLowestLevel(house: ArchitecturalHouse): LevelSpec | null;
export declare function getHighestLevel(house: ArchitecturalHouse): LevelSpec | null;
export declare function getLevelById(house: ArchitecturalHouse, levelId: string): LevelSpec | null;
export declare function getLevelIndex(house: ArchitecturalHouse, levelId: string): number;
export declare function getLevelAbove(house: ArchitecturalHouse, levelId: string): LevelSpec | null;
export declare function getLevelBelow(house: ArchitecturalHouse, levelId: string): LevelSpec | null;
export declare function getDefaultRoofBaseLevel(house: ArchitecturalHouse): LevelSpec | null;
