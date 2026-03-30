import { useEffect, useMemo, useState } from 'react';
import type { ArchitecturalHouse, LevelSpec, RoofSpec } from '../../../architecturalTypes';
import { deriveHouse } from '../../../derive/deriveHouse';
import { getStructuralWallHeight } from '../../../derive/getStructuralWallHeight';
import { validateOpenings } from '../../../validation/validateOpenings';
import { validateRooms } from '../../../validation/validateRooms';
import { validateStructure } from '../../../validation/validateStructure';
import { validateMultiPlaneRoof } from '../../../validation/validateMultiPlaneRoof';

type ValidationEntry = {
  level: 'error' | 'warn' | 'info';
  message: string;
};

type ValidationResult = {
  success: boolean;
  entries: ValidationEntry[];
  parsedHouse: ArchitecturalHouse | null;
};

type Props = {
  initialJson: string;
  onApplyArchitecturalHouse: (house: ArchitecturalHouse) => void;
};

function validateArchitecturalHouse(jsonText: string): ValidationResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse JSON.';
    return {
      success: false,
      parsedHouse: null,
      entries: [{ level: 'error', message: `JSON parse error: ${message}` }],
    };
  }

  const candidate = parsed as ArchitecturalHouse;
  const entries: ValidationEntry[] = [];

  try {
    const structureReport = validateStructure(
      candidate,
      {
        getLevels: (house) => house.levels,
        getLevelElevation: (level) => (level as LevelSpec).elevation,
        getLevelHeight: (_level, index) => getStructuralWallHeight(candidate.levels, index),
        getSlabThickness: (level) => (level as LevelSpec).slab?.thickness ?? null,
        elevationConvention: 'TOP_OF_SLAB',
        allowGroundSupport: true,
      },
      { mode: 'report' }
    );

    for (const issue of structureReport.issues) {
      entries.push({
        level: issue.severity === 'error' ? 'error' : 'warn',
        message: issue.message,
      });
    }

    validateRooms(candidate);
    validateOpenings(candidate);

    for (const roof of candidate.roofs ?? []) {
      if (roof.type !== 'multi-plane') {
        continue;
      }

      const roofResult = validateMultiPlaneRoof(roof as Extract<RoofSpec, { type: 'multi-plane' }>);
      for (const error of roofResult.errors) {
        entries.push({ level: 'error', message: `Roof ${roof.id}: ${error.message}` });
      }
      for (const warning of roofResult.warnings) {
        entries.push({ level: 'warn', message: `Roof ${roof.id}: ${warning.message}` });
      }
    }

    deriveHouse(candidate);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed with an unknown error.';
    entries.push({ level: 'error', message });
  }

  if (entries.length === 0) {
    entries.push({ level: 'info', message: 'Validation successful.' });
  }

  const success = entries.every((entry) => entry.level !== 'error');
  return { success, entries, parsedHouse: success ? candidate : null };
}

export function JsonEditorTab({ initialJson, onApplyArchitecturalHouse }: Props) {
  const [draft, setDraft] = useState(initialJson);
  const [validation, setValidation] = useState<ValidationResult>({
    success: false,
    entries: [{ level: 'info', message: 'Edit JSON, then run Validate.' }],
    parsedHouse: null,
  });

  useEffect(() => {
    setDraft(initialJson);
    setValidation({
      success: false,
      entries: [{ level: 'info', message: 'Source JSON changed. Validate to apply new edits.' }],
      parsedHouse: null,
    });
  }, [initialJson]);

  const canApply = useMemo(() => validation.success && validation.parsedHouse !== null, [validation]);
  const copyAsTypeScript = async () => {
    try {
      const parsed = JSON.parse(draft) as ArchitecturalHouse;
      const typeScriptSnippet = `export const architecturalHouse: ArchitecturalHouse = ${JSON.stringify(parsed, null, 2)};`;
      await navigator.clipboard.writeText(typeScriptSnippet);
      setValidation({
        success: true,
        parsedHouse: parsed,
        entries: [{ level: 'info', message: 'Copied as TypeScript for architecturalHouse.ts.' }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to copy TypeScript snippet.';
      setValidation({
        success: false,
        parsedHouse: null,
        entries: [{ level: 'error', message }],
      });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto auto', gap: 12, minHeight: 0, height: '100%' }}>
      <h3 style={{ margin: 0 }}>JSON</h3>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: 0,
          resize: 'none',
          borderRadius: 10,
          border: '1px solid rgba(148, 163, 184, 0.45)',
          background: 'rgba(2, 6, 23, 0.85)',
          color: '#e2e8f0',
          padding: 12,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            try {
              const parsed = JSON.parse(draft) as ArchitecturalHouse;
              setDraft(JSON.stringify(parsed, null, 2));
            } catch {
              setValidation({
                success: false,
                parsedHouse: null,
                entries: [{ level: 'error', message: 'Cannot format because JSON is invalid.' }],
              });
            }
          }}
        >
          Format
        </button>
        <button type="button" onClick={() => setValidation(validateArchitecturalHouse(draft))}>
          Validate
        </button>
        <button type="button" onClick={copyAsTypeScript}>
          Copy as TS
        </button>
        <button
          type="button"
          disabled={!canApply}
          onClick={() => {
            if (!validation.parsedHouse) {
              return;
            }

            onApplyArchitecturalHouse(validation.parsedHouse);
            setValidation({
              success: true,
              parsedHouse: validation.parsedHouse,
              entries: [{ level: 'info', message: 'ArchitecturalHouse applied to scene.' }],
            });
          }}
        >
          Apply
        </button>
      </div>

      <div
        style={{
          borderRadius: 10,
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: 'rgba(2, 6, 23, 0.55)',
          padding: 10,
          minHeight: 80,
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        {validation.entries.map((entry, index) => {
          const tone = entry.level === 'error' ? '#fca5a5' : entry.level === 'warn' ? '#fde68a' : '#86efac';
          const label = entry.level === 'error' ? 'Error' : entry.level === 'warn' ? 'Warn' : 'OK';

          return (
            <div key={`${entry.message}-${index}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ color: tone, fontWeight: 700, minWidth: 46 }}>{label}</span>
              <span>{entry.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
