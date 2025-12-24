// Adapted lightweight CSG implementation for subtracting BufferGeometries without external dependencies.
// Based on the classic BSP approach from https://evanw.github.io/csg.js/
// This is a fallback while npm registry access for three-bvh-csg is unavailable in this environment.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as THREE from 'three';

const EPS = 1e-5;

class Vertex {
  pos: THREE.Vector3;
  normal: THREE.Vector3;

  constructor(pos: THREE.Vector3, normal: THREE.Vector3) {
    this.pos = pos;
    this.normal = normal;
  }

  clone() {
    return new Vertex(this.pos.clone(), this.normal.clone());
  }

  flip() {
    this.normal.multiplyScalar(-1);
  }

  interpolate(other: Vertex, t: number) {
    return new Vertex(
      this.pos.clone().lerp(other.pos, t),
      this.normal.clone().lerp(other.normal, t)
    );
  }
}

class Plane {
  normal: THREE.Vector3;
  w: number;

  constructor(normal: THREE.Vector3, w: number) {
    this.normal = normal;
    this.w = w;
  }

  clone() {
    return new Plane(this.normal.clone(), this.w);
  }

  flip() {
    this.normal.multiplyScalar(-1);
    this.w *= -1;
  }

  static fromPoints(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    return new Plane(n, n.dot(a));
  }

  splitPolygon(
    polygon: Polygon,
    coplanarFront: Polygon[],
    coplanarBack: Polygon[],
    front: Polygon[],
    back: Polygon[]
  ) {
    const polygonType = { front: 0, back: 0, coplanar: 0, spanning: 0 };
    const types: number[] = [];

    polygon.vertices.forEach((vertex) => {
      const t = this.normal.dot(vertex.pos) - this.w;
      const type = t < -EPS ? -1 : t > EPS ? 1 : 0;
      polygonType[type === 1 ? 'front' : type === -1 ? 'back' : 'coplanar'] += 1;
      types.push(type);
    });

    if (polygonType.coplanar === polygon.vertices.length) {
      (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
    } else if (polygonType.front === polygon.vertices.length) {
      front.push(polygon);
    } else if (polygonType.back === polygon.vertices.length) {
      back.push(polygon);
    } else {
      const f: Vertex[] = [];
      const b: Vertex[] = [];
      for (let i = 0; i < polygon.vertices.length; i += 1) {
        const j = (i + 1) % polygon.vertices.length;
        const ti = types[i];
        const tj = types[j];
        const vi = polygon.vertices[i];
        const vj = polygon.vertices[j];

        if (ti !== -1) f.push(vi);
        if (ti !== 1) b.push(vi.clone());
        if ((ti | tj) === -1) {
          const t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.clone().sub(vi.pos));
          const v = vi.interpolate(vj, t);
          f.push(v);
          b.push(v.clone());
        }
      }

      if (f.length >= 3) front.push(new Polygon(f));
      if (b.length >= 3) back.push(new Polygon(b));
    }
  }
}

class Polygon {
  vertices: Vertex[];
  plane: Plane;

  constructor(vertices: Vertex[]) {
    this.vertices = vertices;
    this.plane = Plane.fromPoints(
      vertices[0].pos,
      vertices[1].pos,
      vertices[2].pos
    );
  }

  clone() {
    const verts = this.vertices.map((v) => v.clone());
    const poly = new Polygon(verts);
    poly.plane = this.plane.clone();
    return poly;
  }

  flip() {
    this.vertices.reverse().forEach((v) => v.flip());
    this.plane.flip();
  }
}

class Node {
  plane: Plane | null;
  front: Node | null;
  back: Node | null;
  polygons: Polygon[];

  constructor(polygons: Polygon[] = []) {
    this.plane = null;
    this.front = null;
    this.back = null;
    this.polygons = [];
    if (polygons.length) this.build(polygons);
  }

  clone() {
    const node = new Node();
    node.plane = this.plane && this.plane.clone();
    node.front = this.front && this.front.clone();
    node.back = this.back && this.back.clone();
    node.polygons = this.polygons.map((p) => p.clone());
    return node;
  }

  invert() {
    this.polygons.forEach((p) => p.flip());
    this.plane?.flip();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    const temp = this.front;
    this.front = this.back;
    this.back = temp;
  }

  clipPolygons(polygons: Polygon[]) {
    if (!this.plane) return polygons.slice();

    const front: Polygon[] = [];
    const back: Polygon[] = [];

    polygons.forEach((polygon) =>
      this.plane!.splitPolygon(polygon, front, back, front, back)
    );

    if (this.front) front.splice(0, front.length, ...this.front.clipPolygons(front));
    if (this.back) back.splice(0, back.length, ...this.back.clipPolygons(back));
    else back.length = 0;

    return [...front, ...back];
  }

