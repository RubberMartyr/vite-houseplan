import React, { useEffect, useMemo, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  roofsValue: unknown;
  onApply: (nextRoofs: any[]) => void;
};

const DRAFT_STORAGE_KEY = 'hv.roofEditor.draft';

export function RoofJsonEditorPanel({ isOpen, onClose, roofsValue, onApply }: Props) {
  const currentText = useMemo(() => JSON.stringify(roofsValue ?? [], null, 2), [roofsValue]);
  const [draftText, setDraftText] = useState<string>(currentText);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const persisted = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (persisted && persisted.trim().length > 0) {
      setDraftText(persisted);
      return;
    }

    setDraftText(currentText);
  }, [currentText, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, draftText);
  }, [draftText, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleApply = () => {
    try {
      const parsed = JSON.parse(draftText);
      if (!Array.isArray(parsed)) {
        setParseError('Root value must be an array of roofs.');
        return;
      }

      setParseError(null);
      onApply(parsed);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleReset = () => {
    setParseError(null);
    setDraftText(currentText);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, currentText);
  };

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 'min(520px, 95vw)',
        height: '100%',
        background: 'rgba(24, 24, 24, 0.97)',
        color: '#f4f4f4',
        borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.35)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Roof JSON Editor</strong>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      <textarea
        value={draftText}
        onChange={(event) => setDraftText(event.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 220,
          resize: 'none',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 12,
          lineHeight: 1.5,
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: '#121212',
          color: '#f5f5f5',
          padding: 12,
        }}
      />

      {parseError && (
        <div
          style={{
            background: 'rgba(190, 28, 28, 0.2)',
            border: '1px solid rgba(248, 113, 113, 0.6)',
            borderRadius: 6,
            padding: 10,
            color: '#fecaca',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          }}
        >
          {parseError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={handleReset}>Reset to current</button>
        <button type="button" onClick={handleApply}>Apply</button>
      </div>
    </aside>
  );
}
