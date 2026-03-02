import type { EngineMesh } from './builders/buildWindowMeshes';
import { archToWorldXZ } from './spaceMapping';

export function toThreeWorldMeshes(meshes: EngineMesh[]): EngineMesh[] {
  console.log('RENDERING MESH COUNT:', meshes.length);

  const mappedMeshes = meshes.map((mesh) => {
    const [x, y, z] = mesh.position;
    const [rx, ry, rz] = mesh.rotation;
    const mapped = archToWorldXZ({ x, z });

    return {
      ...mesh,
      geometry: mesh.geometry.clone(),
      position: [mapped.x, y, mapped.z] as [number, number, number],
      rotation: [rx, -ry, rz] as [number, number, number],
    };
  });

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
