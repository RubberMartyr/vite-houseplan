import { Mesh } from 'three';
import type { DerivedSlab } from '../engine/derive/deriveSlabs';
import type { RenderStyleConfig } from './renderStyleConfig';
export declare function buildSlabMesh(slab: DerivedSlab, renderConfig: RenderStyleConfig): Mesh;
