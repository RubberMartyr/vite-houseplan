import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { EngineHouse } from '../engine/EngineHouse';
import { architecturalHouse } from '../engine/architecturalHouse';
import type { ArchitecturalHouse } from '../engine/architecturalTypes';
import { markFirstFrameRendered } from '../loadingManager';
import { DebugButton } from '../engine/debug/ui/DebugButton';
import { DebugDashboard } from '../engine/debug/ui/DebugDashboard';
import type { ValidationLogEntry } from '../engine/debug/ui/tabs/RenderingTab';
import {
  type FloorplanValidationResult,
  validateFloorplan,
} from '../engine/validation/validateFloorplan';
import { isDebugEnabled } from '../engine/debug/ui/debugMode';
import { WireframeOverride } from '../engine/debug/ui/useWireframeOverride';
import { DebugEdges } from './debug/DebugEdges';
import { FloorplanValidationOverlay } from '../engine/debug/FloorplanValidationOverlay';
import { RoomInfoCard } from './RoomInfoCard';

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
    if (!isDebugEnabled()) {
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
  showWalls: boolean;
  showRoof: boolean;
  showSlabs: boolean;
  roomsEnabled: boolean;
  showGlass: boolean;
  showDebug: boolean;
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

const baseToggleStyle: React.CSSProperties = {
  border: '1px solid rgba(146, 165, 196, 0.36)',
  borderRadius: 999,
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.2,
  cursor: 'pointer',
  transition: 'all 180ms ease',
};

export default function HouseViewer() {
  const debugEnabled = isDebugEnabled();
  const [house, setHouse] = useState<ArchitecturalHouse>(architecturalHouse);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showEdges, setShowEdges] = useState(true);
  const [showOpeningEdges, setShowOpeningEdges] = useState(false);
  const [showFloorplanOverlay, setShowFloorplanOverlay] = useState(true);
  const [showValidationIssues, setShowValidationIssues] = useState(true);
  const [validationResult, setValidationResult] = useState<FloorplanValidationResult | null>(null);
  const [validationLog, setValidationLog] = useState<ValidationLogEntry[]>([
    { level: 'info', message: 'Use "Run Floorplan Validation" in Debug to run checks.' },
  ]);
  const [toggles, setToggles] = useState<ToggleState>({
    showWalls: true,
    showRoof: true,
    showSlabs: true,
    roomsEnabled: true,
    showGlass: true,
    showDebug: debugEnabled,
  });
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoomState | null>(null);

  useEffect(() => {
    setHouse(architecturalHouse);
  }, [architecturalHouse]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  const roomLevelById = useMemo(
    () => new Map(house.levels.map((level) => [level.id, level.name])),
    [house.levels]
  );

  const showRooms = !toggles.showWalls && toggles.roomsEnabled;

  useEffect(() => {
    if (toggles.showWalls) {
      setHoveredRoomId(null);
    }
  }, [toggles.showWalls]);

  const houseWithInjectedInteriorWall = useMemo<ArchitecturalHouse>(() => {
    const arch: ArchitecturalHouse = {
      ...house,
    };

    return arch;
  }, [house]);

  const initialJson = useMemo(() => JSON.stringify(house, null, 2), [house]);

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

  const toggleConfig = [
    { key: 'showWalls' as const, label: 'Walls' },
    { key: 'showRoof' as const, label: 'Roof' },
    { key: 'showSlabs' as const, label: 'Slabs' },
    { key: 'roomsEnabled' as const, label: 'Rooms' },
    { key: 'showGlass' as const, label: 'Glass' },
    { key: 'showDebug' as const, label: 'Debug' },
  ];

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
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
            architecturalHouse={houseWithInjectedInteriorWall}
            showWalls={toggles.showWalls}
            showRoof={toggles.showRoof}
            showSlabs={toggles.showSlabs}
            showGlass={toggles.showGlass}
            showRooms={showRooms}
            showDebug={toggles.showDebug}
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
          {toggles.showDebug && debugEnabled && <DebugEdges showEdges={showEdges} showOpeningEdges={showOpeningEdges} />}
          {toggles.showDebug && debugEnabled && (
            <FloorplanValidationOverlay
              architecturalHouse={houseWithInjectedInteriorWall}
              validationResult={validationResult}
              showFloorplanOverlay={showFloorplanOverlay}
              showValidationIssues={showValidationIssues}
            />
          )}
        </group>

        {toggles.showDebug && debugEnabled && <WireframeOverride enabled={showWireframe} />}

        <OrbitControls makeDefault enableDamping target={[0, 1.2, 0]} />
        <FirstFrameMarker />
      </Canvas>

      <div style={toolbarStyle}>
        {toggleConfig.map(({ key, label }) => {
          const isActive = toggles[key];
          return (
            <button
              key={key}
              type="button"
              style={{
                ...baseToggleStyle,
                background: isActive ? 'rgba(77, 166, 255, 0.28)' : 'rgba(24, 34, 52, 0.72)',
                color: isActive ? '#ffffff' : 'rgba(201, 214, 236, 0.72)',
                opacity: isActive ? 1 : 0.74,
                boxShadow: isActive ? '0 0 0 1px rgba(118, 197, 255, 0.5), 0 0 16px rgba(57, 145, 220, 0.34)' : 'none',
              }}
              onClick={() => setToggles((current) => ({ ...current, [key]: !current[key] }))}
            >
              {label}
            </button>
          );
        })}
      </div>

      <RoomInfoCard roomName={selectedRoom?.name ?? null} levelName={selectedRoom?.levelName ?? null} />

      {toggles.showDebug && debugEnabled && (
        <>
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
            onToggleFloorplanOverlay={() => setShowFloorplanOverlay((value) => !value)}
            showValidationIssues={showValidationIssues}
            onToggleValidationIssues={() => setShowValidationIssues((value) => !value)}
            onClearValidationOutput={clearValidationOutput}
            validationLog={validationLog}
          />
        </>
      )}
    </div>
  );
}
