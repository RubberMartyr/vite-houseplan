import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { OrbitControls, Sky, useTexture } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { wallsBasement } from '../model/wallsBasement';
import { buildWallsGround } from '../model/wallsGround';
import { buildWallsFirst } from '../model/wallsFirst';
import { buildFacadeWindowPlacements } from '../model/builders/buildFacadeWindowPlacements';
import { buildSideWindows } from '../model/builders/buildSideWindows';
import { createFacadeContext } from '../model/builders/facadeContext';
import { getOuterWallXAtZ } from '../model/builders/wallSurfaceResolver';
import { leftSideWindowSpecs, rightSideWindowSpecs } from '../model/builders/windowFactory';
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
import { buildHouse } from '../engine/buildHouse';
import { roomsGround } from '../model/roomsGround'
import { RoomVolume } from '../model/roomsGround';
import { roomsFirst } from '../model/roomsFirst'
import { windowsRear } from '../model/windowsRear';
import { windowsFront } from '../model/windowsFront';
import { markFirstFrameRendered } from '../loadingManager';
import { assertOrientationWorld, assertWorldOrientation, logOrientationAssertions } from '../model/orientation';
import { ViewerControls } from './ViewerControls';
import { runtimeFlags } from '../model/runtimeFlags';
import type { FacadeWindowPlacement } from '../model/types/FacadeWindowPlacement';
import { architecturalHouse } from '../engine/architecturalHouse';
import { deriveSlabsFromLevels } from '../engine/deriveSlabs';
import { LegacyHouse } from '../legacy/LegacyHouse';
import { EngineHouse } from '../engine/EngineHouse';

const DEBUG_ENGINE_WALLS = true; // dev-only, set false to hide

if (runtimeFlags.isDev) {
  console.log('✅ ACTIVE VIEWER FILE: HouseViewer.tsx', Date.now());
}

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
function makeFootprintShape(points: FootprintPoint[]): THREE.Shape {
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


type TextLabelProps = {
  text: string;
  position: [number, number, number];
  color?: string;
};

function TextLabel({ text, position, color = '#111' }: TextLabelProps) {
  const sprite = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const instance = new THREE.Sprite(material);
    instance.scale.set(1.8, 0.9, 1);
    return instance;
  }, [color, text]);

  if (!sprite) {
    return null;
  }

  return <primitive object={sprite} position={position} />;
}

// --- PROCEDURAL MATERIALS ---

function useBuildingMaterials() {
  // 1. Belgian Brick (Gevelsteen) - Red/Brown nuances
  const brick = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to create 2D context for brick material texture.');
    }

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
type FloorVisibility = { basement: boolean; ground: boolean; first: boolean; attic: boolean };
type FloorKey = keyof FloorVisibility;
type FootprintPoint = { x: number; z: number };
type PositionedMesh = {
  geometry: THREE.BufferGeometry;
  position?: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
};
type SlabProps = {
  y: number;
  thickness?: number;
  color?: THREE.ColorRepresentation;
  shape: THREE.Shape;
};
type WindowProps = {
  w: number;
  h: number;
  x: number;
  y: number;
  z: number;
  rot?: number;
  type?: 'standard' | 'classic';
};
type HouseSceneCameraPreset = { position: [number, number, number]; target: [number, number, number] };

// --- HOUSE COMPONENTS ---

function Walls() {
  const { brick } = useBuildingMaterials();
  return null;
}

function Roof({ visible = true }: { visible?: boolean }) {
  const { roof } = useBuildingMaterials();
  const house = useMemo(() => buildHouse(), []);
  const { meshes } = house.roof;

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

function Window({ w, h, x, y, z, rot = 0, type = 'standard' }: WindowProps) {
  const { glass, frame } = useBuildingMaterials();
  const depth = 0.2; // Frame depth

  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
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
        rot={0}
        type="standard"
      />

      {/* First Floor Rear Windows */}
      <Window
        w={1.6}
        h={1.4}
        x={-2.0}
        y={4.0}
        z={backZ}
        rot={0}
        type="standard"
      />
      <Window
        w={1.6}
        h={1.4}
        x={2.0}
        y={4.0}
        z={backZ}
        rot={0}
        type="standard"
      />
    </group>
  );
}

