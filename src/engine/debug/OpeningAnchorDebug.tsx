import type { DerivedOpeningRect } from '../derive/types/derivedOpenings';
import { archToWorldVec3 } from '../spaceMapping';

type Props = {
  openings: DerivedOpeningRect[];
};

export function OpeningAnchorDebug({ openings }: Props) {
  return (
    <>
      {openings.map((opening) => {
        const position = archToWorldVec3(
          opening.centerArch.x,
          opening.centerArch.y,
          opening.centerArch.z
        );

        return (
          <mesh key={opening.id} position={position}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="red" />
          </mesh>
        );
      })}
    </>
  );
}
