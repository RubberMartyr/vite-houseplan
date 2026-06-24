import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { EngineHouse } from '../engine/EngineHouse';
import { architecturalHouse, architecturalProperty } from '../engine/architecturalHouse';
import type { ArchitecturalHouse, LevelSpec, SiteSpec } from '../engine/architecturalTypes';
import type { DraftHouseModel, HouseViewerProps, PointXZ } from '../types';
import { markFirstFrameRendered } from '../loadingManager';
import type { ValidationLogEntry } from '../engine/debug/ui/tabs/RenderingTab';
import type { VisibilityState } from '../engine/debug/ui/tabs/VisibilityTab';
import {
  type FloorplanValidationResult,
  validateFloorplan,
} from '../engine/validation/validateFloorplan';
import { debugFlags } from '../engine/debug/debugFlags';
import { RoomInfoCard } from './RoomInfoCard';
import { getParcelPolygon, getRenderableGeometrySummary, getValidLevelFootprints } from '../engine/modelGeometry';


const DebugButton = lazy(() =>
  import('../engine/debug/ui/DebugButton').then((module) => ({ default: module.DebugButton }))
);
const DebugDashboard = lazy(() =>
  import('../engine/debug/ui/DebugDashboard').then((module) => ({ default: module.DebugDashboard }))
);
const WireframeOverride = lazy(() =>
  import('../engine/debug/ui/useWireframeOverride').then((module) => ({ default: module.WireframeOverride }))
);
const DebugEdges = lazy(() => import('./debug/DebugEdges').then((module) => ({ default: module.DebugEdges })));
const FloorplanValidationOverlay = lazy(() =>
  import('../engine/debug/FloorplanValidationOverlay').then((module) => ({
    default: module.FloorplanValidationOverlay,
  }))
);

function FirstFrameMarker() {
  const firstFrameRef = useRef(false);

  useFrame(() => {
    if (firstFrameRef.current) {
      return;
    }

    firstFrameRef.current = true;
    markFirstFrameRendered();
  });

  return null;
}

function DebugAxes() {
  const { scene } = useThree();
  const helperRef = useRef<THREE.AxesHelper | null>(null);

  useEffect(() => {
    if (!debugFlags.enabled) {
      return;
    }

    const axes = new THREE.AxesHelper(5);
    scene.add(axes);
    helperRef.current = axes;

    return () => {
      if (helperRef.current) {
        scene.remove(helperRef.current);
      }
    };
  }, [scene]);

  return null;
}

type ToggleState = {
  shellVisible: boolean;
  showDebug: boolean;
  visibility: VisibilityState;
};

type SelectedRoomState = {
  id: string;
  name: string;
  levelName?: string;
};

const toolbarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 11,
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  maxWidth: 'min(88vw, 760px)',
  padding: 10,
  borderRadius: 16,
  border: '1px solid rgba(125, 160, 212, 0.24)',
  background: 'rgba(7, 13, 24, 0.62)',
  boxShadow: '0 16px 34px rgba(4, 8, 15, 0.35)',
  backdropFilter: 'blur(10px)',
};

const noticeStyle: React.CSSProperties = {
  position: 'absolute',
  right: 16,
  bottom: 16,
  zIndex: 10,
  maxWidth: 360,
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid rgba(96, 165, 250, 0.38)',
  background: 'rgba(15, 23, 42, 0.78)',
  color: '#e0f2fe',
  fontSize: 13,
  fontWeight: 700,
  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.25)',
  backdropFilter: 'blur(10px)',
};

const baseToggleStyle: React.CSSProperties = {
  border: '1px solid rgba(146, 165, 196, 0.4)',
  borderRadius: 999,
  padding: '8px 15px',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.25,
  cursor: 'pointer',
  transition: 'all 180ms ease',
};

const shellSwitchTrackStyle: React.CSSProperties = {
  position: 'relative',
  width: 64,
  height: 34,
  borderRadius: 999,
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  transition: 'background 180ms ease, box-shadow 180ms ease',
};

