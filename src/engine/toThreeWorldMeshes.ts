import type { EngineMesh } from './builders/buildWindowMeshes';
import { archToWorldXZ } from './spaceMapping';

export function toThreeWorldMeshes(meshes: EngineMesh[]): EngineMesh[] {
  console.log('RENDERING MESH COUNT:', meshes.length);

  return meshes.map((mesh) => {
    const [x, y, z] = mesh.position;
    const [rx, ry, rz] = mesh.rotation;
    const mapped = archToWorldXZ({ x, z });

    return {
      ...mesh,
      geometry: mesh.geometry.clone(),
      position: [mapped.x, y, mapped.z],
      rotation: [rx, -ry, rz],
    };
  });
}
