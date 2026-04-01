export type DebugFlags = {
  enabled: boolean;
  showWireframe: boolean;
  showRoofPlanes: boolean;
  showDerivedGraph: boolean;
  showWallNormals: boolean;
  showOpenings: boolean;
};

export function parseDebugFlags(search: string): DebugFlags {
  const params = new URLSearchParams(search);

  return {
    enabled: params.get('debug') === '1',
    showWireframe: params.get('wireframe') === '1',
    showRoofPlanes: params.get('roofPlanes') === '1',
    showDerivedGraph: params.get('derivedGraph') === '1',
    showWallNormals: params.get('wallNormals') === '1',
    showOpenings: params.get('openings') === '1',
  };
}

function getRuntimeSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.search;
}

export const debugFlags: DebugFlags = new Proxy({} as DebugFlags, {
  get(_target, prop: keyof DebugFlags) {
    return parseDebugFlags(getRuntimeSearch())[prop];
  },
});
