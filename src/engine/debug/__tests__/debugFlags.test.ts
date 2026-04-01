import { parseDebugFlags } from '../debugFlags';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const enabled = parseDebugFlags('?debug=1');
assert(enabled.enabled, 'debug must be enabled only with ?debug=1');
assert(!parseDebugFlags('?debug=true').enabled, 'debug=true must not enable debug mode');