const shellSwitchKnobStyle: React.CSSProperties = {
  position: 'absolute',
  top: 3,
  left: 3,
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#f5fbff',
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.38)',
  transition: 'transform 180ms ease',
};

const isPointList = (value: unknown): value is PointXZ[] =>
  Array.isArray(value) &&
  value.length >= 3 &&
  value.every(
    (point) =>
      typeof point === 'object' &&
      point !== null &&
      typeof (point as PointXZ).x === 'number' &&
      typeof (point as PointXZ).z === 'number'
  );

const hasArchitecturalLevels = (model: unknown): model is ArchitecturalHouse =>
  typeof model === 'object' &&
  model !== null &&
  Array.isArray((model as ArchitecturalHouse).levels) &&
  typeof (model as ArchitecturalHouse).wallThickness === 'number';

const createLevelFromDraft = (level: NonNullable<DraftHouseModel['levels']>[number], index: number): LevelSpec | null => {
  const outer = level.footprint?.outer;

  if (!isPointList(outer)) {
    return null;
  }

  return {
    id: level.id,
    name: level.name ?? level.id,
    elevation: level.elevation ?? index * (level.height ?? 2.8),
    height: level.height ?? 2.8,
    slab: {
      thickness: level.slab?.thickness ?? 0.25,
      inset: level.slab?.inset ?? 0,
    },
    footprint: {
      id: `${level.id}-footprint`,
      outer,
      edges: [],
      semanticZones: [],
    },
  };
};

const toArchitecturalHouse = (model: HouseViewerProps['model']): ArchitecturalHouse => {
  if (hasArchitecturalLevels(model)) {
    const validLevelIds = new Set(getValidLevelFootprints(model).map(({ level }) => level.id));
    return {
      ...model,
      levels: model.levels.filter((level) => validLevelIds.has(level.id)),
    };
  }

  if (typeof model !== 'object' || model === null) {
    return architecturalHouse;
  }

  const draft = model as DraftHouseModel;
  const levels = draft.levels
    ?.map((level, index) => createLevelFromDraft(level, index))
    .filter((level): level is LevelSpec => level !== null);

  if (levels && levels.length > 0) {
    return {
      wallThickness: draft.walls?.[0]?.thickness ?? 0.3,
      levels,
      openings: [],
      rooms: [],
      roofs: [],
      site: draft.site?.parcel ? ({ parcel: draft.site.parcel } as SiteSpec) : undefined,
    };
  }

  return {
    wallThickness: 0.3,
    levels: [],
    openings: [],
    rooms: [],
    roofs: [],
    site: draft.site?.parcel ? ({ parcel: draft.site.parcel } as SiteSpec) : undefined,
  };
};

const toSite = (model: HouseViewerProps['model']): SiteSpec | undefined => {
  if (typeof model !== 'object' || model === null) {
    return architecturalProperty.site;
  }

  const draft = model as DraftHouseModel;
  const parcelOuter = getParcelPolygon(model) ?? (isPointList(draft.parcel?.outer) ? draft.parcel.outer : null);

  if (parcelOuter) {
    return {
      footprint: {
        id: 'parcel-footprint',
        outer: parcelOuter,
        edges: [],
        semanticZones: [],
      },
      parcel: (draft.site?.parcel ?? draft.parcel) as SiteSpec['parcel'],
      elevation: -0.001,
      color: '#7dd3fc',
      surfaces: [],
      boundaries: {
        fences: [],
        hedges: [],
        gates: [],
      },
      objects: [],
    };
  }

  if (hasArchitecturalLevels(model) && model.site?.footprint) {
    return model.site;
  }

  return undefined;
};

