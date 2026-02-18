import * as THREE from 'three';

export const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#383E42',
  roughness: 0.55,
  metalness: 0.12,
});

export const blueStoneMaterial = new THREE.MeshStandardMaterial({
  color: '#5f6b73',
  roughness: 0.8,
  metalness: 0.0,
});

export const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#e6e8ea',
  transmission: 0.85,
  roughness: 0.05,
  ior: 1.5,
  metalness: 0,
  depthWrite: false,
  side: THREE.DoubleSide,
});

export const metalBandMaterial = new THREE.MeshStandardMaterial({
  color: 0x2f3237,
  roughness: 0.6,
  metalness: 0.2,
});

export const revealMaterial = new THREE.MeshStandardMaterial({
  color: '#e8e5df',
  roughness: 0.85,
  metalness: 0.05,
});

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
