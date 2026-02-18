import * as THREE from 'three';
import { SILL_DEPTH, SILL_HEIGHT, SILL_OVERHANG } from '../constants/windowConstants';
import { blueStoneMaterial } from '../materials/windowMaterials';

export type WindowMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  material?: THREE.Material;
};

export function buildSill(params: {
  id: string;
  width: number;
  xCenter?: number;
  yCenter?: number;
  zFace?: number;
  zCenter?: number;
  yBottom?: number;
  xFace?: number;
  side?: 'left' | 'right';
}): WindowMesh {
  const { id, width } = params;

  if (params.xCenter !== undefined && params.yCenter !== undefined && params.zFace !== undefined) {
    const geometry = new THREE.BoxGeometry(width, SILL_HEIGHT, SILL_DEPTH);
    return {
      id,
      geometry,
      position: [params.xCenter, params.yCenter, params.zFace + SILL_DEPTH / 2 + SILL_OVERHANG],
      rotation: [0, 0, 0],
      material: blueStoneMaterial,
    };
  }

  if (
    params.zCenter !== undefined &&
    params.yBottom !== undefined &&
    params.xFace !== undefined &&
    params.side !== undefined
  ) {
    const sillX =
      params.side === 'left'
        ? params.xFace - SILL_DEPTH / 2 - SILL_OVERHANG
        : params.xFace + SILL_DEPTH / 2 + SILL_OVERHANG;

    const geometry = new THREE.BoxGeometry(SILL_DEPTH, SILL_HEIGHT, width + 0.04);
    return {
      id,
      geometry,
      position: [sillX, params.yBottom - SILL_HEIGHT / 2, params.zCenter],
      rotation: [0, 0, 0],
      material: blueStoneMaterial,
    };
  }

  throw new Error('Invalid sill params: provide either rear-facing or side-facing parameter set.');
}
