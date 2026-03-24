import * as THREE from 'three';
import type { SiteSpec, SiteSurfaceSpec, Vec2 } from '../architecturalTypes';
import { archToWorldXZ } from '../spaceMapping';

const textureCache = new Map<string, THREE.Texture>();

function getTexture(path: string): THREE.Texture {
  const existing = textureCache.get(path);
  if (existing) {
    return existing;
  }

  const texture = new THREE.TextureLoader().load(path);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(path, texture);
  return texture;
}

function getTextureWithRepeat(path: string, repeat?: [number, number]): THREE.Texture {
  const baseTexture = getTexture(path);
  if (!repeat) {
    return baseTexture;
  }

  const texture = baseTexture.clone();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.needsUpdate = true;
  return texture;
}

function createMaterialFromSpec(materialSpec?: SiteSurfaceSpec['material']): THREE.MeshStandardMaterial {
  if (!materialSpec) {
    return new THREE.MeshStandardMaterial({ color: '#cccccc', side: THREE.DoubleSide });
  }

  if (materialSpec.type === 'standard') {
    const map = materialSpec.texture ? getTextureWithRepeat(materialSpec.texture, materialSpec.repeat) : undefined;

    return new THREE.MeshStandardMaterial({
      map,
      color: materialSpec.color,
      roughness: materialSpec.roughness ?? 0.8,
      metalness: materialSpec.metalness ?? 0,
      side: THREE.DoubleSide,
    });
  }

  return new THREE.MeshStandardMaterial({ color: '#cccccc', side: THREE.DoubleSide });
}

function ensureClosedPolygon(points: Array<{ x: number; z: number }>) {
  if (points.length === 0) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (first.x === last.x && first.z === last.z) {
    return points;
  }

  return [...points, first];
}

function signedArea(points: Vec2[]) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.z - next.x * current.z;
  }

  return area / 2;
}

function addPolygonPath(shape: THREE.Shape | THREE.Path, points: Array<{ x: number; z: number }>) {
  points.forEach((point, index) => {
    const mapped = archToWorldXZ(point);
    if (index === 0) {
      shape.moveTo(mapped.x, mapped.z);
      return;
    }

    shape.lineTo(mapped.x, mapped.z);
  });
  shape.closePath();
}

function createFlatPolygonMesh(
  polygon: Vec2[],
  material: SiteSurfaceSpec['material'] | undefined,
  elevation: number,
): THREE.Mesh {
  const shape = new THREE.Shape();
  addPolygonPath(shape, ensureClosedPolygon(polygon));

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, elevation, 0);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, createMaterialFromSpec(material));
}

export function buildSiteMesh(site: SiteSpec, cutouts: Vec2[][] = []): THREE.Mesh {
  const shape = new THREE.Shape();
  addPolygonPath(shape, ensureClosedPolygon(site.footprint.outer));

  const footprintHoles = site.footprint.holes ?? [];
  [...footprintHoles, ...cutouts].forEach((holePoints) => {
    const closedHole = ensureClosedPolygon(holePoints);
    const normalizedHole = signedArea(closedHole) > 0 ? [...closedHole].reverse() : closedHole;
    const hole = new THREE.Path();
    addPolygonPath(hole, normalizedHole);
    shape.holes.push(hole);
  });

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, site.elevation ?? -0.001, 0);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: site.color ?? '#6DAA2C',
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

export function buildSiteSurfaceMeshes(site: SiteSpec): THREE.Mesh[] {
  const baseElevation = site.elevation ?? -0.001;

  return (site.surfaces ?? []).map((surface: SiteSurfaceSpec, index) => {
    const mesh = createFlatPolygonMesh(
      surface.polygon,
      surface.material,
      surface.elevation ?? baseElevation + 0.002 + index * 0.0005,
    );
    mesh.userData = {
      ...mesh.userData,
      siteSurfaceId: surface.id,
    };
    return mesh;
  });
}
