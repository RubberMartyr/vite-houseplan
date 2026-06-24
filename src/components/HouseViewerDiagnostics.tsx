import type { RenderModel } from '../model/normalizeHouseViewerModel';

type HouseViewerDiagnosticsProps = {
  renderModel: RenderModel;
  showHelpers?: boolean;
};

export function HouseViewerDiagnostics({ renderModel, showHelpers = false }: HouseViewerDiagnosticsProps) {
  const { diagnostics } = renderModel;
  const hasIssues =
    diagnostics.warnings.length > 0 ||
    diagnostics.errors.length > 0 ||
    diagnostics.info.length > 0 ||
    diagnostics.skippedLevels.length > 0;

  if (!showHelpers && !hasIssues) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 20,
        maxWidth: 360,
        padding: '12px 14px',
        borderRadius: 14,
        color: '#dbeafe',
        background: 'rgba(15, 23, 42, 0.82)',
        border: '1px solid rgba(147, 197, 253, 0.3)',
        boxShadow: '0 18px 38px rgba(15, 23, 42, 0.28)',
        fontSize: 12,
        lineHeight: 1.45,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 6 }}>HouseViewer diagnostics</div>
      <div>Parcel points: {diagnostics.inputSummary.parcelPointCount}</div>
      <div>Raw levels: {diagnostics.inputSummary.levelCount}</div>
      <div>Renderable levels: {diagnostics.inputSummary.renderableLevelCount}</div>
      <div>Renderable rooms: {diagnostics.inputSummary.renderableRoomCount}</div>
      <div>Renderable openings: {diagnostics.inputSummary.renderableOpeningCount}</div>
      <div>Skipped levels: {diagnostics.skippedLevels.length}</div>
      {diagnostics.errors.length > 0 && (
        <div style={{ marginTop: 8, color: '#fecaca' }}>
          <strong>Errors</strong>
          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
            {diagnostics.errors.map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {diagnostics.warnings.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>Warnings</strong>
          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
            {diagnostics.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {diagnostics.info.length > 0 && (
        <div style={{ marginTop: 8, color: '#bfdbfe' }}>
          <strong>Info</strong>
          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
            {diagnostics.info.map((info, index) => (
              <li key={`${info}-${index}`}>{info}</li>
            ))}
          </ul>
        </div>
      )}
      {diagnostics.skippedLevels.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>Skipped levels</strong>
          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
            {diagnostics.skippedLevels.map((level, index) => (
              <li key={`${level.id ?? 'level'}-${index}`}>
                {level.id ?? 'unknown'}: {level.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
