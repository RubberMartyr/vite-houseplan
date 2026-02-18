import { useState } from 'react'

type Priority = 'Foundation' | 'High Impact DRY' | 'Portability'
type Effort = 'Low' | 'Medium' | 'High'

type Step = {
  id: string
  label: string
  detail: string
  prompt: string
}

type Phase = {
  id: number
  title: string
  priority: Priority
  effort: Effort
  rationale: string
  files: string[]
  duplications: string[]
  steps: Step[]
}

const phases: Phase[] = [
  {
    id: 1,
    title: 'Extract Generic HouseSpec Interface',
    priority: 'Foundation',
    effort: 'Medium',
    rationale:
      'Everything else depends on this. Right now dimensions, polygon helpers, and unit conversion are scattered. Centralise into a typed interface so any house can be described and consumed uniformly.',
    files: ['houseSpec.ts', 'envelope.ts'],
    duplications: [
      'polygonArea() defined independently in both houseSpec.ts and envelope.ts',
      'ensureClockwise vs ensureCounterClockwise — two names, same algorithm, different files',
      'cmToMeters() inlined in houseSpec.ts with no export'
    ],
    steps: [
      {
        id: '1a',
        label: 'Create shared geometry utils',
        detail:
          'Move polygonArea(), ensureClockwise(), and lineIntersection() into a new src/utils/geometry.ts. Export them from there. Remove duplicates in houseSpec.ts and envelope.ts.',
        prompt: `Refactor houseSpec.ts and envelope.ts.

Move these shared geometry helpers into a new file src/utils/geometry.ts:
- polygonArea(points: EnvelopePoint[]): number
- ensureClockwise(points: EnvelopePoint[]): EnvelopePoint[]
- (in envelope.ts) normalizeVector, lineIntersection

Export all from geometry.ts. Update houseSpec.ts and envelope.ts to import from geometry.ts instead of defining locally. Delete any duplicate definitions.`
      },
      {
        id: '1b',
        label: 'Create a HouseSpec type and factory',
        detail:
          'Define a HouseSpec interface in src/types/HouseSpec.ts covering envelope outline, wall thickness, ceiling heights, level heights, and room specs. Refactor houseSpec.ts to export a value of that type.',
        prompt: `Create src/types/HouseSpec.ts with this interface:

export interface HouseSpec {
  envelopeOutline: EnvelopePoint[];
  wallThickness: { exterior: number; interior: number };
  ceilingHeights: Record<string, number>;
  levelHeights: Record<string, number>;
  originOffset: { x: number; z: number };
  groundFloorRooms: { [key: string]: any };
}

Then refactor houseSpec.ts so its named exports still work but also export a default const houseSpec: HouseSpec that bundles all values. This will let future houses be defined as a separate HouseSpec object without changing any consumers.`
      },
      {
        id: '1c',
        label: 'Export cmToMeters as a util',
        detail:
          'cmToMeters is used only inside houseSpec.ts but is a generally useful converter. Move it to src/utils/units.ts and import it back.',
        prompt: `Create src/utils/units.ts:

export const cmToMeters = (cm: number) => cm / 100;
export const metersToCm = (m: number) => m * 100;

Update houseSpec.ts to import cmToMeters from utils/units instead of defining it inline.`
      }
    ]
  },
  {
    id: 2,
    title: 'Unify Wall Shell Builder',
    priority: 'High Impact DRY',
    effort: 'Low',
    rationale:
      'wallsBasement.ts and wallsEavesBand.ts are nearly copy-paste. Both build an outer polygon, inset it, construct a Shape with a hole, extrude it, and rotate it. Extract a single builder function.',
    files: ['wallsBasement.ts', 'wallsEavesBand.ts'],
    duplications: [
      'toShapePoints() helper defined identically in both files',
      'Shape + hole construction loop (moveTo/lineTo/closePath) copy-pasted',
      'ExtrudeGeometry + rotateX(-PI/2) pattern repeated verbatim',
      'position: [0, y, 0] tuple structure duplicated'
    ],
    steps: [
      {
        id: '2a',
        label: 'Create buildExtrudedShellGeometry()',
        detail:
          'A single function taking outer points, inner thickness, and height — returns {geometry, position, rotation}.',
        prompt: `Create src/builders/buildExtrudedShell.ts:

import { ExtrudeGeometry, Path, Shape } from 'three';
import { FootprintPoint } from '../envelope';

export function buildExtrudedShell(params: {
  outerPoints: FootprintPoint[];
  innerPoints: FootprintPoint[];
  height: number;
  baseY: number;
}): { geometry: ExtrudeGeometry; position: [number, number, number]; rotation: [number, number, number] } {
  // Implementation: toShapePoints, build Shape, add hole Path, ExtrudeGeometry, rotateX(-PI/2)
  // Return { geometry, position: [0, baseY, 0], rotation: [0,0,0] }
}

Then refactor wallsBasement.ts and wallsEavesBand.ts to call buildExtrudedShell() instead of duplicating the construction logic. Both files should shrink to just their specific constants + a single function call.`
      }
    ]
  },
  {
    id: 3,
    title: 'Unify Window Materials & Frame Builder',
    priority: 'High Impact DRY',
    effort: 'Medium',
    rationale:
      'frameMaterial, blueStoneMaterial, and the frame shape construction (Shape with a rectangular hole, ExtrudeGeometry) are defined separately in windowsRear.ts and windowsSide.ts. The makeWindowMeshes() / createFrameGeometry() functions are parallel implementations of the same idea.',
    files: ['windowsRear.ts', 'windowsSide.ts', 'windowsFront.ts'],
    duplications: [
      'frameMaterial (color #383E42) defined in both windowsRear.ts and windowsSide.ts',
      'blueStoneMaterial defined in both windowsRear.ts and windowsSide.ts',
      'Frame shape construction (outer rect + inner rect hole + extrude) duplicated',
      'FRAME_DEPTH, FRAME_BORDER, GLASS_INSET, SILL_* constants repeated across files',
      'makeSill / createSill — parallel sill-building functions with the same output shape'
    ],
    steps: [
      {
        id: '3a',
        label: 'Create shared window materials',
        detail: 'Extract all shared materials into src/materials/windowMaterials.ts.',
        prompt: `Create src/materials/windowMaterials.ts with:
- frameMaterial (MeshStandardMaterial, #383E42)
- blueStoneMaterial (MeshStandardMaterial, #5f6b73)
- glassMaterial (MeshPhysicalMaterial, transmission 0.85)
- metalBandMaterial
- revealMaterial

Update windowsRear.ts, windowsSide.ts, windowsFront.ts to import materials from this file instead of defining them locally.`
      },
      {
        id: '3b',
        label: 'Create shared window constants',
        detail:
          'FRAME_DEPTH, FRAME_BORDER, GLASS_INSET, SILL_DEPTH, SILL_HEIGHT, SILL_OVERHANG are repeated. Move to src/constants/windowConstants.ts.',
        prompt: `Create src/constants/windowConstants.ts:

export const FRAME_DEPTH = 0.08;
export const FRAME_BORDER = 0.07;
export const GLASS_INSET = 0.015;
export const SILL_DEPTH = 0.18;
export const SILL_HEIGHT = 0.05;
export const SILL_OVERHANG = 0.02;
export const CUTOUT_DEPTH = 0.6;
export const EPS = 0.01;

Remove these constant definitions from windowsRear.ts, windowsSide.ts, windowsFront.ts and import from this file.`
      },
      {
        id: '3c',
        label: 'Unify frame geometry builder',
        detail:
          'createFrameGeometry() in windowsSide.ts and the inline frame shape in makeWindowMeshes() in windowsRear.ts do the same thing. Extract to src/builders/buildFrameGeometry.ts.',
        prompt: `Create src/builders/buildFrameGeometry.ts:

import { ExtrudeGeometry, Shape, Path } from 'three';
import { FRAME_BORDER, FRAME_DEPTH } from '../constants/windowConstants';

export function buildFrameGeometry(width: number, height: number, rotateForSide = false): ExtrudeGeometry {
  // build Shape with rectangular hole (inner inset by FRAME_BORDER)
  // ExtrudeGeometry with depth: FRAME_DEPTH, bevelEnabled: false
  // translate so it's centered on z
  // if rotateForSide: rotateY(-PI/2), computeVertexNormals
  return geometry;
}

Update windowsRear.ts and windowsSide.ts to use this shared builder.`
      },
      {
        id: '3d',
        label: 'Unify sill builder',
        detail:
          'makeSill() in windowsRear.ts and createSill() in windowsSide.ts produce the same kind of mesh with slightly different param shapes. Merge into one function.',
        prompt: `Create src/builders/buildSill.ts:

export function buildSill(params: {
  id: string;
  width: number;
  xCenter?: number;
  zCenter?: number;
  yCenter?: number;
  yBottom?: number;
  zFace?: number;
  xFace?: number;
  side?: 'left' | 'right';
  facing?: 'front' | 'rear';
}): WindowMesh { ... }

Consolidate the logic from makeSill (windowsRear) and createSill (windowsSide). Update both files to import and use this function.`
      }
    ]
  },
  {
    id: 4,
    title: 'Generalise Room Volume Builder',
    priority: 'Portability',
    effort: 'Low',
    rationale:
      'roomsGround.ts and roomsFirst.ts are structurally identical — both map room layout data to RoomVolume[] with yMin/yMax derived from floor level + ceiling height. A generic factory makes adding floors trivial.',
    files: ['roomsGround.ts', 'roomsFirst.ts'],
    duplications: [
      'RoomVolume type defined in roomsGround.ts and imported (fine), but floor-specific wiring is repeated',
      'The { ...roomBounds, yMin, yMax } pattern copy-pasted for every room on every floor',
      'Adding a new floor requires creating a whole new file mirroring the pattern'
    ],
    steps: [
      {
        id: '4a',
        label: 'Create buildFloorRooms() factory',
        detail:
          'A generic function that takes a floor level, ceiling height, and a map of room bounds and returns RoomVolume[].',
        prompt: `Create src/builders/buildFloorRooms.ts:

import { RoomVolume } from '../roomsGround';
import { RoomRange } from '../houseSpec';

export function buildFloorRooms(params: {
  floorLevel: number;
  ceilingHeight: number;
  rooms: Array<{ id: string; label: string; bounds: RoomRange }>;
}): RoomVolume[] {
  const { floorLevel, ceilingHeight, rooms } = params;
  return rooms.map(({ id, label, bounds }) => ({
    id,
    label,
    bounds: { ...bounds, yMin: floorLevel, yMax: floorLevel + ceilingHeight },
  }));
}

Then refactor roomsGround.ts and roomsFirst.ts to use this factory. Each file shrinks to just its room list data + one buildFloorRooms() call.`
      }
    ]
  },
  {
    id: 5,
    title: 'Decouple Layout Engine from Ground Floor',
    priority: 'Portability',
    effort: 'High',
    rationale:
      "layoutGround.ts is the layout engine but it's hard-coded to ground floor room names and structure. To port to a new house, you need to rewrite it entirely. Separate the algorithm from the data.",
    files: ['layoutGround.ts'],
    duplications: [
      "Zone names ('living', 'service') are hard-coded strings, not typed",
      'Room names (zithoek, keuken, eethoek, hall, stair, berging) are hard-coded throughout',
      'The depth-scaling algorithm is reusable but buried in the file'
    ],
    steps: [
      {
        id: '5a',
        label: 'Extract layoutFloor() algorithm',
        detail:
          'The core algorithm (zone width split, depth scaling, range accumulation) is generic. Pull it out into a typed function.',
        prompt: `Create src/builders/layoutFloor.ts:

export interface ZoneSpec {
  id: string;
  width: number;
  rooms: Array<{ id: string; label: string; depth: number }>;
}

export function layoutFloor(params: {
  interior: { xMin: number; xMax: number; zMin: number; zMax: number };
  zones: ZoneSpec[];
}): Record<string, { xMin: number; xMax: number; zMin: number; zMax: number }> {
  // Generic: computes zone x-ranges, scales depths to fit, accumulates z-ranges
  // Returns a flat record of roomId -> RoomRange
}

Then refactor layoutGround.ts to call layoutFloor() with ground-floor-specific zone and room data, rather than containing the algorithm itself. This way any floor can use layoutFloor() with different inputs.`
      }
    ]
  }
]

