import * as THREE from 'three';
import type { SiteSpec, Vec2 } from '../architecturalTypes';
export declare function buildSiteMesh(site: SiteSpec, cutouts?: Vec2[][]): THREE.Mesh;
export declare function buildSiteSurfaceMeshes(site: SiteSpec): THREE.Object3D[];
