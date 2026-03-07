import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  showEdges: boolean;
  showOpeningEdges: boolean;
};

function isTransparentMaterial(material: THREE.Material | THREE.Material[] | undefined): boolean {
  if (!material) return false;

  if (Array.isArray(material)) {
    return material.some((entry) => entry.transparent);
  }

  return material.transparent;
}

export function DebugEdges({ showEdges, showOpeningEdges }: Props) {
  const { scene } = useThree();

  useEffect(() => {
    if (!showEdges) {
      return;
    }

    const edges: THREE.LineSegments[] = [];

    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) {
        return;
      }

      const mesh = obj as THREE.Mesh;
      const isOpeningMesh = mesh.userData?.debugOpening === true;

      if (isOpeningMesh && !showOpeningEdges) {
        return;
      }

      if (!mesh.geometry || isTransparentMaterial(mesh.material)) {
        return;
      }

      const edgeGeo = new THREE.EdgesGeometry(mesh.geometry);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 1,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);

      edgeLines.position.copy(mesh.position);
      edgeLines.rotation.copy(mesh.rotation);
      edgeLines.scale.copy(mesh.scale);

      mesh.add(edgeLines);
      edges.push(edgeLines);
    });

    return () => {
      edges.forEach((edge) => {
        edge.removeFromParent();
        edge.geometry.dispose();

        const material = edge.material;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material.dispose();
        }
      });
    };
  }, [scene, showEdges, showOpeningEdges]);

  return null;
}
