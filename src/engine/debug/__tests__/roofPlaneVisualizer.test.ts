import { parseDebugFlags } from '../debugFlags';

const flags = parseDebugFlags('?debug=1&roofPlanes=1');
if (!flags.showRoofPlanes) {
  throw new Error('roof plane visualizer should only mount when roofPlanes=1');
}
