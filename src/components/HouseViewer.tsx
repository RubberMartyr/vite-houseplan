import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { AxesHelper } from 'three';
import { EngineHouse } from '../engine/EngineHouse';
import { architecturalHouse } from '../engine/architecturalHouse';
import { markFirstFrameRendered } from '../loadingManager';
import { isDebugEnabled } from '../runtime/debugFlags';
import { DebugButton } from '../engine/debug/DebugButton';
import { DebugPanel } from '../engine/debug/DebugPanel';

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
  const helperRef = useRef<AxesHelper | null>(null);

  useEffect(() => {
    if (!isDebugEnabled()) {
      return;
    }

    const axes = new AxesHelper(5);
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

export default function HouseViewer() {
  const debugEnabled = isDebugEnabled();

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas shadows camera={{ position: [0, 7, -12], fov: 50 }} dpr={1} gl={{ antialias: true }}>
        <color attach="background" args={['#f5f7fb']} />
        <ambientLight intensity={0.45} />
        <directionalLight
          castShadow
          intensity={1}
          position={[10, 12, 6]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={70}
        />
        <Sky distance={450000} sunPosition={[2, 0.6, 2]} turbidity={8} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
          <planeGeometry args={[160, 160]} />
          <meshStandardMaterial color="#d8d8d8" />
        </mesh>

        <group>
          <EngineHouse architecturalHouse={architecturalHouse} />
          <DebugAxes />
        </group>

        <OrbitControls makeDefault enableDamping target={[0, 1.2, 0]} />
        <FirstFrameMarker />
      </Canvas>
      {debugEnabled && <DebugButton />}
      {debugEnabled && <DebugPanel />}
    </div>
  );
}
