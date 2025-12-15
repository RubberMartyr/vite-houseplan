export class Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Color {
  value: string | number;
  constructor(value: string | number) {
    this.value = value;
  }
}

export class Shape {
  points: Array<{ x: number; y: number }> = [];
  moveTo(x: number, y: number) {
    this.points.push({ x, y });
  }
  lineTo(x: number, y: number) {
    this.points.push({ x, y });
  }
}

export class BoxGeometry {
  width: number;
  height: number;
  depth: number;
  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}

export class ExtrudeGeometry {
  shape: Shape;
  settings: Record<string, unknown>;
  constructor(shape: Shape, settings: Record<string, unknown>) {
    this.shape = shape;
    this.settings = settings;
  }
  rotateX(_radians: number) {}
  translate(_x: number, _y: number, _z: number) {}
}

export class MeshStandardMaterial {
  constructor(_options?: Record<string, unknown>) {}
}

export class MeshPhysicalMaterial extends MeshStandardMaterial {}

export class Mesh {
  geometry: unknown;
  material: unknown;
  position: Vector3 = new Vector3();
  visible = true;
  constructor(geometry?: unknown, material?: unknown) {
    this.geometry = geometry;
    this.material = material;
  }
}

export class Scene {
  background: Color | undefined;
  children: unknown[] = [];
  add(...objects: unknown[]) {
    this.children.push(...objects);
  }
}

export class PerspectiveCamera {
  position: Vector3 = new Vector3();
  aspect: number;
  constructor(_fov: number, aspect = 1, _near?: number, _far?: number) {
    this.aspect = aspect;
  }
  lookAt(_x: number, _y: number, _z: number) {}
  updateProjectionMatrix() {}
}

export class WebGLRenderer {
  domElement: HTMLCanvasElement;
  constructor(_options?: Record<string, unknown>) {
    this.domElement = document.createElement('canvas');
  }
  setPixelRatio(_ratio: number) {}
  setSize(_width: number, _height: number) {}
  render(_scene: Scene, _camera: PerspectiveCamera) {}
  dispose() {}
}

export class AmbientLight extends Mesh {
  constructor(public color?: number, public intensity?: number) {
    super();
  }
}

export class DirectionalLight extends Mesh {
  constructor(public color?: number, public intensity?: number) {
    super();
    this.position = new Vector3();
  }
}
