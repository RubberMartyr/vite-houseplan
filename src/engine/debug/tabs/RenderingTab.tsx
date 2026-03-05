import { useDebugUIState } from '../debugUIState';

export function RenderingTab() {
  const debugWireframe = useDebugUIState((state) => state.debugWireframe);
  const setDebugWireframe = useDebugUIState((state) => state.setDebugWireframe);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Rendering</h3>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={debugWireframe}
          onChange={(event) => setDebugWireframe(event.target.checked)}
        />
        Enable wireframe for all scene meshes
      </label>
    </div>
  );
}
