import * as THREE from 'three';
import type { SiteSurfaceSpec } from '../architecturalTypes';
import { archToWorldXZ } from '../spaceMapping';

const textureCache = new Map<string, THREE.Texture>();

function getTexture(path: string): THREE.Texture {
  const existing = textureCache.get(path);
  if (existing) {
    return existing;
  }

  const texture = new THREE.TextureLoader().load(path);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(path, texture);
  return texture;
}

function getTextureWithScale(path: string, scale?: { x: number; y: number }): THREE.Texture {
  const texture = getTexture(path).clone();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  if (scale) {
    texture.repeat.set(scale.x, scale.y);
  }

  texture.needsUpdate = true;
  return texture;
}

function createFenceMaterial(material?: SiteSurfaceSpec['material']): THREE.MeshStandardMaterial {
  if (!material) {
    return new THREE.MeshStandardMaterial({
      color: '#caa472',
      roughness: 0.8,
      metalness: 0,
      side: THREE.DoubleSide,
    });
  }

  const map = material.texture ? getTextureWithScale(material.texture, material.scale) : undefined;
  const normalMap = material.normalMap ? getTextureWithScale(material.normalMap, material.scale) : undefined;

  return new THREE.MeshStandardMaterial({
    map,
    normalMap,
    color: material.color,
    roughness: material.roughness ?? 0.8,
    metalness: material.metalness ?? 0,
    side: THREE.DoubleSide,
  });
}

export function buildFenceFromSurface(surface: SiteSurfaceSpec, elevation = 0): THREE.Mesh | null {
  const { polygon, height, material } = surface;

  if (!height || polygon.length < 3) {
    return null;
  }

  const shape = new THREE.Shape();

  polygon.forEach((point, index) => {
    const mapped = archToWorldXZ(point);
    if (index === 0) {
      shape.moveTo(mapped.x, mapped.z);
      return;
    }
    shape.lineTo(mapped.x, mapped.z);
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, elevation, 0);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, createFenceMaterial(material));
}
