type Props = {
  wireframeEnabled: boolean;
  onWireframeChange: (enabled: boolean) => void;
};

export function RenderingTab({ wireframeEnabled, onWireframeChange }: Props) {
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Rendering</h3>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(148, 163, 184, 0.45)',
          background: 'rgba(15, 23, 42, 0.5)',
        }}
      >
        <input
          type="checkbox"
          checked={wireframeEnabled}
          onChange={(event) => onWireframeChange(event.target.checked)}
        />
        Wireframe mode
      </label>
    </div>
  );
}
