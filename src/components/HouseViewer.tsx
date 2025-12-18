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

// --- HOUSE COMPONENTS ---

function Walls() {
  const { brick } = useBuildingMaterials();
  return null;
}

function Roof() {
  const { roof } = useBuildingMaterials();
  const { meshes, ridgeLines } = useMemo(() => buildRoofMeshes(), []);
  const ridgeMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#ff44aa', linewidth: 2 }),
    []
  );

  return (
    <group>
      {meshes.map((mesh, index) => (
        <mesh
          key={`roof-plane-${index}`}
          geometry={mesh.geometry}
          material={roof}
          position={mesh.position}
          rotation={mesh.rotation}
          castShadow
          receiveShadow
        />
      ))}
      {ridgeLines.map((line, index) => (
        <line
          key={`ridge-${index}`}
          geometry={line.geometry}
          position={line.position}
          material={ridgeMaterial}
        />
      ))}
    </group>
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
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

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

      {highlighted && (
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#4fa3f7" linewidth={1} />
        </lineSegments>
      )}
    </group>
  );
}

// --- MAIN SCENE ---

export default function HouseViewer() {
  const [floorView, setFloorView] = useState('All');
  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8B5A40',
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    []
  );

  const slabGroupRef = useRef<THREE.Group>(null);
  const wallGroupRef = useRef<THREE.Group>(null);

  const showGround = floorView === 'GF' || floorView === 'All';
  const showFirst = floorView === 'FF' || floorView === 'All';
  const showAttic = floorView === 'Attic' || floorView === 'All';
  const firstFloorLevelY = levelHeights.firstFloor;
  const firstFloorCeilingHeight = ceilingHeights.first;
  const atticLevelY = firstFloorLevelY + firstFloorCeilingHeight; // 2.60 + 2.50 = 5.10
  const [cutawayEnabled, setCutawayEnabled] = useState(false);
  const [facadeVisibility, setFacadeVisibility] = useState<Record<FacadeKey, boolean>>({
    front: true,
    rear: true,
    left: true,
    right: true,
  });
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const wallShellVisible = !cutawayEnabled || Object.values(facadeVisibility).every(Boolean);

  const groundOuterEnvelope = useMemo(() => getEnvelopeOuterPolygon(), []);
  const groundEnvelopePolygon = useMemo(
    () => getEnvelopeInnerPolygon(wallThickness.exterior, groundOuterEnvelope),
    [groundOuterEnvelope]
  );
  const groundEnvelopeShape = useMemo(() => makeFootprintShape(groundEnvelopePolygon), [groundEnvelopePolygon]);

  const firstOuterEnvelope = useMemo(() => getEnvelopeFirstOuterPolygon(), []);
  const firstEnvelopePolygon = useMemo(
    () => getEnvelopeInnerPolygon(wallThickness.exterior, firstOuterEnvelope),
    [firstOuterEnvelope]
  );
  const firstEnvelopeShape = useMemo(() => makeFootprintShape(firstEnvelopePolygon), [firstEnvelopePolygon]);

  const flatRoofPolygon = useMemo(() => getFlatRoofPolygon(), []);
  const flatRoofShape = useMemo(() => makeFootprintShape(flatRoofPolygon), [flatRoofPolygon]);

  const envelopeDebugLine = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = groundEnvelopePolygon.map((point) => new THREE.Vector3(point.x, 0.02, point.z));
    geometry.setFromPoints(points);
    return geometry;
  }, [groundEnvelopePolygon]);
  const allRooms = useMemo(() => [...roomsGround, ...roomsFirst], []);
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
          {['GF', 'FF', 'Attic', 'All'].map((label) => {
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
        <group position={[originOffset.x, 0, originOffset.z]}>
          <group ref={wallGroupRef} name="wallGroup">
            <axesHelper args={[0.3]} />
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
          </group>

          <group ref={slabGroupRef} name="slabGroup">
            <axesHelper args={[0.3]} />
            {showGround && <Slab y={0} shape={groundEnvelopeShape} />}
            {showFirst && <Slab y={firstFloorLevelY} shape={firstEnvelopeShape} />}
            {showAttic && <Slab y={atticLevelY} shape={firstEnvelopeShape} />}
            {showFirst && <Slab y={firstFloorLevelY + 0.02} shape={flatRoofShape} color="#c7c7c7" />}
            <lineLoop geometry={envelopeDebugLine}>
              <lineBasicMaterial color="#ff00ff" linewidth={2} />
            </lineLoop>
          </group>

          <group name="roomHitboxes">
            {activeRooms.map((room) => (
              <RoomHitbox
                key={room.id}
                room={room}
                highlighted={selectedRoomId === room.id}
                onSelect={setSelectedRoomId}
              />
            ))}
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
