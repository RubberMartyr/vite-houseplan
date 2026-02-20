import * as THREE from 'three';
import { loadingManager } from '../../loadingManager';

const brickTexture = new THREE.TextureLoader(loadingManager).load('/textures/brick2.jpg');
brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.colorSpace = THREE.SRGBColorSpace;

export const brickMaterial = new THREE.MeshStandardMaterial({
  map: brickTexture,
  roughness: 1,
});
