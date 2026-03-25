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
import { isDebugEnabled } from '../engine/debug/ui/debugMode';
import { WireframeOverride } from '../engine/debug/ui/useWireframeOverride';
import { DebugEdges } from './debug/DebugEdges';

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
  const [{ showEnvelope }, setSceneVisibility] = useState<SceneVisibility>({
    showEnvelope: true,
  });

  useEffect(() => {
    setHouse(architecturalHouse);
  }, [architecturalHouse]);

  const houseWithInjectedInteriorWall = useMemo<ArchitecturalHouse>(() => {
    const arch: ArchitecturalHouse = {
      ...house,
      interiorWalls: [
        {
          id: 'test-wall',
          levelId: 'ground',
          start: { x: 0, z: 0 },
          end: { x: 5, z: 0 },
          thickness: 0.1,
        },
      ],
    };

    return arch;
  }, [house]);

  const initialJson = useMemo(() => JSON.stringify(house, null, 2), [house]);

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
          />
        </>
      )}
    </div>
  );
}
