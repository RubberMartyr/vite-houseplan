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

  if (length <= 0 || fence.slatWidth <= 0 || fence.thickness <= 0) {
    return null;
  }

  const step = fence.slatWidth + Math.max(0, fence.gap);
  if (step <= 0) {
    return null;
  }

  const dirX = dx / length;
  const dirZ = dz / length;
  const angle = Math.atan2(dirZ, dirX);
  const count = Math.floor(length / step);
  const group = new THREE.Group();
  const sharedMaterial = createFenceMaterial(material);

  for (let index = 0; index < count; index += 1) {
    const t = index * step + fence.slatWidth / 2;
    if (t + fence.slatWidth / 2 > length) {
      break;
    }

    const baseX = p0.x + dirX * t;
    const baseZ = p0.z + dirZ * t;
    const world = archToWorldXZ({ x: baseX, z: baseZ });

    const geometry = new THREE.BoxGeometry(fence.slatWidth, height, fence.thickness);
    const mesh = new THREE.Mesh(geometry, sharedMaterial);
    mesh.position.set(world.x, elevation + height / 2, world.z);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}
