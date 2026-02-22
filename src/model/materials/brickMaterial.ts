import * as THREE from 'three';
import { loadingManager } from '../../loadingManager';

const textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
textureLoader.manager = loadingManager;

const brickTexture = textureLoader.load('/textures/brick2.jpg');
brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.colorSpace = THREE.SRGBColorSpace;

export const brickMaterial = new THREE.MeshStandardMaterial({
  map: brickTexture,
  roughness: 1,
});
