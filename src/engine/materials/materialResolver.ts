import * as THREE from 'three';
import type { ArchitecturalMaterials } from '../architecturalTypes';

type WallMaterialSpec = ArchitecturalMaterials['walls'];
type RoofMaterialSpec = ArchitecturalMaterials['roof'];
type WindowMaterialSpec = ArchitecturalMaterials['windows'];

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

export function createWallMaterials(
  materialSpec?: WallMaterialSpec
): [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial, THREE.MeshStandardMaterial] {
  const exteriorColor = materialSpec?.exteriorColor ?? materialSpec?.color ?? '#cccccc';
  const interiorColor = materialSpec?.interiorColor ?? exteriorColor;
  const exteriorTexture = materialSpec?.texture ? createTexture(materialSpec.texture) : null;

  const exteriorMaterial = exteriorTexture
    ? new THREE.MeshStandardMaterial({
        map: exteriorTexture,
        roughness: 1,
        side: THREE.DoubleSide,
      })
    : new THREE.MeshStandardMaterial({
        color: exteriorColor,
        roughness: 1,
        side: THREE.DoubleSide,
      });

  const interiorMaterial = new THREE.MeshStandardMaterial({
    color: interiorColor,
    roughness: 1,
    side: THREE.DoubleSide,
  });

  const edgeMaterial = materialSpec?.edgeColor
    ? new THREE.MeshStandardMaterial({
        color: materialSpec.edgeColor,
        roughness: 1,
        side: THREE.DoubleSide,
      })
    : exteriorTexture
      ? new THREE.MeshStandardMaterial({
          map: exteriorTexture,
          roughness: 1,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshStandardMaterial({
          color: exteriorColor,
          roughness: 1,
          side: THREE.DoubleSide,
        });

  return [exteriorMaterial, interiorMaterial, edgeMaterial];
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

export function createOpeningMaterials(materialSpec?: WindowMaterialSpec): Record<
  'frame' | 'glass' | 'wood' | 'stone',
  THREE.MeshStandardMaterial
> {
  return {
    frame: new THREE.MeshStandardMaterial({
      color: materialSpec?.frameColor ?? '#f0f0f0',
      roughness: 0.8,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: materialSpec?.glassColor ?? '#a8d0ff',
      transparent: true,
      opacity: materialSpec?.glassOpacity ?? 0.35,
      roughness: 0.2,
      metalness: 0,
    }),
    wood: new THREE.MeshStandardMaterial({
      color: '#8f4026',
      roughness: 0.88,
      metalness: 0.04,
    }),
    stone: new THREE.MeshStandardMaterial({
      color: '#5f7486',
      roughness: 0.96,
      metalness: 0,
    }),
  };
}
