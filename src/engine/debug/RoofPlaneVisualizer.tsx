import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { isDebugEnabled } from './debugFlags';
import { createGeometryCollectionCache } from '../cache/createGeometryCollectionCache';

type RoofTriangle = {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
};

type RoofFace = {
  id?: string;
  triangles?: RoofTriangle[];
};

type VisualizerRoof = {
  id?: string;
  faces?: RoofFace[];
};

type Props = {
  roofs: VisualizerRoof[];
  roofRevision: number;
};

type DisposableGeometry = {
  value: THREE.BufferGeometry;
  dispose: () => void;
};

function createDisposableGeometry(positions: number[]): DisposableGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  return {
    value: geometry,
    dispose: () => geometry.dispose(),
  };
}

export function RoofPlaneVisualizer({ roofs, roofRevision }: Props) {
  const geometryCache = useRef(createGeometryCollectionCache<DisposableGeometry>());

  const faceEntries = useMemo(() => {
    if (!isDebugEnabled()) {
      return [];
    }

    return roofs.flatMap((roof, roofIndex) => {
      if (!roof.faces) {
        return [];
      }

      return roof.faces.flatMap((face, faceIndex) => {
        const positions: number[] = [];

        for (const tri of face.triangles ?? []) {
          positions.push(...tri.a, ...tri.b, ...tri.c);
        }

        if (positions.length === 0) {
          return [];
        }

        const key = `${roof.id ?? roofIndex}:${face.id ?? faceIndex}`;
        const cached = geometryCache.current.get(key, roofRevision);
        if (cached) {
          console.log('[GeometryCache] reusing roof debug geometry', { key, revision: roofRevision });
          return [{ key, geometry: cached.value }];
        }

        console.log('[GeometryCache] rebuilding roof debug geometry', { key, revision: roofRevision });
        const next = createDisposableGeometry(positions);
        geometryCache.current.set(key, roofRevision, next);

        return [{ key, geometry: next.value }];
      });
    });
  }, [roofRevision, roofs]);

  const faceMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x44aaff,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  useEffect(() => {
    return () => {
      faceMaterial.dispose();
      geometryCache.current.dispose();
    };
  }, [faceMaterial]);

  if (!isDebugEnabled()) return null;

  return (
    <group>
      {faceEntries.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={faceMaterial} />
      ))}
    </group>
  );
}
