// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { wallsGround } from '../model/wallsGround'
import { wallsFirst } from '../model/wallsFirst'
import {
  frontZ,
  rearZ,
  leftX,
  rightX,
  ceilingHeights,
  levelHeights,
  wallThickness,
} from '../model/houseSpec'
import { getEnvelopeOuterPolygon, originOffset } from '../model/envelope'
import { roomsGround } from '../model/roomsGround'

console.log("✅ HOUSEVIEWER.TSX ACTIVE", Date.now())

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

// Advanced Hipped Roof (Schilddak) Generator
function createSchilddakGeom(width, depth, height, overhang) {
  const w = width + overhang * 2;
  const d = depth + overhang * 2;
  const hw = w / 2;
  const hd = d / 2;

  // Calculate Ridge Length (Noklengte)
  const ridgeLen = Math.max(0, depth - width);

  const vertices = [
    // Base Corners (Eaves)
    -hw,
    0,
    -hd, // 0: FL
    hw,
    0,
    -hd, // 1: FR
    hw,
    0,
    hd, // 2: BR
    -hw,
    0,
    hd, // 3: BL

    // Ridge Points (Nok)
    -0,
    height,
    -ridgeLen / 2, // 4: Front Ridge Start
    -0,
    height,
    ridgeLen / 2, // 5: Back Ridge End
  ];

  const indices = [
    0,
    4,
    1, // Front slope (Schild)
    1,
    4,
    5,
    1,
    5,
    2, // Right slope (Dakvlak)
    2,
    5,
    3, // Back slope (Schild)
    3,
    5,
    4,
    3,
    4,
    0, // Left slope (Dakvlak)
    // Bottom Cap (Soffit)
    3,
    0,
    1,
    3,
    1,
    2,
  ];

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
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
    });
  }, []);

  // 3. Glass (Ramen)
  const glass = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#aaddff',
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9, // See-through
      transparent: true,
      thickness: 0.02,
    });
  }, []);

  // 4. Frames (Schrijnwerk) - Dark Grey/Black (PVC/Alu)
  const frame = useMemo(() => {
    return new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5 });
  }, []);

  return { brick, roof, glass, frame };
}

type FacadeKey = 'front' | 'rear' | 'left' | 'right';

function groupByFacade(segments) {
  const facadeCenters: Record<FacadeKey, number> = {
    front: frontZ + wallThickness.exterior / 2 + originOffset.z,
    rear: rearZ - wallThickness.exterior / 2 + originOffset.z,
    left: leftX + wallThickness.exterior / 2 + originOffset.x,
    right: rightX - wallThickness.exterior / 2 + originOffset.x,
  };

  const buckets: Record<FacadeKey, typeof segments> = {
    front: [],
    rear: [],
    left: [],
    right: [],
  };

  const tolerance = 0.25;

  segments.forEach((segment) => {
    const [x, , z] = segment.position;

    if (Math.abs(z - facadeCenters.front) <= tolerance) {
      buckets.front.push(segment);
    } else if (Math.abs(z - facadeCenters.rear) <= tolerance) {
      buckets.rear.push(segment);
    } else if (Math.abs(x - facadeCenters.left) <= tolerance) {
      buckets.left.push(segment);
    } else {
      buckets.right.push(segment);
    }
  });

  return buckets;
}

// --- HOUSE COMPONENTS ---

function Walls() {
  const { brick } = useBuildingMaterials();
  return null;
}

function Roof() {
  const { roof } = useBuildingMaterials();
  const envelopeOutline = useMemo(() => getEnvelopeOuterPolygon(), []);
  const [minX, maxX, minZ, maxZ] = useMemo(() => {
    return envelopeOutline.reduce(
      (acc, point) => {
        return [
          Math.min(acc[0], point.x),
          Math.max(acc[1], point.x),
          Math.min(acc[2], point.z),
          Math.max(acc[3], point.z),
        ];
      },
      [Infinity, -Infinity, Infinity, -Infinity]
    );
  }, []);
  const W = maxX - minX;
  const D = maxZ - minZ;
  const center = useMemo(() => [(minX + maxX) / 2, (minZ + maxZ) / 2], [minX, maxX, minZ, maxZ]);
  const H_WALLS = SPECS.levels.ground + SPECS.levels.slab + SPECS.levels.first;

  // Create Hipped Roof
  const geom = useMemo(
    () => createSchilddakGeom(W, D, SPECS.levels.attic, SPECS.roof.overhang),
    [W, D]
  );

  return (
    <mesh
      geometry={geom}
      material={roof}
      position={[center[0] + originOffset.x, H_WALLS, center[1] + originOffset.z]}
      castShadow
    />
  );
}

