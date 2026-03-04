import type { EngineMesh } from './builders/buildWindowMeshes';
import { archToWorldXZ } from './spaceMapping';
import * as THREE from 'three';
import { runtimeFlags } from '../model/runtimeFlags';

const isDebugEnabled = () => runtimeFlags.debugWindows || import.meta.env.DEV;

export function toThreeWorldMeshes(meshes: EngineMesh[]): EngineMesh[] {
  if (isDebugEnabled()) {
    console.log('[WORLD SPACE CHECK] source mesh count:', meshes.length);
  }

  const mappedMeshes = meshes.map((mesh) => {
    const [x, y, z] = mesh.position;
    const [rx, ry, rz] = mesh.rotation;
    const mapped = archToWorldXZ({ x, z });

    if (isDebugEnabled() && mesh.materialKey?.startsWith('window')) {
      const attr = mesh.geometry.getAttribute('position');
      console.log('[WORLD SPACE CHECK] window vertex count:', attr?.count);

      if (attr && attr.count > 0) {
        console.log('[WORLD SPACE CHECK] first three vertices:', [
          attr.getX(0),
          attr.getY(0),
          attr.getZ(0),
          attr.getX(1),
          attr.getY(1),
          attr.getZ(1),
          attr.getX(2),
          attr.getY(2),
          attr.getZ(2),
        ]);
      }
    }

    const geometry = mesh.materialKey?.startsWith('window')
      ? new THREE.BoxGeometry(1, 1, 0.1)
      : mesh.geometry.clone();

    return {
      ...mesh,
      geometry,
      position: [mapped.x, y, mapped.z] as [number, number, number],
      // Quick test #1: disable yaw inversion to verify whether mirrored rotation is hiding windows.
      rotation: [rx, ry, rz] as [number, number, number],
    };
  });

  if (isDebugEnabled()) {
    for (const mesh of mappedMeshes) {
      if (!mesh.materialKey.startsWith('window')) continue;
      mesh.geometry.computeBoundingBox();
      console.log('[WORLD SPACE CHECK] window bounds:', mesh.geometry.boundingBox);
    }
  }

  const someWallMesh = mappedMeshes.find((mesh) => mesh.materialKey === 'wall');
  const someWindowMesh = mappedMeshes.find((mesh) => mesh.materialKey.startsWith('window'));

  if (isDebugEnabled() && someWallMesh && someWindowMesh) {
    console.log('[WORLD SPACE CHECK] wall position:', someWallMesh.position);
    console.log('[WORLD SPACE CHECK] window position:', someWindowMesh.position);
    console.log('[WORLD SPACE CHECK] delta:', {
      x: someWindowMesh.position[0] - someWallMesh.position[0],
      y: someWindowMesh.position[1] - someWallMesh.position[1],
      z: someWindowMesh.position[2] - someWallMesh.position[2],
    });
  }

  return mappedMeshes;
}
