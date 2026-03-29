type VisibilityState = {
  showSlabs: boolean;
  showWindows: boolean;
  showWalls: boolean;
  showRooms: boolean;
  showRoof: boolean;
};

type Props = {
  visibility: VisibilityState;
  onVisibilityChange: (nextVisibility: VisibilityState) => void;
};

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
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
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function VisibilityTab({ visibility, onVisibilityChange }: Props) {
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Visibility</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ToggleRow
          label="Show slabs"
          checked={visibility.showSlabs}
          onChange={(enabled) => onVisibilityChange({ ...visibility, showSlabs: enabled })}
        />
        <ToggleRow
          label="Show windows"
          checked={visibility.showWindows}
          onChange={(enabled) => onVisibilityChange({ ...visibility, showWindows: enabled })}
        />
        <ToggleRow
          label="Show walls"
          checked={visibility.showWalls}
          onChange={(enabled) => onVisibilityChange({ ...visibility, showWalls: enabled })}
        />
        <ToggleRow
          label="Show rooms"
          checked={visibility.showRooms}
          onChange={(enabled) => onVisibilityChange({ ...visibility, showRooms: enabled })}
        />
        <ToggleRow
          label="Show roof"
          checked={visibility.showRoof}
          onChange={(enabled) => onVisibilityChange({ ...visibility, showRoof: enabled })}
        />
      </div>
    </div>
  );
}

export type { VisibilityState };
