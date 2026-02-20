import { buildSideWindows } from './builders/buildSideWindows';
import { sideWindowSpecs } from './builders/windowFactory';

export const windowsLeft = {
  meshes: buildSideWindows({
    facade: 'left',
    specs: sideWindowSpecs,
  }),
};
