import * as THREE from "three";
import type { RoofSpec } from "./types";
import type { DerivedRoof } from "./derive/types/DerivedRoof";
type GableRoofSpec = Extract<RoofSpec, {
    type: "gable";
}>;
type MultiRidgeRoofSpec = Extract<RoofSpec, {
    type: "multi-ridge";
}>;
type StructuralRoofSpec = GableRoofSpec | MultiRidgeRoofSpec;
export declare function deriveGableRoofGeometries(roofs: DerivedRoof[], options?: {
    invalidRoofIds?: Set<string>;
}): THREE.BufferGeometry[];
export declare function buildStructuralGableGeometry(derivedRoof: DerivedRoof, roof: StructuralRoofSpec): THREE.BufferGeometry;
export {};