  clipTo(node: Node) {
    this.polygons = node.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(node);
    if (this.back) this.back.clipTo(node);
  }

  allPolygons(): Polygon[] {
    let polygons = this.polygons.slice();
    if (this.front) polygons = polygons.concat(this.front.allPolygons());
    if (this.back) polygons = polygons.concat(this.back.allPolygons());
    return polygons;
  }

  build(polygons: Polygon[]) {
    if (!polygons.length) return;

    const stack: { node: Node; polygons: Polygon[] }[] = [{ node: this, polygons }];

    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;

      const { node, polygons: nodePolygons } = current;
      if (!nodePolygons.length) continue;

      if (!node.plane) node.plane = nodePolygons[0].plane.clone();

      const front: Polygon[] = [];
      const back: Polygon[] = [];

      nodePolygons.forEach((polygon) =>
        node.plane!.splitPolygon(polygon, node.polygons, node.polygons, front, back)
      );

      if (front.length) {
        if (!node.front) node.front = new Node();
        stack.push({ node: node.front, polygons: front });
      }

      if (back.length) {
        if (!node.back) node.back = new Node();
        stack.push({ node: node.back, polygons: back });
      }
    }
  }
}

class SimpleCSG {
  polygons: Polygon[];

  constructor(polygons: Polygon[]) {
    this.polygons = polygons;
  }

  clone() {
    return new SimpleCSG(this.polygons.map((p) => p.clone()));
  }

  static fromMesh(mesh: THREE.Mesh) {
    const matrix = mesh.matrixWorld || mesh.matrix || new THREE.Matrix4();
    const polygons = geometryToPolygons(mesh.geometry, matrix);
    return new SimpleCSG(polygons);
  }

  static toMesh(csg: SimpleCSG, matrix: THREE.Matrix4, material: THREE.Material | THREE.Material[]) {
    const geometry = polygonsToGeometry(csg.polygons, matrix);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, material);
  }

  subtract(csg: SimpleCSG) {
    const a = new Node(this.clone().polygons);
    const b = new Node(csg.clone().polygons);
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    return new SimpleCSG(a.allPolygons());
  }
}

function geometryToPolygons(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const geom = geometry.clone();
  const position = geom.attributes.position;
  const index = geom.index ? Array.from(geom.index.array) : null;
  const polygons: Polygon[] = [];
  const pos = new THREE.Vector3();

  const getVertex = (idx: number) => {
    pos.fromBufferAttribute(position as any, idx).applyMatrix4(matrix);
    return pos.clone();
  };

  const createPolygon = (ia: number, ib: number, ic: number) => {
    const va = getVertex(ia);
    const vb = getVertex(ib);
    const vc = getVertex(ic);
    const triangle = new THREE.Triangle(va, vb, vc);
    const normal = triangle.getNormal(new THREE.Vector3());
    const vertices = [
      new Vertex(va, normal.clone()),
      new Vertex(vb, normal.clone()),
      new Vertex(vc, normal.clone()),
    ];
    polygons.push(new Polygon(vertices));
  };

  if (index) {
    for (let i = 0; i < index.length; i += 3) {
      createPolygon(index[i], index[i + 1], index[i + 2]);
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      createPolygon(i, i + 1, i + 2);
    }
  }

  return polygons;
}

function polygonsToGeometry(polygons: Polygon[], matrix: THREE.Matrix4) {
  const positions: number[] = [];
  const normals: number[] = [];
  const inverse = matrix.clone().invert();

  polygons.forEach((polygon) => {
    for (let i = 2; i < polygon.vertices.length; i += 1) {
      const v0 = polygon.vertices[0];
      const v1 = polygon.vertices[i - 1];
      const v2 = polygon.vertices[i];

      [v0, v1, v2].forEach((v) => {
        const p = v.pos.clone().applyMatrix4(inverse);
        positions.push(p.x, p.y, p.z);
        normals.push(v.normal.x, v.normal.y, v.normal.z);
      });
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

export function subtractMeshes(base: THREE.Mesh, cutter: THREE.Mesh) {
  const baseCSG = SimpleCSG.fromMesh(base);
  const cutterCSG = SimpleCSG.fromMesh(cutter);
  const material = (base.material as THREE.Material | THREE.Material[]) || new THREE.MeshStandardMaterial();
  return SimpleCSG.toMesh(baseCSG.subtract(cutterCSG), base.matrix || new THREE.Matrix4(), material);
}
