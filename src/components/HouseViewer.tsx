// @ts-nocheck
// @ts-nocheck
console.log("✅ ACTIVE VIEWER FILE: HouseViewer.tsx", Date.now());

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, useTexture } from '@react-three/drei';
import { wallsBasement } from '../model/wallsBasement';
import { wallsGround } from '../model/wallsGround';
import { wallsFirst } from '../model/wallsFirst';
import { wallsEavesBand } from '../model/wallsEavesBand';
import {
  frontZ,
  rearZ,
  leftX,
  rightX,
  ceilingHeights,
  levelHeights,
  wallThickness,
} from '../model/houseSpec'
import {
  getEnvelopeFirstOuterPolygon,
  getEnvelopeInnerPolygon,
  getEnvelopeOuterPolygon,
  getFlatRoofPolygon,
  originOffset,
} from '../model/envelope'
import { buildRoofMeshes } from '../model/roof'
import { roomsGround } from '../model/roomsGround'
import { roomsFirst } from '../model/roomsFirst'
import { windowsRear } from '../model/windowsRear';
import { windowsSide, windowsRightSide } from '../model/windowsSide';
import { windowsFront } from '../model/windowsFront';
import { loadingManager, markFirstFrameRendered } from '../loadingManager';
import { logOrientationAssertions } from '../model/orientation';
import { OrientationHelpers } from './debug/OrientationHelpers';

/**
 * ARCHITECTURAL SPECIFICATIONS
 * Derived from 'UITVOERING (3).pdf'
 */
const SPECS = {
  // Heights (Niveaus)
  levels: {
    ground: ceilingHeights.ground, // Gelijkvloers plafondhoogte
    first: ceilingHeights.first, // Verdieping
    attic: 3.2, // Zolder/Dakhoogte
    slab: 0.2, // Floor thickness
  },

  // Roof (Dak)
  roof: {
    pitch: 45, // Dakhelling (degrees)
    overhang: 0.5, // Dakoversteek
    color: '#2a2a2a', // Dark tiles (Antraciet)
  },

  // Walls (Muren)
  wall: {
    ext: 0.35, // Buitenmuur (Brick + Insulation + Block)
    int: 0.14, // Binnenmuur
  },
};

// --- GEOMETRY HELPERS ---

// Create a 2D Shape for Extrusion
function makeFootprintShape(points) {
  const shape = new THREE.Shape();
  const pathPoints =
    points.length > 1 &&
    points[0].x === points[points.length - 1].x &&
    points[0].z === points[points.length - 1].z
      ? points.slice(0, -1)
      : points;

  pathPoints.forEach((point, index) => {
    if (index === 0) {
      shape.moveTo(point.x, -point.z);
    } else {
      shape.lineTo(point.x, -point.z);
    }
  });
  shape.closePath();
  return shape;
}

// --- PROCEDURAL MATERIALS ---

function useBuildingMaterials() {
  // 1. Belgian Brick (Gevelsteen) - Red/Brown nuances
  const brick = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    // Base color (Rust/Clay)
    ctx.fillStyle = '#8B5A40';
    ctx.fillRect(0, 0, 512, 512);

    // Noise & texture
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = Math.random() > 0.6 ? '#6d4230' : '#a06a50';
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillRect(x, y, 12, 6); // Brick shape
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3); // Scale texture

    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      bumpMap: tex,
      bumpScale: 0.02,
    });
  }, []);

  // 2. Roof Tiles (Dakpannen) - Dark Anthracite
  const roof = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: SPECS.roof.color,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide, // render both sides of the roof material
    });
  }, []);

  // 3. Glass (Ramen)
  const glass = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#e6e8ea',
      transmission: 0.85,
      thickness: 0.01,
      roughness: 0.05,
      metalness: 0.0,
      ior: 1.5,
      reflectivity: 0.25,
      transparent: true,
      opacity: 1.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  // 4. Frames (Schrijnwerk) - Dark Grey/Black (PVC/Alu)
  const frame = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#383E42',
      roughness: 0.55,
      metalness: 0.12,
    });
  }, []);

  return { brick, roof, glass, frame };
}

