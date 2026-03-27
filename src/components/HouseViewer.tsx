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

type SceneVisibility = {
  showEnvelope: boolean;
};

const overlayButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 10,
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid rgba(15, 23, 42, 0.15)',
  background: 'rgba(255, 255, 255, 0.92)',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.2,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
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
  const [{ showEnvelope }, setSceneVisibility] = useState<SceneVisibility>({
    showEnvelope: true,
  });

  useEffect(() => {
    setHouse(architecturalHouse);
  }, [architecturalHouse]);

  const houseWithInjectedInteriorWall = useMemo<ArchitecturalHouse>(() => {
    const arch: ArchitecturalHouse = {
      ...house,
    };

    return arch;
  }, [house]);

  const initialJson = useMemo(() => JSON.stringify(house, null, 2), [house]);

  const buildValidationEntries = (result: FloorplanValidationResult, timestamp: string): ValidationLogEntry[] => {
    const issueCodes = result.issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.code] = (acc[issue.code] ?? 0) + 1;
      return acc;
    }, {});

    const summary = `Summary: rooms=${result.roomCount}, levels=${result.levelCount}, errors=${result.errorCount}, warnings=${result.warningCount}.`;
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
        level: issue.severity === 'error' ? 'error' : 'info',
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
          <EngineHouse architecturalHouse={houseWithInjectedInteriorWall} showEnvelope={showEnvelope} />
          <DebugAxes />
          {debugEnabled && <DebugEdges showEdges={showEdges} showOpeningEdges={showOpeningEdges} />}
          {debugEnabled && (
            <FloorplanValidationOverlay
              architecturalHouse={houseWithInjectedInteriorWall}
              validationResult={validationResult}
              showFloorplanOverlay={showFloorplanOverlay}
              showValidationIssues={showValidationIssues}
            />
          )}
        </group>

        {debugEnabled && <WireframeOverride enabled={showWireframe} />}

        <OrbitControls makeDefault enableDamping target={[0, 1.2, 0]} />
        <FirstFrameMarker />
      </Canvas>

      <button
        type="button"
        style={overlayButtonStyle}
        onClick={() => setSceneVisibility((current) => ({ showEnvelope: !current.showEnvelope }))}
      >
        {showEnvelope ? 'Hide walls, roof, windows & ground' : 'Show walls, roof, windows & ground'}
      </button>

      {debugEnabled && (
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
