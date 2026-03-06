import * as THREE from 'three';

export function buildOpeningGlassGeometry(
  openingWidth: number,
  openingHeight: number,
  frameThickness: number,
  glassThickness: number,
  glassInset: number,
  frameDepth: number
): THREE.BufferGeometry {
  const width = Math.max(openingWidth - frameThickness * 2, 0.001);
  const height = Math.max(openingHeight - frameThickness * 2, 0.001);
  const thickness = Math.max(glassThickness, 0.001);
  const geometry = new THREE.BoxGeometry(width, height, thickness);

  const maxInset = Math.max((frameDepth - thickness) / 2, 0);
  const clampedInset = Math.min(Math.max(glassInset, -maxInset), maxInset);
  geometry.translate(0, 0, clampedInset);

  return geometry;
}
