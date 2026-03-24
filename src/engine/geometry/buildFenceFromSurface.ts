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
  });
}

export function buildFenceFromSurface(surface: SiteSurfaceSpec, elevation = 0): THREE.Group | null {
  const { polygon, height, material, fence } = surface;

  if (!height || !fence || polygon.length < 2) {
    return null;
  }

  const [p0, p1] = polygon;
  const dx = p1.x - p0.x;
  const dz = p1.z - p0.z;
  const length = Math.hypot(dx, dz);

  if (length <= 0 || fence.baseWidth <= 0 || fence.thickness <= 0) {
    return null;
  }

  const stepPattern = fence.pattern.filter((value) => value > 0);
  if (stepPattern.length === 0) {
    return null;
  }

  const gap = Math.max(0, fence.gap);
  const dirX = dx / length;
  const dirZ = dz / length;
  const angle = Math.atan2(dirZ, dirX);
  const group = new THREE.Group();
  const sharedMaterial = createFenceMaterial(material);
  const patternLength = stepPattern.length;

  let cursor = 0;
  let index = 0;

  while (cursor < length) {
    const multiplier = stepPattern[index % patternLength];
    const slatWidth = fence.baseWidth * multiplier;
    if (slatWidth <= 0 || cursor + slatWidth > length) {
      break;
    }

    const baseX = p0.x + dirX * cursor;
    const baseZ = p0.z + dirZ * cursor;
    const centerX = baseX + dirX * (slatWidth / 2);
    const centerZ = baseZ + dirZ * (slatWidth / 2);
    const world = archToWorldXZ({ x: centerX, z: centerZ });

    const geometry = new THREE.BoxGeometry(slatWidth, height, fence.thickness);
    const mesh = new THREE.Mesh(geometry, sharedMaterial);
    mesh.position.set(world.x, elevation + height / 2, world.z);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    cursor += slatWidth + gap;
    index += 1;
  }

  return group;
}
