export type FacadeSegment = { id: string; z0: number; z1: number; x: number };

export function xFaceForProfileAtZ(profile: readonly FacadeSegment[], z: number): number {
  const seg = profile.find((s) => z >= s.z0 && z <= s.z1) ?? profile[profile.length - 1];
  return seg.x;
}
