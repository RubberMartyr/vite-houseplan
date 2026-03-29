import { useMemo, useState } from 'react';
import type { ValidationLogEntry } from './RenderingTab';

type Props = {
  onRunFloorplanValidation: () => void;
  showFloorplanOverlay: boolean;
  onShowFloorplanOverlayChange: (enabled: boolean) => void;
  showValidationIssues: boolean;
  onShowValidationIssuesChange: (enabled: boolean) => void;
  onClearValidationOutput: () => void;
  validationLog?: ValidationLogEntry[];
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

export function FloorplanValidationTab({
  onRunFloorplanValidation,
  showFloorplanOverlay,
  onShowFloorplanOverlayChange,
  showValidationIssues,
  onShowValidationIssuesChange,
  onClearValidationOutput,
  validationLog = [],
}: Props) {
  const [localLog, setLocalLog] = useState<ValidationLogEntry[]>([]);
  const combinedLog = useMemo(() => [...localLog, ...validationLog], [localLog, validationLog]);

  const handleValidateClick = () => {
    const timestamp = new Date().toLocaleTimeString();
    setLocalLog((current) => [{ level: 'info', message: `[${timestamp}] Validation requested.` }, ...current]);
    onRunFloorplanValidation();
  };

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Floor Plan Validation</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ToggleRow
          label="Show floorplan layout"
          checked={showFloorplanOverlay}
          onChange={onShowFloorplanOverlayChange}
        />
        <ToggleRow
          label="Show validation issues"
          checked={showValidationIssues}
          onChange={onShowValidationIssuesChange}
        />
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleValidateClick}>
            Run Floorplan Validation
          </button>
          <button type="button" onClick={onClearValidationOutput}>
            Clear Validation Output
          </button>
        </div>

        <div
          style={{
            borderRadius: 10,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'rgba(2, 6, 23, 0.55)',
            padding: 10,
            minHeight: 80,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {(combinedLog.length === 0 ? [{ level: 'info', message: 'No validation runs yet.' }] : combinedLog).map((entry, index) => {
            const tone = entry.level === 'error' ? '#fca5a5' : entry.level === 'warn' ? '#fde68a' : '#86efac';
            const label = entry.level === 'error' ? 'Error' : entry.level === 'warn' ? 'Warn' : 'Info';

            return (
              <div key={`${entry.message}-${index}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: tone, fontWeight: 700, minWidth: 46 }}>{label}</span>
                <span>{entry.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
