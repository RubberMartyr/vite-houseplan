import { HouseViewer } from './HouseViewer';
import { architecturalProperty } from './engine/architecturalHouse';

export default function App() {
  return <HouseViewer model={architecturalProperty} mode="solid" showHelpers />;
}
