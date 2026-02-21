import type { WindowMesh } from './builders/buildSill';

/**
 * Backwards-compatible placeholder for legacy imports.
 *
 * Side facade window generation moved to the facade builders
 * (`buildFacadeAssembly` + `windowFactory`). Some older code paths still
 * import `windowsLeft` directly; exporting an empty mesh list keeps those
 * imports resolvable while the new pipeline renders side windows.
 */
export const windowsLeft: { meshes: WindowMesh[] } = {
  meshes: [],
};
