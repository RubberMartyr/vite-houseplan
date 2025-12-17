// @ts-nocheck

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { wallsGround } from '../model/wallsGround'

console.log("✅ HOUSEVIEWER.TSX ACTIVE", Date.now())

/**
 * ARCHITECTURAL SPECIFICATIONS
 * Derived from 'UITVOERING (3).pdf'
 */
const SPECS = {
  // Main Volume (Hoofdgebouw)
  footprint: { w: 8.2, d: 12.5 },

  // Heights (Niveaus)
  levels: {
    ground: 2.6, // Gelijkvloers plafondhoogte
    first: 2.5, // Verdieping
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
function createRectShape(w, d) {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hd = d / 2;
  s.moveTo(-hw, -hd);
  s.lineTo(hw, -hd);
  s.lineTo(hw, hd);
  s.lineTo(-hw, hd);
  s.lineTo(-hw, -hd);
  return s;
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

// --- HOUSE COMPONENTS ---

function Walls() {
  const { brick } = useBuildingMaterials();
  const W = SPECS.footprint.w;
  const D = SPECS.footprint.d;
  const H = SPECS.levels.ground + SPECS.levels.slab + SPECS.levels.first; // Total wall height

  // Create hollow shell
  const shape = createRectShape(W, D);
  const hole = createRectShape(W - SPECS.wall.ext * 2, D - SPECS.wall.ext * 2);
  shape.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: H,
    bevelEnabled: false,
  });

  return (
    <mesh
      geometry={geom}
      material={brick}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
    />
  );
}

function Roof() {
  const { roof } = useBuildingMaterials();
  const W = SPECS.footprint.w;
  const D = SPECS.footprint.d;
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
      position={[0, H_WALLS, 0]}
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
  const W = SPECS.footprint.w;
  const D = SPECS.footprint.d;
  const frontZ = -D / 2; // Voorgevel
  const backZ = D / 2; // Achtergevel

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

function FloorSlabs() {
  const W = SPECS.footprint.w - 0.7; // Just inside walls
  const D = SPECS.footprint.d - 0.7;

  return (
    <group>
      {/* Ground Floor (Oak) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#d9c6a2" />
      </mesh>

      {/* First Floor Slab (Concrete/Ceiling) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SPECS.levels.ground, 0]}
      >
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>
    </group>
  );
}

// --- MAIN SCENE ---

export default function HouseViewer() {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#8B5A40',
    roughness: 0.9,
    side: THREE.DoubleSide,
  })

  return (
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
      <group position={[0, 0, 0]}>
        {wallsGround.segments.map((seg, i) => (
          <mesh
            key={i}
            geometry={seg.geometry}
            position={seg.position}
            rotation={seg.rotation}
            material={wallMaterial}
            castShadow
            receiveShadow
          />
        ))}
        <Roof />
        <FloorSlabs />
        {/* <Openings /> */}
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
  );
}
