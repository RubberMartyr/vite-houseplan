import Viewer from './components/HouseViewer';
import type { HouseViewerProps } from './types';

export function HouseViewer(props: HouseViewerProps) {
  return <Viewer {...props} />;
}

export type { HouseViewerProps };
