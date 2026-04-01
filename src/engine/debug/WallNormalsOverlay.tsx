import type { DerivedWallSegment } from '../derive/types/DerivedWallSegment';
import { EdgeVisualizer } from './EdgeVisualizer';

type Props = {
  walls: DerivedWallSegment[];
};

export function WallNormalsOverlay({ walls }: Props) {
  return <EdgeVisualizer walls={walls} />;
}
