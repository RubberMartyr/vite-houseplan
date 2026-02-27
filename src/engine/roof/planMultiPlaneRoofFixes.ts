import type { MultiPlaneRoofSpec } from '../types';

export type RoofFixPatch =
  | {
      kind: 'syncRidgeDivider';
      faceId: string;
      ridgeId: string;
      itemIndex: number;
      nextA: { x: number; z: number };
      nextB: { x: number; z: number };
    };

export type RoofFixPlan = {
  ask: RoofFixPatch[];
  errors: string[];
};

function ridgeChanged(
  before: MultiPlaneRoofSpec,
  after: MultiPlaneRoofSpec,
  ridgeId: string,
) {
  const r0 = before.ridgeSegments.find((r) => r.id === ridgeId);
  const r1 = after.ridgeSegments.find((r) => r.id === ridgeId);
  if (!r0 || !r1) return false;
  return (
    r0.start.x !== r1.start.x ||
    r0.start.z !== r1.start.z ||
    r0.end.x !== r1.end.x ||
    r0.end.z !== r1.end.z
  );
}

export function planMultiPlaneRoofFixes(
  before: MultiPlaneRoofSpec,
  after: MultiPlaneRoofSpec,
): RoofFixPlan {
  const plan: RoofFixPlan = { ask: [], errors: [] };

  for (const ridge of after.ridgeSegments) {
    if (!ridgeChanged(before, after, ridge.id)) continue;

    for (const face of after.faces) {
      if (face.kind !== 'ridgeSideSegment') continue;
      if (face.ridgeId !== ridge.id) continue;

      const compound = face.region;
      if (!compound || compound.type !== 'compound') continue;

      compound.items.forEach((item: any, index: number) => {
        const looksLikeDivider =
          item &&
          typeof item === 'object' &&
          'a' in item &&
          'b' in item &&
          'keep' in item &&
          !('type' in item);

        if (!looksLikeDivider) return;

        plan.ask.push({
          kind: 'syncRidgeDivider',
          faceId: face.id,
          ridgeId: ridge.id,
          itemIndex: index,
          nextA: ridge.start,
          nextB: ridge.end,
        });
      });
    }
  }

  return plan;
}

export function applyRoofFixPlan(
  roof: MultiPlaneRoofSpec,
  plan: RoofFixPlan,
): MultiPlaneRoofSpec {
  if (plan.ask.length === 0) return roof;

  const clone = JSON.parse(JSON.stringify(roof)) as MultiPlaneRoofSpec;

  for (const patch of plan.ask) {
    const face = clone.faces.find((f) => f.id === patch.faceId);
    if (!face || face.kind !== 'ridgeSideSegment') continue;

    const compound = face.region;
    if (!compound || compound.type !== 'compound') continue;

    const item = compound.items[patch.itemIndex] as any;
    if (!item) continue;

    item.a = patch.nextA;
    item.b = patch.nextB;
  }

  return clone;
}
