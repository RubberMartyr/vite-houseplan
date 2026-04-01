import { isDebugEnabled } from './ui/debugMode';

export { isDebugEnabled };

export type DebugFlags = {
  enabled: boolean;
  showWireframe: boolean;
  showRoofPlanes: boolean;
  showDerivedGraph: boolean;
};

export const debugFlags: DebugFlags = {
  get enabled(): boolean {
    return isDebugEnabled();
  },
  showWireframe: false,
  showRoofPlanes: false,
  showDerivedGraph: false,
};
