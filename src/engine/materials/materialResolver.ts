import * as THREE from 'three';
import type { ArchitecturalMaterials } from '../architecturalTypes';

type WallMaterialSpec = ArchitecturalMaterials['walls'];
type RoofMaterialSpec = ArchitecturalMaterials['roof'];

function createTexture(path: string): THREE.Texture {
  const texture = new THREE.TextureLoader().load(path);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createWallMaterial(materialSpec?: WallMaterialSpec): THREE.MeshStandardMaterial {
  if (materialSpec?.texture) {
    const texture = createTexture(materialSpec.texture);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      side: THREE.DoubleSide,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: materialSpec?.color ?? '#cccccc',
    roughness: 1,
    side: THREE.DoubleSide,
  });
}

export function createRoofMaterial(materialSpec?: RoofMaterialSpec): THREE.MeshStandardMaterial {
  if (materialSpec?.texture) {
    return new THREE.MeshStandardMaterial({
      map: createTexture(materialSpec.texture),
      roughness: 1,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: materialSpec?.color ?? '#cccccc',
    roughness: 1,
  });
}