type FacadeKey = 'front' | 'rear' | 'left' | 'right';

// --- HOUSE COMPONENTS ---

function Walls() {
  const { brick } = useBuildingMaterials();
  return null;
}

function Roof({ visible = true }: { visible?: boolean }) {
  const { roof } = useBuildingMaterials();
  const { meshes } = useMemo(() => buildRoofMeshes(), []);

  return (
    <group visible={visible}>
      {meshes.map((mesh, index) => (
        <mesh
          key={`roof-plane-${index}`}
          geometry={mesh.geometry}
          material={roof}
          position={mesh.position}
          rotation={mesh.rotation}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

function Window({ w, h, x, y, z, rot = 0, type = 'standard' }) {
  const { glass, frame } = useBuildingMaterials();
  const depth = 0.2; // Frame depth

  return (
    <group position={[x, y, z]} rotation={[0, Math.PI, 0]}>
      {/* Frame Box */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, depth]} />
        <primitive object={frame} attach="material" />
      </mesh>

      {/* Glass Pane */}
      <mesh position={[0, h / 2, 0]}>
        <planeGeometry args={[w - 0.1, h - 0.1]} />
        <primitive object={glass} attach="material" />
      </mesh>

      {/* Grid dividers (Kleinhouten) for "Classic" style */}
      {type === 'classic' && (
        <mesh position={[0, h / 2, 0.02]}>
          <boxGeometry args={[w, 0.04, 0.02]} /> {/* Horiz bar */}
          <primitive object={frame} attach="material" />
        </mesh>
      )}
      {type === 'classic' && (
        <mesh position={[0, h / 2, 0.02]}>
          <boxGeometry args={[0.04, h, 0.02]} /> {/* Vert bar */}
          <primitive object={frame} attach="material" />
        </mesh>
      )}
    </group>
  );
}

function Openings() {
  const backZ = rearZ; // Achtergevel

  return (
    <group>
      {/* --- VOORGEVEL (Front) --- */}
      {/* Living Room Window (Left) */}
      <Window w={1.8} h={1.6} x={-2.0} y={1.0} z={frontZ} type="classic" />
      {/* Front Door (Right) */}
      <Window w={1.0} h={2.2} x={2.0} y={1.1} z={frontZ} type="standard" />

      {/* First Floor Front Windows */}
      <Window w={1.4} h={1.4} x={-2.0} y={4.0} z={frontZ} type="classic" />
      <Window w={1.4} h={1.4} x={2.0} y={4.0} z={frontZ} type="classic" />

      {/* --- ACHTERGEVEL (Rear) --- */}
      {/* Huge Sliding Door (Schuifraam) for Eethoek */}
      <Window
        w={4.5}
        h={2.4}
        x={0}
        y={1.2}
        z={backZ}
        rot={Math.PI}
        type="standard"
      />

      {/* First Floor Rear Windows */}
      <Window
        w={1.6}
        h={1.4}
        x={-2.0}
        y={4.0}
        z={backZ}
        rot={Math.PI}
        type="standard"
      />
      <Window
        w={1.6}
        h={1.4}
        x={2.0}
        y={4.0}
        z={backZ}
        rot={Math.PI}
        type="standard"
      />
    </group>
  );
}

function Slab({ y, thickness = SPECS.levels.slab, color = '#d9c6a2', shape }: any) {
  const geom = useMemo(
    () => {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
      geometry.rotateX(-Math.PI / 2);
      return geometry;
    },
    [shape, thickness]
  );

  return (
    <mesh
      position={[0, y, 0]}
      receiveShadow
      castShadow
    >
      <primitive object={geom} attach="geometry" />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function getBoxProps(bounds: { xMin: number; xMax: number; zMin: number; zMax: number; yMin: number; yMax: number }) {
  const width = bounds.xMax - bounds.xMin;
  const height = bounds.yMax - bounds.yMin;
  const depth = bounds.zMax - bounds.zMin;

  return {
    size: [width, height, depth] as [number, number, number],
    position: [
      (bounds.xMin + bounds.xMax) / 2,
      (bounds.yMin + bounds.yMax) / 2,
      (bounds.zMin + bounds.zMax) / 2,
    ] as [number, number, number],
  };
}

function RoomHitbox({ room, highlighted, onSelect }: any) {
  const { position, size } = useMemo(() => getBoxProps(room.bounds), [room.bounds]);
  const geometry = useMemo(() => new THREE.BoxGeometry(...size), [size]);

  return (
    <group position={position}>
      <mesh
        geometry={geometry}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(room.id);
        }}
        onPointerEnter={(event) => event.stopPropagation()}
        onPointerOver={(event) => event.stopPropagation()}
      >
        <meshStandardMaterial
          transparent
          opacity={highlighted ? 0.12 : 0}
          color="#4fa3f7"
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// --- MAIN SCENE ---

export default function HouseViewer() {
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const debugOrientation = import.meta.env.VITE_DEBUG_ORIENTATION === 'true' || searchParams.get('debug') === '1';
  const screenshotMode = searchParams.get('screenshot') === '1';
  const deterministicDpr = screenshotMode ? 1 : undefined;
  const cameraPreset = screenshotMode
    ? {
        position: [-8, 5, -16] as [number, number, number],
        target: [0, 1.2, 0] as [number, number, number],
      }
    : null;

  const [activeFloors, setActiveFloors] = useState({
    basement: true,
    ground: true,
    first: true,
    attic: true,
  });
  const [showTerrain, setShowTerrain] = useState(true);
  const [showRoof, setShowRoof] = useState(true);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const [cutawayEnabled, setCutawayEnabled] = useState(false);
  const [facadeVisibility, setFacadeVisibility] = useState<Record<FacadeKey, boolean>>({
    front: true,
    rear: true,
    left: true,
    right: true,
  });
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const allFloorsActive = Object.values(activeFloors).every(Boolean);

  const allRooms = useMemo(() => [...roomsGround, ...roomsFirst], []);
  const selectedRoom = useMemo(
    () => allRooms.find((room) => room.id === selectedRoomId) || null,
    [allRooms, selectedRoomId]
  );

  const buttonStyle = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #222',
    background: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    fontWeight: 700,
  };

  const handleToggleFloor = (key: keyof typeof activeFloors) => {
    setActiveFloors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAllFloors = () => {
    setActiveFloors({
      basement: true,
      ground: true,
      first: true,
      attic: true,
    });
  };

  const handleBasementView = () => {
    if (!cameraRef.current || !controlsRef.current) {
      return;
    }
    cameraRef.current.position.set(6, -0.5, 6);
    controlsRef.current.target.set(0, -1, 0);
    controlsRef.current.minPolarAngle = 0.2;
    controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.1;
    controlsRef.current.update();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 2,
          background: 'rgba(240,240,240,0.9)',
          padding: '10px 12px',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>Cutaway Mode</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                ...buttonStyle,
                background: cutawayEnabled ? '#1d6f42' : buttonStyle.background,
                color: cutawayEnabled ? '#fff' : '#111',
              }}
              onClick={() => setCutawayEnabled((prev) => !prev)}
            >
              {cutawayEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
            {(
              [
                { key: 'front', label: 'Front' },
                { key: 'rear', label: 'Rear' },
                { key: 'left', label: 'Left' },
                { key: 'right', label: 'Right' },
              ] as { key: FacadeKey; label: string }[]
            ).map(({ key, label }) => {
              const isActive = facadeVisibility[key];
              return (
                <button
                  key={key}
                  style={{
                    ...buttonStyle,
                    background: isActive ? '#8B5A40' : '#ddd',
                    color: isActive ? '#fff' : '#444',
                  }}
                  onClick={() =>
                    setFacadeVisibility((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <span style={{ fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}>Floor Isolation</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {(
            [
              { key: 'basement', label: 'Basement' },
              { key: 'ground', label: 'Ground' },
              { key: 'first', label: 'First' },
              { key: 'attic', label: 'Attic' },
            ] as { key: keyof typeof activeFloors; label: string }[]
          ).map(({ key, label }) => {
            const isActive = activeFloors[key];
            return (
              <button
                key={key}
                style={{
                  ...buttonStyle,
                  background: isActive ? '#8B5A40' : buttonStyle.background,
                  color: isActive ? '#fff' : '#111',
                  width: '100%',
                }}
                onClick={() => handleToggleFloor(key)}
              >
                {label}
              </button>
            );
          })}
          <button
            style={{
              ...buttonStyle,
              background: allFloorsActive ? '#1d6f42' : buttonStyle.background,
              color: allFloorsActive ? '#fff' : '#111',
              width: '100%',
            }}
            onClick={handleAllFloors}
          >
            All
          </button>
        </div>

        <span style={{ fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}>Site View</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <button
            style={{
              ...buttonStyle,
              background: showTerrain ? '#8B5A40' : buttonStyle.background,
              color: showTerrain ? '#fff' : '#111',
              width: '100%',
            }}
            onClick={() => setShowTerrain((prev) => !prev)}
          >
            Ground
          </button>
          <button
            style={{
              ...buttonStyle,
              background: showRoof ? '#1d6f42' : buttonStyle.background,
              color: showRoof ? '#fff' : '#111',
              width: '100%',
            }}
            onClick={() => setShowRoof((prev) => !prev)}
          >
            {showRoof ? 'Roof: ON' : 'Roof: OFF'}
          </button>
          <button style={{ ...buttonStyle, width: '100%' }} onClick={handleBasementView}>
            Basement View
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>Room Focus</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                ...buttonStyle,
                background: focusMode ? '#1d6f42' : buttonStyle.background,
                color: focusMode ? '#fff' : '#111',
              }}
              onClick={() => setFocusMode((prev) => !prev)}
            >
              {focusMode ? 'Focus ON' : 'Focus OFF'}
            </button>
          </div>
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontWeight: 700 }}>Selected Room</span>
            {selectedRoom ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>{selectedRoom.label}</span>
                <code style={{ fontSize: 12 }}>{selectedRoom.id}</code>
              </div>
            ) : (
              <span style={{ color: '#555' }}>Tap a room to select it</span>
            )}
            <button
              style={{ ...buttonStyle, alignSelf: 'flex-start' }}
              onClick={() => setSelectedRoomId(null)}
              disabled={!selectedRoom}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

        <Canvas
          shadows
          camera={{ position: cameraPreset?.position ?? [0, 5, -18], fov: 50 }}
          gl={{ antialias: true, dpr: deterministicDpr }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
        }}
        >
          <HouseScene
            debugOrientation={debugOrientation}
            screenshotMode={screenshotMode}
            cameraPreset={cameraPreset}
            cameraRef={cameraRef}
            activeFloors={activeFloors}
            showTerrain={showTerrain}
            showRoof={showRoof}
            cutawayEnabled={cutawayEnabled}
            facadeVisibility={facadeVisibility}
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            controlsRef={controlsRef}
          />
      </Canvas>
    </div>
  );
}

function HouseScene({
  debugOrientation,
  screenshotMode,
  cameraPreset,
  cameraRef,
  activeFloors,
  showTerrain,
  showRoof,
  cutawayEnabled,
  facadeVisibility,
  selectedRoomId,
  onSelectRoom,
  controlsRef,
}: {
  debugOrientation: boolean;
  screenshotMode: boolean;
  cameraPreset: { position: [number, number, number]; target: [number, number, number] } | null;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  activeFloors: { basement: boolean; ground: boolean; first: boolean; attic: boolean };
  showTerrain: boolean;
  showRoof: boolean;
  cutawayEnabled: boolean;
  facadeVisibility: Record<FacadeKey, boolean>;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  controlsRef: React.MutableRefObject<any>;
}) {
  const BRICK_REPEAT_X = 1.3;
  const BRICK_REPEAT_Y = 0.625;
  const LOW_QUALITY = false;
  const { glass, frame } = useBuildingMaterials();

  const { gl, scene, camera } = useThree();
  const firstFrameRef = useRef(false);
  const brickTex = useTexture('/textures/brick2.jpg', (loader) => {
    loader.manager = loadingManager;
  });
  const fallbackWallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8B5A40',
        roughness: 0.9,
        side: THREE.FrontSide,
      }),
    []
  );
  const wallMaterial = useMemo(() => {
    const material =
      LOW_QUALITY || !brickTex || !brickTex.image
        ? fallbackWallMaterial.clone()
        : (() => {
            brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
            brickTex.repeat.set(BRICK_REPEAT_X, BRICK_REPEAT_Y);
            brickTex.colorSpace = THREE.SRGBColorSpace;
            const maxAniso = gl?.capabilities?.getMaxAnisotropy ? gl.capabilities.getMaxAnisotropy() : 1;
            brickTex.anisotropy = Math.min(4, maxAniso);
            brickTex.needsUpdate = true;

            return new THREE.MeshStandardMaterial({
              map: brickTex,
              roughness: 0.9,
              metalness: 0,
              side: THREE.FrontSide,
            });
          })();

    return material;
  }, [LOW_QUALITY, brickTex, fallbackWallMaterial, gl]);
  const facadeMaterial = useMemo(() => {
    const material = wallMaterial.clone();
    material.side = THREE.DoubleSide;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
    material.polygonOffsetUnits = -1;
    return material;
  }, [wallMaterial]);
  const eavesBandMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f2f2f2',
        roughness: 0.9,
        side: THREE.FrontSide,
      }),
    []
  );
  const basementCeilingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f5f5f5',
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    []
  );

  const slabGroupRef = useRef<THREE.Group>(null);
  const wallGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Pre-warm shaders once the scene graph exists to reduce first-frame stutter.
    if (gl?.compile) {
      gl.compile(scene, camera);
    }
  }, [camera, gl, scene]);

  useEffect(() => {
    if (debugOrientation) {
      logOrientationAssertions();
    }
  }, [debugOrientation]);

  useEffect(() => {
    if (!cameraPreset || !cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(...cameraPreset.position);
    controlsRef.current.target.set(...cameraPreset.target);
    controlsRef.current.update();
  }, [cameraPreset]);

  useFrame(() => {
    if (firstFrameRef.current) return;
    firstFrameRef.current = true;
    markFirstFrameRendered();
  });

  const showBasement = activeFloors.basement;
  const showGround = activeFloors.ground;
  const showFirst = activeFloors.first;
  const showAttic = activeFloors.attic;
  const firstFloorLevelY = levelHeights.firstFloor;
  const firstFloorCeilingHeight = ceilingHeights.first;
  const atticLevelY = firstFloorLevelY + firstFloorCeilingHeight; // 2.60 + 2.50 = 5.10
  const wallShellVisible = !cutawayEnabled || Object.values(facadeVisibility).every(Boolean);
  const basementFloorLevel = -2.0;
  const basementCeilingLevel = -0.01;
  const eavesBandMesh = useMemo(() => {
    console.log('✅ EAVES BAND ACTIVE', Date.now(), {
      expectedYStart: 5.10,
      expectedYEnd: 5.70,
    });
    return (
      <mesh
        geometry={wallsEavesBand.shell.geometry}
        position={wallsEavesBand.shell.position}
        rotation={wallsEavesBand.shell.rotation}
        material={eavesBandMaterial}
        castShadow
        receiveShadow
        visible={wallShellVisible}
      />
    );
  }, [eavesBandMaterial, wallShellVisible]);

  const getRearFacadeSpan = (points: { x: number; z: number }[]) => {
    if (!points || points.length === 0) {
      return null;
    }
    const maxZ = points.reduce((max, point) => Math.max(max, point.z), -Infinity);
    const rearPoints = points.filter((point) => Math.abs(point.z - maxZ) < 1e-6);
    const minX = rearPoints.reduce((min, point) => Math.min(min, point.x), Infinity);
    const maxX = rearPoints.reduce((max, point) => Math.max(max, point.x), -Infinity);
    return {
      minX,
      maxX,
      maxZ,
      width: maxX - minX,
    };
  };

  const groundOuterEnvelope = useMemo(() => getEnvelopeOuterPolygon(), []);
  const groundEnvelopePolygon = useMemo(
    () => getEnvelopeInnerPolygon(wallThickness.exterior, groundOuterEnvelope),
    [groundOuterEnvelope]
  );
  const groundEnvelopeShape = useMemo(() => makeFootprintShape(groundEnvelopePolygon), [groundEnvelopePolygon]);
  const basementCeilingGeometry = useMemo(() => {
    const geometry = new THREE.ShapeGeometry(groundEnvelopeShape);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, [groundEnvelopeShape]);

  const firstOuterEnvelope = useMemo(() => getEnvelopeFirstOuterPolygon(), []);
  const firstEnvelopePolygon = useMemo(
    () => getEnvelopeInnerPolygon(wallThickness.exterior, firstOuterEnvelope),
    [firstOuterEnvelope]
  );
  const groundRearSpan = useMemo(() => getRearFacadeSpan(groundOuterEnvelope), [groundOuterEnvelope]);
  const firstRearSpan = useMemo(() => getRearFacadeSpan(firstOuterEnvelope), [firstOuterEnvelope]);
  const firstEnvelopeShape = useMemo(() => makeFootprintShape(firstEnvelopePolygon), [firstEnvelopePolygon]);

  const flatRoofPolygon = useMemo(() => getFlatRoofPolygon(), []);
  const flatRoofShape = useMemo(() => makeFootprintShape(flatRoofPolygon), [flatRoofPolygon]);
  const greenRoofPolygon = useMemo(() => getEnvelopeInnerPolygon(0.4, flatRoofPolygon), [flatRoofPolygon]);
  const greenRoofShape = useMemo(
    () => (greenRoofPolygon && greenRoofPolygon.length >= 3 ? makeFootprintShape(greenRoofPolygon) : null),
    [greenRoofPolygon]
  );

  const activeRooms = useMemo(() => {
    const list: any[] = [];

    if (showGround) {
      list.push(...roomsGround);
    }

    if (showFirst) {
      list.push(...roomsFirst);
    }

    return list;
  }, [showGround, showFirst]);
  const baseRoofThickness = SPECS.levels.slab;
  const flatRoofY = firstFloorLevelY + 0.02;
  const greenRoofY = flatRoofY + baseRoofThickness + 0.002;

  useEffect(() => {
    console.log('Ground slab polygon points (first 5):', groundEnvelopePolygon.slice(0, 5));
    console.log('First floor slab polygon points (first 5):', firstEnvelopePolygon.slice(0, 5));
    console.log('slabGroup position:', slabGroupRef.current?.position.toArray());
    console.log('wallGroup position:', wallGroupRef.current?.position.toArray());
    const offsetPoints = groundEnvelopePolygon.slice(0, 2).map((point) => ({
      x: point.x + originOffset.x,
      z: point.z + originOffset.z,
    }));
    console.log('Origin offset applied:', originOffset);
    console.log('First two envelope points after offset:', offsetPoints);
  }, [firstEnvelopePolygon, groundEnvelopePolygon]);

  useEffect(() => {
    console.log('✅ windowsSide parented under originOffset group');
  }, []);

  return (
    <>
      {/* Environment - Fixed CORS issue by using Sky instead of external HDRI */}
      <Sky sunPosition={[100, 20, 100]} turbidity={2} rayleigh={0.5} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
      </directionalLight>

      <OrientationHelpers visible={debugOrientation || screenshotMode} />
 
      {/* HOUSE ASSEMBLY */}
      <group position={[originOffset.x, 0, originOffset.z]}>
        {/* ORIENTATION DEBUG — WORLD SPACE */}
        <mesh position={[-10, 1, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>

        <mesh position={[10, 1, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>

        <group ref={wallGroupRef} name="wallGroup">
          {showBasement && (
            <mesh
              geometry={wallsBasement.shell.geometry}
              position={wallsBasement.shell.position}
              rotation={wallsBasement.shell.rotation}
              material={wallMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showGround && (
            <mesh
              geometry={wallsGround.shell.geometry}
              position={wallsGround.shell.position}
              rotation={wallsGround.shell.rotation}
              material={wallMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showGround &&
            wallsGround.leftFacades?.map((facade, index) => (
              <mesh
                key={`ground-left-facade-${index}`}
                geometry={facade.geometry}
                position={facade.position}
                rotation={facade.rotation}
                material={facadeMaterial}
                castShadow
                receiveShadow
                visible={wallShellVisible}
              />
            ))}
          {showGround &&
            wallsGround.rightSideFacades?.map((facade, index) => (
              <mesh
                key={`ground-rs-${index}`}
                geometry={facade.geometry}
                position={facade.position}
                rotation={facade.rotation}
                material={facadeMaterial}
                castShadow
                receiveShadow
                visible={wallShellVisible}
              />
            ))}
          {showGround &&
            wallsGround.rightFacades.map((facade, index) => (
              <mesh
                key={`ground-right-facade-${index}`}
                geometry={facade.geometry}
                position={facade.position}
                rotation={facade.rotation}
                material={facadeMaterial}
                castShadow
                receiveShadow
                visible={wallShellVisible}
              />
            ))}
          {showGround && (wallsGround as any).extensionRightWall && (
            <mesh
              geometry={(wallsGround as any).extensionRightWall.geometry}
              position={(wallsGround as any).extensionRightWall.position}
              rotation={(wallsGround as any).extensionRightWall.rotation}
              material={facadeMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showGround && (
            <mesh
              geometry={wallsGround.rearFacade.geometry}
              position={wallsGround.rearFacade.position}
              rotation={wallsGround.rearFacade.rotation}
              material={wallMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showGround && (wallsGround as any).frontFacade && (
            <mesh
              geometry={(wallsGround as any).frontFacade.geometry}
              position={(wallsGround as any).frontFacade.position}
              rotation={(wallsGround as any).frontFacade.rotation}
              material={wallMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showFirst && (
            <mesh
              geometry={wallsFirst.shell.geometry}
              position={wallsFirst.shell.position}
              rotation={wallsFirst.shell.rotation}
              material={wallMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showFirst &&
            wallsFirst.rightFacades.map((facade, index) => (
              <mesh
                key={`first-right-facade-${index}`}
                geometry={facade.geometry}
                position={facade.position}
                rotation={facade.rotation}
                material={facadeMaterial}
                castShadow
                receiveShadow
                visible={wallShellVisible}
              />
            ))}
          {showFirst &&
            (wallsFirst as any).rightSideFacades?.map((facade: any, index: number) => (
              <mesh
                key={`first-rs-${index}`}
                geometry={facade.geometry}
                position={facade.position}
                rotation={facade.rotation}
                material={facadeMaterial}
                castShadow
                receiveShadow
                visible={wallShellVisible}
              />
            ))}
          {showFirst && wallsFirst.leftFacade && (
            <mesh
              geometry={wallsFirst.leftFacade.geometry}
              position={wallsFirst.leftFacade.position}
              rotation={wallsFirst.leftFacade.rotation}
              material={facadeMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showFirst && (
            <mesh
              geometry={wallsFirst.rearFacade.geometry}
              position={wallsFirst.rearFacade.position}
              rotation={wallsFirst.rearFacade.rotation}
              material={wallMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {showFirst && (wallsFirst as any).frontFacade && (
            <mesh
              geometry={(wallsFirst as any).frontFacade.geometry}
              position={(wallsFirst as any).frontFacade.position}
              rotation={(wallsFirst as any).frontFacade.rotation}
              material={wallMaterial}
              castShadow
              receiveShadow
              visible={wallShellVisible}
            />
          )}
          {eavesBandMesh}
          <group name="rearWindows" visible={wallShellVisible}>
            {windowsRear.meshes.map((mesh) => {
              const isGlass = mesh.id.toLowerCase().includes('_glass');
              const fallbackMaterial = isGlass ? glass : frame;
              const material = mesh.material ?? fallbackMaterial;
              return (
                <mesh
                  key={mesh.id}
                  geometry={mesh.geometry}
                  position={mesh.position}
                  rotation={mesh.rotation}
                  material={material}
                  castShadow={!isGlass}
                  receiveShadow={!isGlass}
                  renderOrder={isGlass ? 10 : undefined}
                />
              );
            })}
          </group>

          <group name="sideWindows" visible={wallShellVisible}>
            {windowsSide.meshes.map((mesh) => {
              const isGlass = mesh.id.toLowerCase().includes('_glass');
              const fallbackMaterial = isGlass ? glass : frame;
              const material = mesh.material ?? fallbackMaterial;
              return (
                <mesh
                  key={mesh.id}
                  geometry={mesh.geometry}
                  position={mesh.position}
                  rotation={mesh.rotation}
                  material={material}
                  castShadow={!isGlass}
                  receiveShadow={!isGlass}
                  renderOrder={isGlass ? 10 : undefined}
                />
              );
            })}
            {windowsRightSide.meshes.map((mesh) => (
              <mesh
                key={mesh.id}
                geometry={mesh.geometry}
                position={mesh.position}
                rotation={mesh.rotation as [number, number, number]}
                material={mesh.material ?? glass}
                castShadow
                receiveShadow
              />
            ))}
          </group>
          <group name="frontWindows" visible={wallShellVisible}>
            {windowsFront.meshes.map((mesh) => {
              const isGlass = mesh.id.toLowerCase().includes('_glass');
              const fallbackMaterial = isGlass ? glass : frame;
              const material = mesh.material ?? fallbackMaterial;
              return (
                <mesh
                  key={mesh.id}
                  geometry={mesh.geometry}
                  position={mesh.position}
                  rotation={mesh.rotation}
                  material={material}
                  castShadow={!isGlass}
                  receiveShadow={!isGlass}
                  renderOrder={isGlass ? 10 : undefined}
                />
              );
            })}
          </group>
        </group>

        <group ref={slabGroupRef} name="slabGroup">
          {showBasement && (
            <>
              <Slab y={basementFloorLevel} shape={groundEnvelopeShape} />
              <mesh position={[0, basementCeilingLevel, 0]} receiveShadow>
                <primitive object={basementCeilingGeometry} attach="geometry" />
                <primitive object={basementCeilingMaterial} attach="material" />
              </mesh>
            </>
          )}
          {showGround && <Slab y={0} shape={groundEnvelopeShape} />}
          {showFirst && <Slab y={firstFloorLevelY} shape={firstEnvelopeShape} />}
          {showAttic && <Slab y={atticLevelY} shape={firstEnvelopeShape} />}
          {showFirst && <Slab y={flatRoofY} shape={flatRoofShape} color="#383E42" />}
          {showFirst && greenRoofShape && (
            <Slab y={greenRoofY} shape={greenRoofShape} color="#4F7D3A" thickness={0.06} />
          )}
        </group>

        <group name="roomHitboxes">
          {activeRooms.map((room) => (
            <RoomHitbox
              key={room.id}
              room={room}
              highlighted={selectedRoomId === room.id}
              onSelect={onSelectRoom}
            />
          ))}
        </group>

        <Roof visible={showRoof} />
      </group>

      {/* GROUNDS */}
      {showTerrain && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#3a5f0b" roughness={1} />
        </mesh>
      )}

      {/* CONTROLS */}
      <OrbitControls
        ref={controlsRef}
        target={[0, 1.5, 0]}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going under ground
      />
    </>
  );
}
