import * as THREE from 'three';
import type { DerivedOpeningRect } from '../derived/derivedOpenings';
import { archToWorldXZ } from '../spaceMapping';

export type StackedWindowRenderPart = {
  key: string;
  size: [number, number, number];
  position: [number, number, number];
  quaternion: [number, number, number, number];
};

const POSITION_EPSILON = 1e-4;
const DIRECTION_EPSILON = 1e-4;
const GAP_EPSILON = 1e-4;
const FACADE_OFFSET_EPSILON = 0.01;

function areClose(a: number, b: number, epsilon = POSITION_EPSILON) {
  return Math.abs(a - b) <= epsilon;
}

function resolveFrameEdgeThickness(
  widthOrHeight: number,
  frameEnabled: boolean,
  frameThickness: number
) {
  return frameEnabled ? Math.min(frameThickness, widthOrHeight) : 0;
}

function getOpeningTop(opening: DerivedOpeningRect) {
  return opening.centerArch.y + opening.height / 2;
}

function getOpeningBottom(opening: DerivedOpeningRect) {
  return opening.centerArch.y - opening.height / 2;
}

function matchesVerticalStack(lower: DerivedOpeningRect, upper: DerivedOpeningRect) {
  const lowerEdges = lower.style.frameEdges;
  const upperEdges = upper.style.frameEdges;

  if (lower.kind !== 'window' || upper.kind !== 'window') return false;
  if (lowerEdges?.top !== false || upperEdges?.bottom !== false) return false;
  if (!areClose(lower.width, upper.width)) return false;
  if (!areClose(lower.centerArch.x, upper.centerArch.x)) return false;
  if (!areClose(lower.centerArch.z, upper.centerArch.z)) return false;
  if (!areClose(lower.tangentXZ.x, upper.tangentXZ.x, DIRECTION_EPSILON)) return false;
  if (!areClose(lower.tangentXZ.z, upper.tangentXZ.z, DIRECTION_EPSILON)) return false;
  if (!areClose(lower.outwardXZ.x, upper.outwardXZ.x, DIRECTION_EPSILON)) return false;
  if (!areClose(lower.outwardXZ.z, upper.outwardXZ.z, DIRECTION_EPSILON)) return false;

  return getOpeningTop(lower) < getOpeningBottom(upper) - GAP_EPSILON;
}

export function resolveStackedWindowRenderParts(
  openings: DerivedOpeningRect[],
  wallThickness: number
): StackedWindowRenderPart[] {
  const windows = openings
    .filter((opening) => opening.kind === 'window')
    .slice()
    .sort((a, b) => getOpeningBottom(a) - getOpeningBottom(b));

  const parts: StackedWindowRenderPart[] = [];

  for (let index = 0; index < windows.length; index += 1) {
    const lower = windows[index];

    for (let candidateIndex = index + 1; candidateIndex < windows.length; candidateIndex += 1) {
      const upper = windows[candidateIndex];

      if (!matchesVerticalStack(lower, upper)) {
        continue;
      }

      const leftThickness = Math.max(
        resolveFrameEdgeThickness(lower.width, lower.style.frameEdges?.left !== false, lower.style.frameThickness),
        resolveFrameEdgeThickness(upper.width, upper.style.frameEdges?.left !== false, upper.style.frameThickness)
      );
      const rightThickness = Math.max(
        resolveFrameEdgeThickness(lower.width, lower.style.frameEdges?.right !== false, lower.style.frameThickness),
        resolveFrameEdgeThickness(upper.width, upper.style.frameEdges?.right !== false, upper.style.frameThickness)
      );
      const separatorWidth = Math.max(0.01, Math.min(lower.width, upper.width) - leftThickness - rightThickness);
      const separatorDepth = Math.max(lower.style.frameDepth, upper.style.frameDepth, 0.01);
      const separatorBottom = getOpeningTop(lower);
      const separatorTop = getOpeningBottom(upper);
      const separatorHeight = separatorTop - separatorBottom;

      if (separatorHeight <= GAP_EPSILON) {
        break;
      }

      const tangentXZ = archToWorldXZ({ x: lower.tangentXZ.x, z: lower.tangentXZ.z });
      const outwardXZ = archToWorldXZ({ x: lower.outwardXZ.x, z: lower.outwardXZ.z });
      const tangent = new THREE.Vector3(tangentXZ.x, 0, tangentXZ.z).normalize();
      const outward = new THREE.Vector3(outwardXZ.x, 0, outwardXZ.z).normalize();
      const up = new THREE.Vector3(0, 1, 0);

      const centerXZ = archToWorldXZ({ x: lower.centerArch.x, z: lower.centerArch.z });
      const center = new THREE.Vector3(
        centerXZ.x,
        separatorBottom + separatorHeight / 2,
        centerXZ.z
      );
      const outwardOffset = outward.clone().multiplyScalar(
        Math.max(wallThickness / 2 - separatorDepth / 2 - FACADE_OFFSET_EPSILON, 0)
      );
      center.add(outwardOffset);

      const basis = new THREE.Matrix4().makeBasis(tangent, up, outward);
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

      parts.push({
        key: `${lower.id}-${upper.id}-stack-separator`,
        size: [separatorWidth, separatorHeight, separatorDepth],
        position: center.toArray() as [number, number, number],
        quaternion: quaternion.toArray() as [number, number, number, number],
      });

      break;
    }
  }

  return parts;
}
