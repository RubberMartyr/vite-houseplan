import * as THREE from 'three';

const debugWindowMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: false,
  side: THREE.DoubleSide,
  depthTest: false,
});

export const frameMaterial = debugWindowMaterial;

export const blueStoneMaterial = new THREE.MeshStandardMaterial({
  color: '#5f6b73',
  roughness: 0.8,
  metalness: 0.0,
  side: THREE.DoubleSide,
});

export const glassMaterial = debugWindowMaterial;

export const metalBandMaterial = debugWindowMaterial;

export const revealMaterial = debugWindowMaterial;

export const frontBlueStoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a2f33,
  roughness: 0.85,
  metalness: 0.05,
});

export const anthraciteStoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f1f1f,
  roughness: 0.82,
  metalness: 0.05,
});

export const oakMaterial = new THREE.MeshStandardMaterial({
  color: 0xd7b58a,
  roughness: 0.75,
  metalness: 0.0,
});

export const doorGlassMaterial = new THREE.MeshStandardMaterial({
  color: 0x99aabb,
  transparent: true,
  opacity: 0.35,
  roughness: 0.2,
  metalness: 0.0,
});

export const anthraciteBandMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b,
  roughness: 0.7,
  metalness: 0.1,
});
