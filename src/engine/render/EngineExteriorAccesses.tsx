import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { ArchitecturalMaterials } from '../architecturalTypes';
import type { DerivedExteriorAccessPart } from '../derive/types/DerivedExteriorAccess';
import { createWallMaterial } from '../materials/materialResolver';
import { archToWorldXZ } from '../spaceMapping';

type EngineExteriorAccessesProps = {
  parts: DerivedExteriorAccessPart[];
  visible?: boolean;
  wallMaterialSpec?: ArchitecturalMaterials['walls'];
};

const MATERIAL_BY_KIND: Record<DerivedExteriorAccessPart['kind'], THREE.MeshStandardMaterialParameters> = {
  floor: { color: '#b9b3aa', roughness: 0.92, metalness: 0.04 },
  'retaining-wall': { color: '#c7c2b8', roughness: 0.95, metalness: 0.02 },
  'stair-step': { color: '#cfc9bf', roughness: 0.9, metalness: 0.03 },
};

export function EngineExteriorAccesses({
  parts,
  visible = true,
  wallMaterialSpec,
}: EngineExteriorAccessesProps) {
  const materialsByKind = useMemo<Record<DerivedExteriorAccessPart['kind'], THREE.Material>>(
    () => ({
      floor: new THREE.MeshStandardMaterial(MATERIAL_BY_KIND.floor),
      'retaining-wall': new THREE.MeshStandardMaterial(MATERIAL_BY_KIND['retaining-wall']),
      'guard-wall': createWallMaterial(wallMaterialSpec),
      'stair-step': new THREE.MeshStandardMaterial(MATERIAL_BY_KIND['stair-step']),
    }),
    [wallMaterialSpec]
  );

  useEffect(
    () => () => {
      Object.values(materialsByKind).forEach((material) => material.dispose());
    },
    [materialsByKind]
  );

  if (!visible || !parts.length) {
    return null;
  }

  return (
    <>
      {parts.map((part) => {
        const tangentXZ = archToWorldXZ(part.tangentXZ);
        const outwardXZ = archToWorldXZ(part.outwardXZ);
        const centerXZ = archToWorldXZ({ x: part.centerArch.x, z: part.centerArch.z });

        const tangent = new THREE.Vector3(tangentXZ.x, 0, tangentXZ.z).normalize();
        const outward = new THREE.Vector3(outwardXZ.x, 0, outwardXZ.z).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const basis = new THREE.Matrix4().makeBasis(tangent, up, outward);
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

        return (
          <mesh
            castShadow
            receiveShadow
            key={part.id}
            position={[centerXZ.x, part.centerArch.y, centerXZ.z]}
            quaternion={quaternion.toArray()}
            userData={{ debugType: 'structure' }}
          >
            <boxGeometry args={[part.size.x, part.size.y, part.size.z]} />
            <primitive object={materialsByKind[part.kind]} attach="material" />
          </mesh>
        );
      })}
    </>
  );
}
