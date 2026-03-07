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

type ResolveMaterialOptions = {
  side?: THREE.Side;
};

function normalizePublicTexturePath(src: string): string {
  const trimmed = src.trim();

  if (!trimmed) {
    return '/textures/brick1.jpg';
  }

  if (/^(https?:)?\/\//.test(trimmed) || /^(data|blob):/.test(trimmed)) {
    return trimmed;
  }

  const withoutDotSlash = trimmed.replace(/^\.\//, '');
  const withoutLeadingSlash = withoutDotSlash.replace(/^\//, '');

  if (withoutLeadingSlash.startsWith('textures/')) {
    return `/${withoutLeadingSlash}`;
  }

  return `/textures/${withoutLeadingSlash}`;
}

export function resolveMaterial(spec?: MaterialSpec, options?: ResolveMaterialOptions): THREE.Material {
  const side = options?.side;

  if (!spec) {
    return new THREE.MeshStandardMaterial({ color: '#cccccc', side });
  }

  if (spec.type === 'color') {
    return new THREE.MeshStandardMaterial({
      color: spec.value,
      side,
    });
  }

  if (spec.type === 'texture') {
    const tex = new THREE.TextureLoader().load(normalizePublicTexturePath(spec.src));

    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;

    if (spec.scale) {
      tex.repeat.set(spec.scale, spec.scale);
    }

    return new THREE.MeshStandardMaterial({
      map: tex,
      side,
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

  return new THREE.MeshStandardMaterial({ color: '#cccccc', side });
}
