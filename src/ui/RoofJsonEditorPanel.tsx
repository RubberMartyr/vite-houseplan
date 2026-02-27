import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MultiPlaneRoofSpec } from '../engine/types';
import { validateMultiPlaneRoof, type MultiPlaneRoofValidationResult } from '../engine/validation/validateMultiPlaneRoof';

type RoofValidationEntry = { roof: MultiPlaneRoofSpec; validation: MultiPlaneRoofValidationResult };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  roofsValue: unknown;
  validationEntries: RoofValidationEntry[];
  onDebouncedValidate: (entries: RoofValidationEntry[]) => void;
  onHoverRidge?: (ridgeId: string | null) => void;
  onApply: (nextRoofs: any[]) => void;
};

const DRAFT_STORAGE_KEY = 'hv.roofEditor.draft';

export function RoofJsonEditorPanel({ isOpen, onClose, roofsValue, validationEntries, onDebouncedValidate, onHoverRidge, onApply }: Props) {
  const currentText = useMemo(() => JSON.stringify(roofsValue ?? [], null, 2), [roofsValue]);
  const [draftText, setDraftText] = useState<string>(currentText);
  const [parseError, setParseError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    const id = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(draftText);
        if (!Array.isArray(parsed)) return;
        const entries = parsed
          .filter((roof): roof is MultiPlaneRoofSpec => !!roof && roof.type === 'multi-plane')
          .map((roof) => ({ roof, validation: validateMultiPlaneRoof(roof) }));
        onDebouncedValidate(entries);
      } catch {
        // ignored: user can type incomplete json while editing
      }
    }, 250);

    return () => window.clearTimeout(id);
  }, [draftText, isOpen, onDebouncedValidate]);

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

  const allErrors = validationEntries.flatMap((entry) => entry.validation.errors);
  const allWarnings = validationEntries.flatMap((entry) => entry.validation.warnings);

  const focusPathInEditor = (path: string | undefined) => {
    if (!path || !textareaRef.current) return;
    const token = path.includes('id=') ? path.split('id=')[1].replace(']', '') : path;
    const idx = draftText.indexOf(token.replace(/"/g, ''));
    if (idx < 0) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(idx, idx + token.length);
    textareaRef.current.scrollTop = Math.max(0, (idx / draftText.length) * textareaRef.current.scrollHeight - 120);
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

      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 }}>
        ❌ {allErrors.length} Errors &nbsp; ⚠ {allWarnings.length} Warnings
      </div>

      <textarea
        ref={textareaRef}
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

      {allErrors.length > 0 && (
        <div style={{ maxHeight: 140, overflow: 'auto', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: 8 }}>
          {allErrors.map((error, index) => (
            <button
              key={`${error.code}-${index}`}
              type="button"
              onClick={() => focusPathInEditor(error.path)}
              onMouseEnter={() => onHoverRidge?.(error.ridgeId ?? null)}
              onMouseLeave={() => onHoverRidge?.(null)}
              style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6, background: 'transparent', color: '#fecaca' }}
            >
              {error.message}
            </button>
          ))}
        </div>
      )}

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
