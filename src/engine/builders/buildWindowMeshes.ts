import * as THREE from 'three';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';

export type EngineMesh = {
  id: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  materialKey: 'wall' | 'windowFrame' | 'windowGlass' | 'windowSill' | 'windowLintel';
};

export type WindowBuilderConstants = {
  panelDepth: number;
  eps?: number;
  frameDepth?: number;
  frameBorder?: number;
  glassThickness?: number;
  sillDepth?: number;
  sillHeight?: number;
  lintelDepth?: number;
  lintelHeight?: number;
};

export function buildWindowMeshes(openings: DerivedOpeningRect[], constants: WindowBuilderConstants): EngineMesh[] {
  console.log('WINDOW MESH BUILD START');
  console.log('OPENINGS INPUT:', openings.length);
  const {
    panelDepth,
    eps = 0.001,
    frameDepth = 0.08,
    frameBorder = 0.08,
    glassThickness = 0.02,
    sillDepth = 0.08,
    sillHeight = 0.04,
    lintelDepth = 0.08,
    lintelHeight = 0.04,
  } = constants;

  const meshes: EngineMesh[] = [];
  const panelOut = panelDepth / 2;

  for (const opening of openings) {
    if (opening.kind !== 'window') continue;

    const width = opening.uMax - opening.uMin;
    const height = opening.vMax - opening.vMin;
    if (width <= 0 || height <= 0) continue;

    const forwardX = opening.outwardXZ.x;
    const forwardZ = opening.outwardXZ.z;
    const yaw = Math.atan2(forwardX, forwardZ);

    const frameCenterOffset = panelOut + frameDepth / 2 - eps;
    const frameCenter: [number, number, number] = [
      opening.centerArch.x + forwardX * frameCenterOffset,
      opening.centerArch.y,
      opening.centerArch.z + forwardZ * frameCenterOffset,
    ];

    console.log('WINDOW CENTER:', opening.centerArch);

    const frameGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    meshes.push({
      id: `${opening.id}_frame`,
      geometry: frameGeometry,
      position: frameCenter,
      rotation: [0, yaw, 0],
      materialKey: 'windowFrame',
    });

    const innerWidth = Math.max(0.01, width - frameBorder * 2);
    const innerHeight = Math.max(0.01, height - frameBorder * 2);
    const glassOffset = panelOut + frameDepth - glassThickness / 2 - eps;
    const glassPosition: [number, number, number] = [
      opening.centerArch.x + forwardX * glassOffset,
      opening.centerArch.y,
      opening.centerArch.z + forwardZ * glassOffset,
    ];

    meshes.push({
      id: `${opening.id}_glass`,
      geometry: new THREE.BoxGeometry(innerWidth, innerHeight, glassThickness),
      position: glassPosition,
      rotation: [0, yaw, 0],
      materialKey: 'windowGlass',
    });

    if (opening.style?.hasSill !== false) {
      const sillPos: [number, number, number] = [
        opening.centerArch.x + forwardX * (panelOut + sillDepth / 2 - eps),
        opening.centerArch.y - height / 2 - sillHeight / 2,
        opening.centerArch.z + forwardZ * (panelOut + sillDepth / 2 - eps),
      ];
      meshes.push({
        id: `${opening.id}_sill`,
        geometry: new THREE.BoxGeometry(width + frameBorder * 2, sillHeight, sillDepth),
        position: sillPos,
        rotation: [0, yaw, 0],
        materialKey: 'windowSill',
      });
    }

    if (opening.style?.hasLintel) {
      const lintelPos: [number, number, number] = [
        opening.centerArch.x + forwardX * (panelOut + lintelDepth / 2 - eps),
        opening.centerArch.y + height / 2 + lintelHeight / 2,
        opening.centerArch.z + forwardZ * (panelOut + lintelDepth / 2 - eps),
      ];
      meshes.push({
        id: `${opening.id}_lintel`,
        geometry: new THREE.BoxGeometry(width + frameBorder * 2, lintelHeight, lintelDepth),
        position: lintelPos,
        rotation: [0, yaw, 0],
        materialKey: 'windowLintel',
      });
    }
  }

  return meshes;
}
