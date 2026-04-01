import { parseDebugFlags } from '../debugFlags';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(!parseDebugFlags('').enabled, 'debug overlays must not mount when debug is disabled');
