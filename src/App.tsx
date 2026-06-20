import { HouseViewer } from './HouseViewer';
import { architecturalHouse } from './engine/architecturalHouse';

export default function App() {
  return <HouseViewer model={architecturalHouse} mode="solid" showHelpers />;
}
