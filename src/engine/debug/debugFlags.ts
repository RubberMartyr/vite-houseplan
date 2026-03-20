import { isDebugEnabled } from './ui/debugMode';

export { isDebugEnabled };

export const debugFlags = {
  get enabled(): boolean {
    return isDebugEnabled();
  },
};
