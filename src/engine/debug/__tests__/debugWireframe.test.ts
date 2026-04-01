import { parseDebugFlags } from '../debugFlags';

const flags = parseDebugFlags('?debug=1&wireframe=1');
if (!flags.showWireframe) {
  throw new Error('wireframe overlay should only mount when wireframe=1');
}
