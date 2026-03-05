import * as THREE from 'three';
import { isDebugEnabled } from './debugFlags';

type Props = {
  roofs: any[];
};

export function RoofPlaneVisualizer({ roofs }: Props) {
  if (!isDebugEnabled()) return null;

  const meshes = [];

  for (const roof of roofs) {
    if (!roof.faces) continue;

    for (const face of roof.faces) {
      const positions = [];

      for (const tri of face.triangles ?? []) {
        positions.push(...tri.a, ...tri.b, ...tri.c);
      }

      if (positions.length === 0) continue;

      const geometry = new THREE.BufferGeometry();

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      meshes.push(
        <mesh
          key={face.id ?? Math.random()}
          geometry={geometry}
          material={material}
        />
      );
    }
  }

  return <group>{meshes}</group>;
}
