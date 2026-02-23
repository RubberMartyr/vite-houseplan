import * as THREE from 'three';
import { frontZ, rearZ, leftX, rightX } from './houseSpec';
import { runtimeFlags } from './runtimeFlags';

export type Facade = 'front' | 'rear' | 'left' | 'right';

type FacadePlane = {
  axis: 'x' | 'z';
  value: number;
  outwardNormal: THREE.Vector3;
};

const planes: Record<Facade, FacadePlane> = {
  front: { axis: 'z', value: frontZ, outwardNormal: new THREE.Vector3(0, 0, -1) },
  rear: { axis: 'z', value: rearZ, outwardNormal: new THREE.Vector3(0, 0, 1) },
  left: { axis: 'x', value: leftX, outwardNormal: new THREE.Vector3(-1, 0, 0) },
  right: { axis: 'x', value: rightX, outwardNormal: new THREE.Vector3(1, 0, 0) },
};

export function getFacadePlane(facade: Facade): FacadePlane {
  const { axis, value, outwardNormal } = planes[facade];
  return {
    axis,
    value,
    outwardNormal: outwardNormal.clone(),
  };
}

export function facadeToWorldSign(facade: Facade): 1 | -1 {
  return facade === 'rear' || facade === 'right' ? 1 : -1;
}

export function isPointOnFacade(point: { x: number; z: number }, facade: Facade, epsilon = 1e-3) {
  const { axis, value } = getFacadePlane(facade);
  const coord = axis === 'x' ? point.x : point.z;
  return Math.abs(coord - value) <= epsilon;
}

export function logOrientationAssertions() {
  const summary = (facade: Facade) => {
    const { axis, value, outwardNormal } = getFacadePlane(facade);
    return { axis, value, outwardNormal: outwardNormal.toArray() };
  };

  if (runtimeFlags.isDev) {
    console.info('[orientation] facade planes', {
      front: summary('front'),
      rear: summary('rear'),
      left: summary('left'),
      right: summary('right'),
    });
  }
}

export function assertWorldOrientation() {
  if (!runtimeFlags.isDev) return;

  logOrientationAssertions();

  const leftPlane = getFacadePlane('left');
  const rightPlane = getFacadePlane('right');
  const frontPlane = getFacadePlane('front');
  const rearPlane = getFacadePlane('rear');

  const leftNormal = leftPlane.outwardNormal.toArray();
  const rightNormal = rightPlane.outwardNormal.toArray();
  const frontNormal = frontPlane.outwardNormal.toArray();
  const rearNormal = rearPlane.outwardNormal.toArray();

  const checks = {
    leftLessThanRight: leftX < rightX,
    frontLessThanRear: frontZ < rearZ,
    leftNormal: leftNormal[0] === -1 && leftNormal[1] === 0 && leftNormal[2] === 0,
    rightNormal: rightNormal[0] === 1 && rightNormal[1] === 0 && rightNormal[2] === 0,
    frontNormal: frontNormal[0] === 0 && frontNormal[1] === 0 && frontNormal[2] === -1,
    rearNormal: rearNormal[0] === 0 && rearNormal[1] === 0 && rearNormal[2] === 1,
  };

  console.info(
    '[orientation] contract: leftX < rightX, frontZ < rearZ, normals left(-1,0,0), right(1,0,0), front(0,0,-1), rear(0,0,1)',
    {
      leftX,
      rightX,
      frontZ,
      rearZ,
      leftNormal,
      rightNormal,
      frontNormal,
      rearNormal,
      checks,
    }
  );

  if (Object.values(checks).some((result) => !result)) {
    console.error('[orientation] WORLD ORIENTATION ASSERTION FAILED', {
      leftX,
      rightX,
      frontZ,
      rearZ,
      leftNormal,
      rightNormal,
      frontNormal,
      rearNormal,
      checks,
    });
  }
}

export function assertOrientationWorld(
  houseGroup: THREE.Object3D,
  camera: THREE.Camera,
  glDom: HTMLCanvasElement
) {
  const midX = (leftX + rightX) / 2;
  const midZ = (frontZ + rearZ) / 2;

  const worldPointFor = (point: THREE.Vector3) => houseGroup.localToWorld(point.clone());
  const screenPointFor = (point: THREE.Vector3) => {
    const projected = point.clone().project(camera);
    return {
      x: ((projected.x + 1) / 2) * glDom.clientWidth,
      y: ((1 - projected.y) / 2) * glDom.clientHeight,
    };
  };

  const leftWorld = worldPointFor(new THREE.Vector3(leftX, 0, midZ));
  const rightWorld = worldPointFor(new THREE.Vector3(rightX, 0, midZ));
  const frontWorld = worldPointFor(new THREE.Vector3(midX, 0, frontZ));
  const rearWorld = worldPointFor(new THREE.Vector3(midX, 0, rearZ));

  const orientation = {
    facades: {
      left: { world: leftWorld.toArray(), screen: screenPointFor(leftWorld) },
      right: { world: rightWorld.toArray(), screen: screenPointFor(rightWorld) },
      front: { world: frontWorld.toArray(), screen: screenPointFor(frontWorld) },
      rear: { world: rearWorld.toArray(), screen: screenPointFor(rearWorld) },
    },
  };

  console.info('[orientation] world-space orientation markers', orientation);

  const isLeftOnScreenLeft = orientation.facades.left.screen.x < orientation.facades.right.screen.x;
  console.assert(
    isLeftOnScreenLeft,
    '[orientation] Expected screen LEFT.x < RIGHT.x in world-space projection.',
    orientation
  );

  if (!isLeftOnScreenLeft) {
    console.error('[orientation] WORLD ORIENTATION SCREEN ASSERTION FAILED', orientation);
  }

  return orientation;
}
