import type { EngineMesh } from './builders/buildWindowMeshes';
import { archToWorldXZ } from './spaceMapping';

export function toThreeWorldMeshes(meshes: EngineMesh[]): EngineMesh[] {
  console.log('RENDERING MESH COUNT:', meshes.length);

  const mappedMeshes = meshes.map((mesh) => {
    const [x, y, z] = mesh.position;
    const [rx, ry, rz] = mesh.rotation;
    const mapped = archToWorldXZ({ x, z });
    const outward = { x: Math.sin(ry), z: Math.cos(ry) };
    const isWindowMesh = mesh.materialKey.startsWith('window');

    return {
      ...mesh,
      geometry: mesh.geometry.clone(),
      // Quick test #3: push windows outward by 1m to check wall-embedding issues.
      position: [
        mapped.x + (isWindowMesh ? outward.x * 1 : 0),
        y,
        mapped.z + (isWindowMesh ? outward.z * 1 : 0),
      ] as [number, number, number],
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
  }

  return mappedMeshes;
}
