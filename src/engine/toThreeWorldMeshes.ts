import type { EngineMesh } from './builders/buildWindowMeshes';
import { archToWorldXZ } from './spaceMapping';
import * as THREE from 'three';

export function toThreeWorldMeshes(meshes: EngineMesh[]): EngineMesh[] {
  console.log('RENDERING MESH COUNT:', meshes.length);

  const mappedMeshes = meshes.map((mesh) => {
    const [x, y, z] = mesh.position;
    const [rx, ry, rz] = mesh.rotation;
    const mapped = archToWorldXZ({ x, z });

    if (mesh.materialKey?.startsWith('window')) {
      const attr = mesh.geometry.getAttribute('position');
      console.log('WINDOW VERTEX COUNT:', attr?.count);

      if (attr && attr.count > 0) {
        console.log('FIRST THREE VERTICES:', [
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

  for (const mesh of mappedMeshes) {
    if (!mesh.materialKey.startsWith('window')) continue;
    // Quick test #4: inspect raw window geometry bounds for degenerate meshes.
    mesh.geometry.computeBoundingBox();
    console.log('WINDOW BOUNDS:', mesh.geometry.boundingBox);
  }

  const someWallMesh = mappedMeshes.find((mesh) => mesh.materialKey === 'wall');
  const someWindowMesh = mappedMeshes.find((mesh) => mesh.materialKey.startsWith('window'));

  if (someWallMesh && someWindowMesh) {
    console.log('WALL POS SAMPLE:', someWallMesh.position);
    console.log('WINDOW POS SAMPLE:', someWindowMesh.position);
    console.log('Z COMPARE (wall vs window):', {
      wallZ: someWallMesh.position[2],
      windowZ: someWindowMesh.position[2],
    });
    console.log('Z OFFSET', {
      wallZ: someWallMesh.position[2],
      windowZ: someWindowMesh.position[2],
      delta: someWindowMesh.position[2] - someWallMesh.position[2],
    });
  }

  return mappedMeshes;
}