function Slab({ y, thickness = SPECS.levels.slab, color = '#d9c6a2', shape }: SlabProps) {
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

function RoomHitbox({ room, highlighted, onSelect }: { room: RoomVolume; highlighted: boolean; onSelect: (roomId: string) => void }) {
  const { position, size } = useMemo(() => getBoxProps(room.bounds), [room.bounds]);
  const geometry = useMemo(() => new THREE.BoxGeometry(...size), [size]);

  return (
    <group position={position}>
      <mesh
        geometry={geometry}
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          onSelect(room.id);
        }}
        onPointerEnter={(event: ThreeEvent<PointerEvent>) => event.stopPropagation()}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => event.stopPropagation()}
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
        position: [8, 5, 16] as [number, number, number],
        target: [0, 1.2, 0] as [number, number, number],
      }
    : null;

  const [activeFloors, setActiveFloors] = useState<FloorVisibility>({
    basement: true,
    ground: true,
    first: true,
    attic: true,
  });
  const [showTerrain, setShowTerrain] = useState(true);
  const [showRoof, setShowRoof] = useState(true);
  const [showLegacy, setShowLegacy] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [cutawayEnabled, setCutawayEnabled] = useState(false);
  const [facadeVisibility, setFacadeVisibility] = useState<Record<FacadeKey, boolean>>({
    front: true,
    rear: true,
    left: true,
    right: true,
  });
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const allFloorsActive = Object.values(activeFloors).every(Boolean);

  const allRooms = useMemo(() => [...roomsGround, ...roomsFirst], []);
  const selectedRoom = useMemo(
    () => allRooms.find((room) => room.id === selectedRoomId) || null,
    [allRooms, selectedRoomId]
  );

  const handleToggleFloor = (key: FloorKey) => {
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
    controlsRef.current.minPolarAngle = 0.2;
    controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.1;
    controlsRef.current.update();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <ViewerControls
        cutawayEnabled={cutawayEnabled}
        onToggleCutaway={() => setCutawayEnabled((prev) => !prev)}
        facadeVisibility={facadeVisibility}
        onToggleFacade={(key) =>
          setFacadeVisibility((prev) => ({
            ...prev,
            [key]: !prev[key],
          }))
        }
        activeFloors={activeFloors}
        allFloorsActive={allFloorsActive}
        onToggleFloor={handleToggleFloor}
        onSetAllFloors={handleAllFloors}
        showTerrain={showTerrain}
        onToggleTerrain={() => setShowTerrain((prev) => !prev)}
        showRoof={showRoof}
        onToggleRoof={() => setShowRoof((prev) => !prev)}
        onBasementView={handleBasementView}
        showLegacy={showLegacy}
        onToggleLegacy={() => setShowLegacy((v) => !v)}
        showWindows={showWindows}
        onToggleWindows={() => setShowWindows((v) => !v)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((prev) => !prev)}
        selectedRoom={selectedRoom}
        onClearSelectedRoom={() => setSelectedRoomId(null)}
      />

      <Canvas
        shadows
        camera={{ position: cameraPreset?.position ?? [0, 7, -12], fov: 50 }}
        dpr={deterministicDpr}
        gl={{ antialias: true }}
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
          showLegacy={showLegacy}
          showWindows={showWindows}
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
  showLegacy,
  showWindows,
  cutawayEnabled,
  facadeVisibility,
  selectedRoomId,
  onSelectRoom,
  controlsRef,
}: {
  debugOrientation: boolean;
  screenshotMode: boolean;
  cameraPreset: HouseSceneCameraPreset | null;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  activeFloors: FloorVisibility;
  showTerrain: boolean;
  showRoof: boolean;
  showLegacy: boolean;
  showWindows: boolean;
  cutawayEnabled: boolean;
  facadeVisibility: Record<FacadeKey, boolean>;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const BRICK_REPEAT_X = 1.3;
  const BRICK_REPEAT_Y = 0.625;
  const LOW_QUALITY = false;
  const DEBUG_WALL_PLANES = true;
  const { glass, frame } = useBuildingMaterials();

  const { gl, scene, camera } = useThree();
  const firstFrameRef = useRef(false);
  const brickTex = useTexture('/textures/brick2.jpg');
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
  const houseGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Pre-warm shaders once the scene graph exists to reduce first-frame stutter.
    if (gl?.compile) {
      gl.compile(scene, camera);
    }
  }, [camera, gl, scene]);

  useEffect(() => {
    if (runtimeFlags.isDev) {
      assertWorldOrientation();
    }
  }, []);

  useEffect(() => {
    if (debugOrientation) {
      logOrientationAssertions();

      const group = houseGroupRef.current;
      if (runtimeFlags.isDev && group) {
        assertOrientationWorld(group, camera, gl.domElement);
      }
    }
  }, [camera, debugOrientation, gl.domElement]);

  useEffect(() => {
    if (!cameraPreset || !cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(...cameraPreset.position);
    controlsRef.current.target.set(...cameraPreset.target);
    controlsRef.current.update();
  }, [cameraPreset]);

  useFrame(() => {
    if (firstFrameRef.current) return;
    firstFrameRef.current = true;

    if (runtimeFlags.isDev) {
      const group = houseGroupRef.current;
      if (group) {
        const orientation = assertOrientationWorld(group, camera, gl.domElement);
        (window as any).__HOUSE_ORIENTATION__ = orientation;

        const leftScreenX = orientation.facades.left.screen.x;
        const rightScreenX = orientation.facades.right.screen.x;
        const frontScreenX = orientation.facades.front.screen.x;
        const rearScreenX = orientation.facades.rear.screen.x;

        console.assert(
          leftScreenX < rightScreenX,
          '[orientation] Expected left facade marker to render left of right marker on screen.',
          orientation
        );

        if (!(leftScreenX < rightScreenX)) {
          console.error('[orientation] Screen-space facade assertion failed', {
            leftScreenX,
            rightScreenX,
            frontScreenX,
            rearScreenX,
            orientation,
          });
        }
      }
    }

    markFirstFrameRendered();
  });

  const showBasement = activeFloors.basement;
  const showGround = activeFloors.ground;
  const showFirst = activeFloors.first;
  const showAttic = activeFloors.attic;
  const derivedSlabs = deriveSlabsFromLevels(architecturalHouse);
  const leftCtx = useMemo(() => createFacadeContext('architecturalLeft'), []);
  const rightCtx = useMemo(() => createFacadeContext('architecturalRight'), []);
  const leftPlacements = useMemo<FacadeWindowPlacement[]>(
    () => buildFacadeWindowPlacements(leftCtx, leftSideWindowSpecs),
    [leftCtx]
  );
  const rightPlacements = useMemo<FacadeWindowPlacement[]>(
    () => buildFacadeWindowPlacements(rightCtx, rightSideWindowSpecs),
    [rightCtx]
  );
  const leftSideWindows = useMemo(() => buildSideWindows({ ctx: leftCtx, placements: leftPlacements }), [leftCtx, leftPlacements]);
  const rightSideWindows = useMemo(() => buildSideWindows({ ctx: rightCtx, placements: rightPlacements }), [rightCtx, rightPlacements]);
  if (runtimeFlags.debugWindows) {
    console.assert(
      rightPlacements.length > 0,
      'Right facade placements should be populated for side windows.'
    );
  }

  const wallsGround = useMemo(
    () =>
      buildWallsGround({
        leftPlacements,
        rightPlacements,
      }),
    [leftPlacements, rightPlacements]
  );
  const wallsFirst = useMemo(
    () =>
      buildWallsFirst({
        leftPlacements,
        rightPlacements,
      }),
    [leftPlacements, rightPlacements]
  );
  const wallsGroundWithOptionals = wallsGround as typeof wallsGround & {
    extensionRightWall?: PositionedMesh;
    frontFacade?: PositionedMesh;
  };
  const wallsFirstWithOptionals = wallsFirst as typeof wallsFirst & {
    frontFacade?: PositionedMesh;
  };
  const firstFloorLevelY = levelHeights.firstFloor;
  const firstFloorCeilingHeight = ceilingHeights.first;
  const atticLevelY = firstFloorLevelY + firstFloorCeilingHeight; // 2.60 + 2.50 = 5.10
  const wallShellVisible = !cutawayEnabled || Object.values(facadeVisibility).every(Boolean);
  const basementFloorLevel = -2.0;
  const basementCeilingLevel = -0.01;
  const eavesBandMesh = useMemo(() => {
    if (runtimeFlags.isDev) {
      console.log('✅ EAVES BAND ACTIVE', Date.now(), {
        expectedYStart: 5.10,
        expectedYEnd: 5.70,
      });
    }
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

  const getRearFacadeSpan = (points: FootprintPoint[]) => {
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

  useEffect(() => {
    const outer = getEnvelopeOuterPolygon();

    const minX = Math.min(...outer.map((p) => p.x));
    const maxX = Math.max(...outer.map((p) => p.x));
    const minZ = Math.min(...outer.map((p) => p.z));
    const maxZ = Math.max(...outer.map((p) => p.z));

    console.log('ENVELOPE BOUNDS', { minX, maxX, minZ, maxZ });
    console.log('FIRST 4 ENVELOPE POINTS', outer.slice(0, 4));
  }, []);

  const flatRoofPolygon = useMemo(() => getFlatRoofPolygon(), []);
  const flatRoofShape = useMemo(() => makeFootprintShape(flatRoofPolygon), [flatRoofPolygon]);
  const greenRoofPolygon = useMemo(() => getEnvelopeInnerPolygon(0.4, flatRoofPolygon), [flatRoofPolygon]);
  const greenRoofShape = useMemo(
    () => (greenRoofPolygon && greenRoofPolygon.length >= 3 ? makeFootprintShape(greenRoofPolygon) : null),
    [greenRoofPolygon]
  );

  const activeRooms = useMemo(() => {
    const list: RoomVolume[] = [];

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
    if (runtimeFlags.isDev) {
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
    }
  }, [firstEnvelopePolygon, groundEnvelopePolygon]);

  useEffect(() => {
    if (runtimeFlags.debugWindows) {
      console.log('✅ windowsSide parented under originOffset group');
    }
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    const cam = cameraRef.current;
    const root = houseGroupRef.current;

    if (!controls || !cam || !root) return;

    const id = requestAnimationFrame(() => {
      const box = new THREE.Box3().setFromObject(root);
      if (!isFinite(box.min.x) || !isFinite(box.max.x)) return;

      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      const oldTarget = controls.target.clone();
      const offset = cam.position.clone().sub(oldTarget);

      controls.target.copy(center);
      cam.position.copy(center.clone().add(offset));

      const diag = size.length();
      const minDist = Math.max(1.5, diag * 0.35);
      const maxDist = Math.max(80, diag * 4.0);

      controls.minDistance = minDist;
      controls.maxDistance = maxDist;

      const dist = cam.position.distanceTo(center);
      if (dist < minDist) {
        const dir = cam.position.clone().sub(center).normalize();
        cam.position.copy(center.clone().add(dir.multiplyScalar(minDist)));
      }

      cam.lookAt(center);
      cam.updateProjectionMatrix();
      controls.update();
    });

    return () => cancelAnimationFrame(id);
  }, [
    activeFloors.basement,
    activeFloors.ground,
    activeFloors.first,
    activeFloors.attic,
    showRoof,
    showTerrain,
    cutawayEnabled,
    facadeVisibility.front,
    facadeVisibility.rear,
    facadeVisibility.left,
    facadeVisibility.right,
  ]);

  return (
    <>
      {/* Environment - Fixed CORS issue by using Sky instead of external HDRI */}
      <Sky sunPosition={[100, 20, 100]} turbidity={2} rayleigh={0.5} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
      </directionalLight>
      {/* Keep world axes unrotated by rendering them outside the house assembly group. */}
      {debugOrientation && (
        <group position={[originOffset.x, 0, originOffset.z]}>
          <axesHelper args={[10]} />
          <mesh position={[leftX, 0.1, frontZ]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ff4d4f" />
          </mesh>
          <mesh position={[rightX, 0.1, frontZ]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#52c41a" />
          </mesh>
          <Line
            points={[
              [leftX, 0.1, frontZ],
              [rightX, 0.1, frontZ],
            ]}
            color="#1677ff"
            lineWidth={2}
          />
          <TextLabel text="LEFT(-X)" position={[leftX, 0.3, frontZ]} color="#ff4d4f" />
          <TextLabel text="RIGHT(+X)" position={[rightX, 0.3, frontZ]} color="#52c41a" />
        </group>
      )}

      {/* HOUSE ASSEMBLY */}
      <group
        ref={houseGroupRef}
        position={[originOffset.x, 0, originOffset.z]}
      >
        <group ref={wallGroupRef} name="wallGroup">
          {showLegacy && (
            <LegacyHouse
              showLegacy={showLegacy}
              showBasement={showBasement}
              showGround={showGround}
              showFirst={showFirst}
              showWindows={showWindows}
              wallShellVisible={wallShellVisible}
              wallsBasement={wallsBasement}
              wallsGround={wallsGround}
              wallsGroundWithOptionals={wallsGroundWithOptionals}
              wallsFirst={wallsFirst}
              wallsFirstWithOptionals={wallsFirstWithOptionals}
              wallMaterial={wallMaterial}
              facadeMaterial={facadeMaterial}
              eavesBandMesh={eavesBandMesh}
              windowsRear={windowsRear}
              windowsFront={windowsFront}
              glass={glass}
              frame={frame}
              leftSideWindows={leftSideWindows}
              rightSideWindows={rightSideWindows}
            />
          )}
          <EngineHouse
            debugEngineWalls={DEBUG_ENGINE_WALLS}
            architecturalHouse={architecturalHouse}
            derivedSlabs={derivedSlabs}
          />
        </group>

        <group ref={slabGroupRef} name="slabGroup">
          {showLegacy && showBasement && (
            <>
              <Slab y={basementFloorLevel} shape={groundEnvelopeShape} />
              <mesh position={[0, basementCeilingLevel, 0]} receiveShadow>
                <primitive object={basementCeilingGeometry} attach="geometry" />
                <primitive object={basementCeilingMaterial} attach="material" />
              </mesh>
            </>
          )}
          {showLegacy && showGround && <Slab y={0} shape={groundEnvelopeShape} />}
          {showLegacy && showFirst && <Slab y={firstFloorLevelY} shape={firstEnvelopeShape} />}
          {showLegacy && showAttic && <Slab y={atticLevelY} shape={firstEnvelopeShape} />}
          {showLegacy && showFirst && <Slab y={flatRoofY} shape={flatRoofShape} color="#383E42" />}
          {showLegacy && showFirst && greenRoofShape && (
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

        <Roof visible={showLegacy && showRoof} />

        {DEBUG_WALL_PLANES && (() => {
          const zSamples = [2, 5.5, 8.5, 11.5]; // same z as your side windows
          const height = 3;

          const lines: React.ReactNode[] = [];

          zSamples.forEach((z) => {
            const outwardLeft = createFacadeContext('architecturalLeft').outward as 1 | -1;
            const outwardRight = createFacadeContext('architecturalRight').outward as 1 | -1;

            const xLeftOuter = getOuterWallXAtZ(outwardLeft, z);
            const xRightOuter = getOuterWallXAtZ(outwardRight, z);

            const thickness = 0.3; // your exteriorThickness

            const xLeftInner = xLeftOuter - outwardLeft * thickness;
            const xRightInner = xRightOuter - outwardRight * thickness;

          });

          return lines;
        })()}
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
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
    </>
  );
}
