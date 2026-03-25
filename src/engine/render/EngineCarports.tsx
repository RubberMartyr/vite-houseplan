import { Fragment, useMemo } from 'react';
import * as THREE from 'three';
import type { DerivedCarport } from '../derive/types/DerivedCarport';
import { DebugWireframe } from '../debug/DebugWireframe';
import { archToWorldVec3 } from '../spaceMapping';

type Props = {
  carports: DerivedCarport[];
  columnColor?: string;
  visible?: boolean;
};

const MATERIAL_COLORS: Record<string, string> = {
  flat_roof_dark: '#3a3a3a',
  wood_oak_light: '#c9a574',
};

function resolveColor(materialKey: string, fallback: string): string {
  return MATERIAL_COLORS[materialKey] ?? fallback;
}

function createRoofGeometry(carport: DerivedCarport): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  carport.roofPolygon.forEach((point, index) => {
    if (index === 0) {
      shape.moveTo(point.x, point.z);
    } else {
      shape.lineTo(point.x, point.z);
    }
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: carport.thickness,
    bevelEnabled: false,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, carport.elevation, 0);
  geometry.computeVertexNormals();

  return geometry;
}

function createColumnGeometry(column: DerivedCarport['columns'][number]): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(column.size, column.height, column.size);
  const worldCenter = archToWorldVec3(column.position.x, column.height / 2, column.position.z);
  geometry.translate(worldCenter.x, worldCenter.y, worldCenter.z);
  geometry.computeVertexNormals();
  return geometry;
}

export function EngineCarports({ carports, columnColor = '#383e42', visible = true }: Props) {
  const roofGeometries = useMemo(
    () =>
      carports.map((carport) => ({
        id: carport.id,
        topGeometry: createRoofGeometry(carport),
        lowerGeometry: createRoofGeometry({
          ...carport,
          thickness: carport.thickness * 2,
          elevation: carport.elevation - carport.thickness * 2,
        }),
        topMaterial: new THREE.MeshStandardMaterial({
          color: resolveColor(carport.material.roof, '#0f0f0f'),
          roughness: 1,
        }),
        lowerMaterial: new THREE.MeshStandardMaterial({
          color: '#1f1f1f',
          roughness: 1,
        }),
      })),
    [carports]
  );

  const columnGeometries = useMemo(
    () =>
      carports.flatMap((carport) =>
        carport.columns.map((column, index) => ({
          id: `${carport.id}-column-${index}`,
          geometry: createColumnGeometry(column),
          material: new THREE.MeshStandardMaterial({
            color: columnColor,
            roughness: 0.85,
          }),
        }))
      ),
    [carports, columnColor]
  );

  if (!visible) return null;

  return (
    <>
      {roofGeometries.map((entry) => (
        <Fragment key={entry.id}>
          <mesh key={`${entry.id}-lower`} geometry={entry.lowerGeometry} material={entry.lowerMaterial} castShadow receiveShadow>
            <DebugWireframe />
          </mesh>
          <mesh key={`${entry.id}-top`} geometry={entry.topGeometry} material={entry.topMaterial} castShadow receiveShadow>
            <DebugWireframe />
          </mesh>
        </Fragment>
      ))}
      {columnGeometries.map((entry) => (
        <mesh key={entry.id} geometry={entry.geometry} material={entry.material} castShadow receiveShadow>
          <DebugWireframe />
        </mesh>
      ))}
    </>
  );
}
