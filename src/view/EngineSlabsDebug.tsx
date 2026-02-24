import type { DerivedSlab } from '../engine/deriveSlabs';

type EngineSlabsDebugProps = {
  slabs: DerivedSlab[];
  visible?: boolean;
};

export function EngineSlabsDebug({ slabs, visible = true }: EngineSlabsDebugProps) {
  if (!visible) {
    return null;
  }

  return (
    <>
      {slabs.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry}>
          <meshStandardMaterial color="cyan" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}