const priorityColors: Record<Priority, { bg: string; accent: string; label: string }> = {
  Foundation: { bg: '#1a1a2e', accent: '#e94560', label: 'FOUNDATION' },
  'High Impact DRY': { bg: '#0f3460', accent: '#e94560', label: 'HIGH IMPACT DRY' },
  Portability: { bg: '#16213e', accent: '#0f9b8e', label: 'PORTABILITY' }
}

const effortDots: Record<Effort, number> = { Low: 1, Medium: 2, High: 3 }

export default function RefactoringPlan() {
  const [activePhase, setActivePhase] = useState<number>(1)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const phase = phases.find((p) => p.id === activePhase)
  const totalSteps = phases.flatMap((p) => p.steps).length
  const doneCount = completedSteps.size

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.has(stepId) ? next.delete(stepId) : next.add(stepId)
      return next
    })
  }

  const copyPrompt = (stepId: string, prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedId(stepId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const phaseComplete = (p: Phase) => p.steps.every((s) => completedSteps.has(s.id))

  return (
    <div
      style={{
        fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
        background: '#0a0a12',
        minHeight: '100vh',
        color: '#c8cdd4',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          borderBottom: '1px solid #1e2030',
          padding: '24px 32px 20px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a12 100%)'
        }}
      >
        <div>
          <div
            style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#e94560', marginBottom: '6px', textTransform: 'uppercase' }}
          >
            vite-houseplan · refactoring plan
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#f0f2f5', letterSpacing: '-0.02em' }}>Structure & DRY</div>
          <div style={{ fontSize: '12px', color: '#5a6070', marginTop: '4px' }}>
            {phases.length} phases · {totalSteps} tasks · goal: portable HouseSpec
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: doneCount === totalSteps ? '#0f9b8e' : '#e94560' }}>
            {doneCount}/{totalSteps}
          </div>
          <div style={{ fontSize: '10px', color: '#5a6070', letterSpacing: '0.1em' }}>TASKS DONE</div>
          <div
            style={{
              marginTop: '8px',
              height: '3px',
              width: '120px',
              background: '#1a1a2a',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(doneCount / totalSteps) * 100}%`,
                background: '#e94560',
                transition: 'width 0.4s ease',
                borderRadius: '2px'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <div
          style={{
            width: '220px',
            borderRight: '1px solid #1e2030',
            padding: '20px 0',
            flexShrink: 0
          }}
        >
          {phases.map((p) => {
            const done = phaseComplete(p)
            const colors = priorityColors[p.priority]
            const active = p.id === activePhase
            return (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 20px',
                  background: active ? '#13131f' : 'transparent',
                  border: 'none',
                  borderLeft: active ? `3px solid ${colors.accent}` : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${done ? colors.accent : '#2a2a3a'}`,
                      background: done ? colors.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '10px',
                      color: done ? '#0a0a12' : '#3a3a4a',
                      fontWeight: '700'
                    }}
                  >
                    {done ? '✓' : p.id}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: active ? '#f0f2f5' : '#6a7080',
                      fontWeight: active ? '600' : '400',
                      lineHeight: '1.3'
                    }}
                  >
                    Phase {p.id}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: active ? colors.accent : '#3a3a4a',
                    letterSpacing: '0.1em',
                    paddingLeft: '26px',
                    textTransform: 'uppercase'
                  }}
                >
                  {colors.label}
                </div>
              </button>
            )
          })}
        </div>

        {phase && (
          <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '820px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.15em',
                    color: priorityColors[phase.priority].accent,
                    border: `1px solid ${priorityColors[phase.priority].accent}`,
                    padding: '2px 8px',
                    borderRadius: '2px',
                    textTransform: 'uppercase'
                  }}
                >
                  {phase.priority}
                </span>
                <span style={{ fontSize: '10px', color: '#4a5060', letterSpacing: '0.1em' }}>
                  effort: {'●'.repeat(effortDots[phase.effort])}
                  {'○'.repeat(3 - effortDots[phase.effort])}
                </span>
              </div>
              <h2 style={{ fontSize: '20px', color: '#f0f2f5', margin: '0 0 10px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                {phase.title}
              </h2>
              <p style={{ fontSize: '13px', color: '#7a8090', margin: 0, lineHeight: '1.7', maxWidth: '620px' }}>{phase.rationale}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {phase.files.map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    background: '#13131f',
                    border: '1px solid #2a2a3a',
                    borderRadius: '3px',
                    color: '#7090c0',
                    fontFamily: 'inherit'
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            <div
              style={{
                background: '#0d0d1a',
                border: '1px solid #1e2030',
                borderRadius: '4px',
                padding: '16px 18px',
                marginBottom: '24px'
              }}
            >
              <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#e94560', marginBottom: '10px', textTransform: 'uppercase' }}>
                Duplication found
              </div>
              {phase.duplications.map((d, i) => (
                <div
                  key={d}
                  style={{
                    fontSize: '12px',
                    color: '#8090a0',
                    padding: '5px 0',
                    borderTop: i > 0 ? '1px solid #151520' : 'none',
                    display: 'flex',
                    gap: '8px',
                    lineHeight: '1.5'
                  }}
                >
                  <span style={{ color: '#e94560', flexShrink: 0 }}>▸</span>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#4a5060', marginBottom: '12px', textTransform: 'uppercase' }}>
              Refactoring tasks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {phase.steps.map((step) => {
                const done = completedSteps.has(step.id)
                const expanded = expandedStep === step.id
                const copied = copiedId === step.id
                return (
                  <div
                    key={step.id}
                    style={{
                      background: done ? '#0d1a14' : '#0f0f1a',
                      border: `1px solid ${done ? '#1a3020' : '#1e2030'}`,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedStep(expanded ? null : step.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStep(step.id)
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '3px',
                          border: `2px solid ${done ? '#0f9b8e' : '#2a3040'}`,
                          background: done ? '#0f9b8e' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          color: done ? '#0a0a12' : 'transparent',
                          flexShrink: 0,
                          fontWeight: '700',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        ✓
                      </button>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            color: done ? '#5a8070' : '#d0d4dc',
                            fontWeight: '600',
                            textDecoration: done ? 'line-through' : 'none'
                          }}
                        >
                          <span style={{ color: '#3a4050', marginRight: '8px' }}>{step.id}</span>
                          {step.label}
                        </div>
                        {!expanded && (
                          <div style={{ fontSize: '11px', color: '#4a5060', marginTop: '3px' }}>{step.detail.substring(0, 80)}…</div>
                        )}
                      </div>
                      <span style={{ color: '#3a4050', fontSize: '12px', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
                    </div>

                    {expanded && (
                      <div style={{ padding: '0 16px 16px' }}>
                        <p style={{ fontSize: '12px', color: '#8090a0', lineHeight: '1.7', margin: '0 0 14px' }}>{step.detail}</p>

                        <div
                          style={{
                            background: '#07070f',
                            border: '1px solid #1a1a2a',
                            borderRadius: '3px',
                            padding: '14px',
                            position: 'relative'
                          }}
                        >
                          <div
                            style={{
                              fontSize: '9px',
                              letterSpacing: '0.2em',
                              color: '#3a4050',
                              marginBottom: '8px',
                              textTransform: 'uppercase'
                            }}
                          >
                            Codex / ChatGPT prompt — copy & paste
                          </div>
                          <pre
                            style={{
                              fontSize: '11px',
                              color: '#7090a0',
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.6',
                              fontFamily: 'inherit'
                            }}
                          >
                            {step.prompt}
                          </pre>
                          <button
                            onClick={() => copyPrompt(step.id, step.prompt)}
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: copied ? '#0f3020' : '#13131f',
                              border: `1px solid ${copied ? '#0f9b8e' : '#2a2a3a'}`,
                              color: copied ? '#0f9b8e' : '#5a6070',
                              fontSize: '10px',
                              padding: '4px 10px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              letterSpacing: '0.1em',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {copied ? 'COPIED ✓' : 'COPY'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