function Window({ w, h, x, y, z, rot = 0, type = 'standard' }) {
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

function Slab({ y, thickness = SPECS.levels.slab, color = '#d9c6a2', shape, offset }: any) {
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
      position={[offset?.x ?? 0, y, offset?.z ?? 0]}
      receiveShadow
      castShadow
    >
      <primitive object={geom} attach="geometry" />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function WallSegmentWithEdges({
  geometry,
  position,
  rotation,
  wallMaterial,
  edgeMaterial,
}: {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  wallMaterial: THREE.Material;
  edgeMaterial: THREE.LineBasicMaterial;
}) {
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={wallMaterial} castShadow receiveShadow />
      <lineSegments geometry={edgesGeometry}>
        <primitive object={edgeMaterial} attach="material" />
      </lineSegments>
    </group>
  );
}

// --- MAIN SCENE ---

export default function HouseViewer() {
  const [floorView, setFloorView] = useState('Both');
  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8B5A40',
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    []
  );
  const wallEdgeMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#00ffff', linewidth: 2 }),
    []
  );

  const slabGroupRef = useRef<THREE.Group>(null);
  const wallGroupRef = useRef<THREE.Group>(null);

  const showGround = floorView !== '1F';
  const showFirst = floorView !== 'GF';
  const firstFloorY = levelHeights.firstFloor;
  const [cutawayEnabled, setCutawayEnabled] = useState(false);
  const [facadeVisibility, setFacadeVisibility] = useState<Record<FacadeKey, boolean>>({
    front: true,
    rear: true,
    left: true,
    right: true,
  });
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  const groundFacades = useMemo(() => groupByFacade(wallsGround.segments), []);
  const firstFacades = useMemo(() => groupByFacade(wallsFirst.segments), []);
  const envelopePolygon = useMemo(() => getEnvelopeOuterPolygon(), []);
  const envelopeShape = useMemo(() => makeFootprintShape(envelopePolygon), [envelopePolygon]);
  const envelopeDebugLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = envelopePolygon.map(
      (point) => new THREE.Vector3(point.x + originOffset.x, 0.02, point.z + originOffset.z)
    );
    geometry.setFromPoints(points);
    return geometry;
  }, [envelopePolygon]);
  const selectedRoom = useMemo(
    () => roomsGround.find((room) => room.id === selectedRoomId) || null,
    [selectedRoomId]
  );

  const buttonStyle = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #222',
    background: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
    fontWeight: 700,
  };

  useEffect(() => {
    console.log('Slab polygon points (first 5):', envelopePolygon.slice(0, 5));
    console.log('Wall polygon points (first 5 - same as slab):', envelopePolygon.slice(0, 5));
    console.log('slabGroup position:', slabGroupRef.current?.position.toArray());
    console.log('wallGroup position:', wallGroupRef.current?.position.toArray());
  }, [envelopePolygon]);

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

        <span style={{ fontWeight: 800, letterSpacing: 0.5, marginTop: 4 }}>Floor View</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['GF', '1F', 'Both'].map((label) => {
            const isActive = floorView === label;
            return (
              <button
                key={label}
                style={{
                  ...buttonStyle,
                  background: isActive ? '#8B5A40' : buttonStyle.background,
                  color: isActive ? '#fff' : '#111',
                }}
                onClick={() => setFloorView(label)}
              >
                {label}
              </button>
            );
          })}
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
        camera={{ position: [10, 5, 15], fov: 50 }}
        gl={{ antialias: true }}
      >
        {/* Environment - Fixed CORS issue by using Sky instead of external HDRI */}
        <Sky sunPosition={[100, 20, 100]} turbidity={2} rayleigh={0.5} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
        </directionalLight>

        {/* HOUSE ASSEMBLY */}
        <group>
          <group ref={wallGroupRef} name="wallGroup">
            <axesHelper args={[0.3]} />
            {(['front', 'rear', 'left', 'right'] as FacadeKey[]).map((facadeKey) => {
              const showFacade = !cutawayEnabled || facadeVisibility[facadeKey];

              return (
                <group key={facadeKey} name={`facade-${facadeKey}`} visible={showFacade}>
                  {showGround && (
                    <group>
                      {groundFacades[facadeKey].map((seg, i) => (
                        <WallSegmentWithEdges
                          key={`gf-${facadeKey}-${i}`}
                          geometry={seg.geometry}
                          position={seg.position}
                          rotation={seg.rotation}
                          wallMaterial={wallMaterial}
                          edgeMaterial={wallEdgeMaterial}
                        />
                      ))}
                    </group>
                  )}

                  {showFirst && (
                    <group>
                      {firstFacades[facadeKey].map((seg, i) => (
                        <WallSegmentWithEdges
                          key={`1f-${facadeKey}-${i}`}
                          geometry={seg.geometry}
                          position={[seg.position[0], seg.position[1] + firstFloorY, seg.position[2]]}
                          rotation={seg.rotation}
                          wallMaterial={wallMaterial}
                          edgeMaterial={wallEdgeMaterial}
                        />
                      ))}
                    </group>
                  )}
                </group>
              );
            })}
          </group>

          <group ref={slabGroupRef} name="slabGroup">
            <axesHelper args={[0.3]} />
            {showGround && <Slab y={0} shape={envelopeShape} offset={originOffset} />}
            {showFirst && <Slab y={firstFloorY} shape={envelopeShape} offset={originOffset} />}
            <lineLoop geometry={envelopeDebugLine}>
              <lineBasicMaterial color="#ff00ff" linewidth={2} />
            </lineLoop>
          </group>

          <Roof />
        </group>

        {/* GROUNDS */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.05, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#3a5f0b" roughness={1} />
        </mesh>

        {/* CONTROLS */}
        <OrbitControls
          minDistance={5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going under ground
        />

      </Canvas>
    </div>
  );
}
