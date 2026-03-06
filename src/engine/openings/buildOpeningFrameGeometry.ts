import * as THREE from 'three';

export function buildOpeningFrameGeometry(
  openingWidth: number,
  openingHeight: number,
  frameThickness: number,
  frameDepth: number
): THREE.BufferGeometry {
  const halfW = openingWidth / 2;
  const halfH = openingHeight / 2;
  const innerHalfW = Math.max(halfW - frameThickness, 0.001);
  const innerHalfH = Math.max(halfH - frameThickness, 0.001);

  const shape = new THREE.Shape();
  shape.moveTo(-halfW, -halfH);
  shape.lineTo(halfW, -halfH);
  shape.lineTo(halfW, halfH);
  shape.lineTo(-halfW, halfH);
  shape.lineTo(-halfW, -halfH);

  const hole = new THREE.Path();
  hole.moveTo(-innerHalfW, -innerHalfH);
  hole.lineTo(-innerHalfW, innerHalfH);
  hole.lineTo(innerHalfW, innerHalfH);
  hole.lineTo(innerHalfW, -innerHalfH);
  hole.lineTo(-innerHalfW, -innerHalfH);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: frameDepth,
    bevelEnabled: false,
  });

  geometry.translate(0, 0, -frameDepth / 2);
  geometry.computeVertexNormals();
  return geometry;
}
