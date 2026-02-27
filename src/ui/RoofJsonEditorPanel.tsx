import React, { useEffect, useMemo, useRef, useState } from 'react';

type ValidationSummary = {
  errors: number;
  warnings: number;
  reports: Array<{
    roofId: string;
    report: {
      errors: Array<{ message: string; ridgeId?: string; faceId?: string }>;
      warnings: Array<{ message: string; ridgeId?: string; faceId?: string }>;
    };
  }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  roofsValue: unknown;
  onApply: (nextRoofs: any[]) => void;
  validationSummary: ValidationSummary;
  onDraftValidation: (nextRoofs: any[] | null) => void;
  onHoverRidgeId?: (ridgeId: string | null) => void;
};

const DRAFT_STORAGE_KEY = 'hv.roofEditor.draft';

function parseRidgeIdFromLine(line: string): string | null {
  const ridgeKeyMatch = line.match(/"ridgeId"\s*:\s*"([^"]+)"/);
  if (ridgeKeyMatch?.[1]) return ridgeKeyMatch[1];
  return null;
}

export function RoofJsonEditorPanel({
  isOpen,
  onClose,
  roofsValue,
  onApply,
  validationSummary,
  onDraftValidation,
  onHoverRidgeId,
}: Props) {
  const currentText = useMemo(() => JSON.stringify(roofsValue ?? [], null, 2), [roofsValue]);
  const [draft, setDraft] = useState(currentText);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const persisted = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (persisted && persisted.trim().length > 0) {
      setDraft(persisted);
      return;
    }

    setDraft(currentText);
  }, [currentText, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, draft);
  }, [draft, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(draft);
        if (!Array.isArray(parsed)) {
          onDraftValidation(null);
          return;
        }
        onDraftValidation(parsed);
      } catch {
        onDraftValidation(null);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [draft, isOpen, onDraftValidation]);

  if (!isOpen) {
    return null;
  }

  const handleApply = () => {
    try {
      const parsed = JSON.parse(draft);
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
    setDraft(currentText);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, currentText);
    onHoverRidgeId?.(null);
  };

  const issueList = validationSummary.reports.flatMap((entry) => [
    ...entry.report.errors.map((issue) => ({ type: 'error' as const, roofId: entry.roofId, ...issue })),
    ...entry.report.warnings.map((issue) => ({ type: 'warning' as const, roofId: entry.roofId, ...issue })),
  ]);

  const focusIssueInJson = (issueId: string, ridgeId?: string, faceId?: string) => {
    const target = ridgeId ?? faceId;
    if (!target || !textareaRef.current) return;

    const text = textareaRef.current.value;
    const token = `"${target}"`;
    const idx = text.indexOf(token);
    if (idx < 0) return;

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(idx, idx + token.length);
    const line = text.slice(0, idx).split('\n').length;
    textareaRef.current.scrollTop = Math.max(0, (line - 4) * 18);
    setSelectedIssue(issueId);
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
        ❌ {validationSummary.errors} Errors&nbsp;&nbsp; ⚠ {validationSummary.warnings} Warnings
      </div>

      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onMouseMove={(event) => {
          const el = event.currentTarget;
          const lineHeight = 18;
          const row = Math.floor((event.nativeEvent.offsetY + el.scrollTop) / lineHeight);
          const line = (el.value.split('\n')[row] ?? '').trim();
          onHoverRidgeId?.(parseRidgeIdFromLine(line));
        }}
        onMouseLeave={() => onHoverRidgeId?.(null)}
        spellCheck={false}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 220,
          resize: 'none',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 12,
          lineHeight: '18px',
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

      {issueList.length > 0 && (
        <div style={{ maxHeight: 140, overflow: 'auto', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: 8 }}>
          {issueList.map((issue, idx) => {
            const key = `${issue.type}-${issue.roofId}-${issue.ridgeId ?? issue.faceId ?? idx}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => focusIssueInJson(key, issue.ridgeId, issue.faceId)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 6,
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  color: '#f4f4f4',
                  background: selectedIssue === key ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {issue.type === 'error' ? '❌' : '⚠'} {issue.message}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={handleReset}>Reset to current</button>
        <button type="button" onClick={handleApply}>Apply</button>
      </div>
    </aside>
  );
}
