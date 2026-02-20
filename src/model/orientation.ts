import * as THREE from 'three';
import { frontZ, rearZ, leftX, rightX } from './houseSpec';
import { runtimeFlags } from '../runtimeFlags';

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
