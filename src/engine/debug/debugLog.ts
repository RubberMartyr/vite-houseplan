import { debugFlags } from './debugFlags';

export function debugLog(scope: string, message: string, payload?: unknown): void {
  if (!debugFlags.enabled) {
    return;
  }

  const prefix = `[${scope}] ${message}`;
  if (payload === undefined) {
    console.log(prefix);
    return;
  }

  console.log(prefix, payload);
}