export default function HouseViewer({ model = null, mode = 'solid', showHelpers = false, className }: HouseViewerProps) {
  const debugEnabled = debugFlags.enabled;
  const resolvedHouse = useMemo(() => toArchitecturalHouse(model), [model]);
  const resolvedSite = useMemo(() => toSite(model), [model]);
  const [house, setHouse] = useState<ArchitecturalHouse>(resolvedHouse);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showWireframe, setShowWireframe] = useState(mode === 'wireframe');
  const [showEdges, setShowEdges] = useState(false);
  const [showOpeningEdges, setShowOpeningEdges] = useState(false);
  const [showFloorplanOverlay, setShowFloorplanOverlay] = useState(false);
  const [showValidationIssues, setShowValidationIssues] = useState(false);
  const [validationResult, setValidationResult] = useState<FloorplanValidationResult | null>(null);
  const [validationLog, setValidationLog] = useState<ValidationLogEntry[]>([
    { level: 'info', message: 'Use "Run Floorplan Validation" in Debug to run checks.' },
  ]);
  const [toggles, setToggles] = useState<ToggleState>({
    shellVisible: true,
    showDebug: debugEnabled,
    visibility: {
      showSlabs: true,
      showWindows: true,
      showWalls: true,
      showRooms: false,
      showRoof: true,
    },
  });
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoomState | null>(null);

  useEffect(() => {
    setHouse(resolvedHouse);
  }, [resolvedHouse]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  const roomLevelById = useMemo(
    () => new Map(house.levels.map((level) => [level.id, level.name])),
    [house.levels]
  );

  const showWalls = toggles.visibility.showWalls;
  const showRoof = toggles.visibility.showRoof;
  const showGlass = toggles.visibility.showWindows;
  const showSlabs = toggles.visibility.showSlabs;
  const showRooms = toggles.visibility.showRooms;
  const showRoomInfoCard = showRooms && selectedRoom !== null;

  useEffect(() => {
    setShowWireframe(mode === 'wireframe');
  }, [mode]);

  useEffect(() => {
    if (!showRooms) {
      setHoveredRoomId(null);
    }
  }, [showRooms]);

  const houseWithInjectedInteriorWall = useMemo<ArchitecturalHouse>(() => {
    const arch: ArchitecturalHouse = {
      ...house,
    };

    return arch;
  }, [house]);
  const viewerModel = useMemo<ArchitecturalHouse>(
    () => ({
      ...houseWithInjectedInteriorWall,
      site: resolvedSite ?? houseWithInjectedInteriorWall.site,
    }),
    [houseWithInjectedInteriorWall, resolvedSite]
  );

  const initialJson = useMemo(() => JSON.stringify(viewerModel, null, 2), [viewerModel]);
  const renderableGeometrySummary = useMemo(
    () => getRenderableGeometrySummary(viewerModel),
    [viewerModel]
  );

  const buildValidationEntries = (result: FloorplanValidationResult, timestamp: string): ValidationLogEntry[] => {
    const issueCodes = result.issues.reduce<Record<string, number>>((acc, issue) => {
      const key = `${issue.severity}:${issue.code}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const summary = `Summary: rooms=${result.roomCount}, levels=${result.levelCount}, errors=${result.errorCount}, warnings=${result.warningCount}, info=${result.infoCount}.`;
    const codes = Object.entries(issueCodes)
      .map(([code, count]) => `${code}=${count}`)
      .join(', ');

    const entries: ValidationLogEntry[] = [
      { level: 'info', message: `[${timestamp}] ${summary}` },
      { level: 'info', message: `[${timestamp}] Issue codes: ${codes || 'none'}.` },
    ];

    for (const [levelId, levelData] of Object.entries(result.perLevel)) {
      if (levelData.issues.length === 0) {
        continue;
      }

      entries.push({
        level: 'info',
        message: `[${timestamp}] Level ${levelId}: rooms=${levelData.roomCount}, issues=${levelData.issues.length}, uncovered=${levelData.uncoveredPolygons?.length ?? 0}, overlaps=${levelData.overlapPairs?.length ?? 0}.`,
      });
    }

    for (const issue of result.issues) {
      entries.push({
        level: issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warn' : 'info',
        message: `[${timestamp}] ${issue.code}${issue.levelId ? ` [${issue.levelId}]` : ''}: ${issue.message}`,
      });
    }

    return entries;
  };

  const runFloorplanValidation = () => {
    const timestamp = new Date().toLocaleTimeString();

    setValidationLog((current) => [
      { level: 'info', message: `[${timestamp}] Running floorplan validation...` },
      ...current,
    ]);

    const result = validateFloorplan(houseWithInjectedInteriorWall);
    setValidationResult(result);
    const summaryMessage = `Summary: rooms=${result.roomCount}, levels=${result.levelCount}, errors=${result.errorCount}, warnings=${result.warningCount}, info=${result.infoCount}`;
    console.info(summaryMessage);
    for (const issue of result.issues) {
      const issueMessage = `${issue.code}${issue.levelId ? ` [${issue.levelId}]` : ''}: ${issue.message}`;
      if (issue.severity === 'error') {
        console.error(issueMessage, issue.meta ?? {});
      } else if (issue.severity === 'warning') {
        console.warn(issueMessage, issue.meta ?? {});
      } else {
        console.info(issueMessage, issue.meta ?? {});
      }
    }

    if (result.issueCount === 0) {
      setValidationLog((current) => [
        ...buildValidationEntries(result, timestamp),
        { level: 'info', message: `[${timestamp}] Floorplan validation passed.` },
        ...current,
      ]);
      return;
    }

    setValidationLog((current) => [
      ...buildValidationEntries(result, timestamp),
      ...current,
    ]);
  };

  const clearValidationOutput = () => {
    setValidationResult(null);
    setValidationLog([{ level: 'info', message: 'Validation output cleared.' }]);
  };

  return (
    <div className={className} style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 7, -12], fov: 50 }}
        dpr={1}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={['#f5f7fb']} />
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          intensity={1}
          position={[10, 20, 10]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={70}
        />
        <Sky distance={450000} sunPosition={[2, 0.6, 2]} turbidity={8} />

        <group>
          <EngineHouse
            house={viewerModel}
            site={viewerModel.site}
            showWalls={showWalls}
            showRoof={showRoof}
            showSlabs={showSlabs}
            showGlass={showGlass}
            showRooms={showRooms}
            showDebug={toggles.showDebug || showHelpers}
            selectedRoomId={selectedRoom?.id ?? null}
            hoveredRoomId={hoveredRoomId}
            onRoomHover={setHoveredRoomId}
            onRoomSelect={(room) => {
              setSelectedRoom({
                id: room.id,
                name: room.name,
                levelName: roomLevelById.get(room.levelId) ?? room.levelId,
              });
            }}
          />
          <DebugAxes />
          {(toggles.showDebug || showHelpers) && debugEnabled && (
            <Suspense fallback={null}>
              <DebugEdges showEdges={showEdges} showOpeningEdges={showOpeningEdges} />
            </Suspense>
          )}
          {(toggles.showDebug || showHelpers) && debugEnabled && (
            <Suspense fallback={null}>
              <FloorplanValidationOverlay
                architecturalHouse={houseWithInjectedInteriorWall}
                validationResult={validationResult}
                showFloorplanOverlay={showFloorplanOverlay}
                showValidationIssues={showValidationIssues}
              />
            </Suspense>
          )}
        </group>

        {(toggles.showDebug || showHelpers) && debugEnabled && (
          <Suspense fallback={null}>
            <WireframeOverride enabled={showWireframe} />
          </Suspense>
        )}

        <OrbitControls makeDefault enableDamping target={[0, 1.2, 0]} />
        <FirstFrameMarker />
      </Canvas>

      <div style={toolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#e7f0ff', fontWeight: 700, letterSpacing: 0.3 }}>Shell</span>
          <button
            type="button"
            role="switch"
            aria-checked={toggles.shellVisible}
            aria-label="Toggle shell visibility"
            style={{
              ...shellSwitchTrackStyle,
              background: toggles.shellVisible ? 'linear-gradient(180deg, #40d47e, #1e9f56)' : 'linear-gradient(180deg, #39465e, #212b3d)',
              boxShadow: toggles.shellVisible
                ? '0 0 0 1px rgba(134, 255, 188, 0.4), 0 0 20px rgba(68, 231, 138, 0.35)'
                : '0 0 0 1px rgba(111, 132, 166, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            }}
            onClick={() =>
              setToggles((current) => {
                const shellVisible = !current.shellVisible;
                return {
                  ...current,
                  shellVisible,
                  visibility: {
                    ...current.visibility,
                    showWindows: shellVisible,
                    showWalls: shellVisible,
                    showRoof: shellVisible,
                    showRooms: !shellVisible,
                  },
                };
              })
            }
            title={`Shell: ${toggles.shellVisible ? 'ON' : 'OFF'}`}
          >
            <span
              style={{
                ...shellSwitchKnobStyle,
                transform: toggles.shellVisible ? 'translateX(30px)' : 'translateX(0)',
              }}
            />
          </button>
          <span style={{ color: '#d2dfee', fontWeight: 700, minWidth: 34 }}>
            {toggles.shellVisible ? 'ON' : 'OFF'}
          </span>
        </div>
        {debugEnabled && (
          <button
            type="button"
            style={{
              ...baseToggleStyle,
              background: toggles.showDebug
                ? 'linear-gradient(180deg, rgba(106, 188, 255, 0.48), rgba(39, 127, 214, 0.46))'
                : 'linear-gradient(180deg, rgba(21, 31, 47, 0.9), rgba(13, 20, 31, 0.88))',
              color: toggles.showDebug ? '#eff8ff' : 'rgba(173, 188, 210, 0.72)',
              borderColor: toggles.showDebug ? 'rgba(156, 218, 255, 0.68)' : 'rgba(108, 126, 152, 0.42)',
            }}
            onClick={() => setToggles((current) => ({ ...current, showDebug: !current.showDebug }))}
          >
            Debug
          </button>
        )}
      </div>

      <RoomInfoCard
        roomName={showRoomInfoCard ? selectedRoom?.name ?? null : null}
        levelName={showRoomInfoCard ? selectedRoom?.levelName ?? null : null}
      />

      {!renderableGeometrySummary.hasRenderableGeometry && (
        <div style={noticeStyle}>
          {renderableGeometrySummary.errors[0] ?? 'No renderable geometry found.'}
        </div>
      )}

      {(toggles.showDebug || showHelpers) && debugEnabled && (
        <>
          <Suspense fallback={null}>
            <DebugButton isOpen={isDashboardOpen} onClick={() => setIsDashboardOpen((value) => !value)} />
            <DebugDashboard
            isOpen={isDashboardOpen}
            onClose={() => setIsDashboardOpen(false)}
            showWireframe={showWireframe}
            onShowWireframeChange={setShowWireframe}
            showEdges={showEdges}
            onShowEdgesChange={setShowEdges}
            showOpeningEdges={showOpeningEdges}
            onShowOpeningEdgesChange={setShowOpeningEdges}
            initialJson={initialJson}
            onApplyArchitecturalHouse={setHouse}
            onRunFloorplanValidation={runFloorplanValidation}
            showFloorplanOverlay={showFloorplanOverlay}
            onShowFloorplanOverlayChange={setShowFloorplanOverlay}
            showValidationIssues={showValidationIssues}
            onShowValidationIssuesChange={setShowValidationIssues}
            onClearValidationOutput={clearValidationOutput}
            validationLog={validationLog}
            visibility={toggles.visibility}
            onVisibilityChange={(visibility) =>
              setToggles((current) => ({
                ...current,
                shellVisible:
                  visibility.showWalls &&
                  visibility.showWindows &&
                  visibility.showRoof &&
                  !visibility.showRooms,
                visibility,
              }))
            }
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
