import * as THREE from 'three';

type ColorMaterialSpec = {
  type: 'color';
  value: string;
};

type TextureMaterialSpec = {
  type: 'texture';
  src: string;
  scale?: number;
};

type GlassMaterialSpec = {
  type: 'glass';
};

export type MaterialSpec = ColorMaterialSpec | TextureMaterialSpec | GlassMaterialSpec;

export function resolveMaterial(spec?: MaterialSpec): THREE.Material {
  if (!spec) {
    return new THREE.MeshStandardMaterial({ color: '#cccccc' });
  }

  if (spec.type === 'color') {
    return new THREE.MeshStandardMaterial({
      color: spec.value,
    });
  }

  if (spec.type === 'texture') {
    const tex = new THREE.TextureLoader().load(spec.src);

    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;

    if (spec.scale) {
      tex.repeat.set(spec.scale, spec.scale);
    }

    return new THREE.MeshStandardMaterial({
      map: tex,
    });
  }

  if (spec.type === 'glass') {
    return new THREE.MeshPhysicalMaterial({
      transmission: 1,
      roughness: 0.05,
      thickness: 0.02,
      transparent: true,
    });
  }

  return new THREE.MeshStandardMaterial({ color: '#cccccc' });
}
