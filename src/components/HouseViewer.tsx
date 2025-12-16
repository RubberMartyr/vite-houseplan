import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { DoubleSide, Material } from 'three';
import layoutGround from '../model/layoutGround';
import { ceilingHeights, footprint, wallThickness } from '../model/houseSpec';
import wallsGround from '../model/wallsGround';

const cameraPosition: [number, number, number] = [2, 1.6, 5];
const lookAtTarget: [number, number, number] = [
  layoutGround.footprint.width / 2,
  1.3,
  layoutGround.footprint.depth / 2,
];

const floorColor = '#dcd7cf';
const wallColor = '#f0ede8';

const Floor = () => {
  const { width, depth } = layoutGround.footprint;

  return (
    <mesh
      position={[width / 2, 0, depth / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={floorColor} />
    </mesh>
  );
};

const ExteriorWalls = () => (
  <>
    {wallsGround.walls.map((mesh, index) => {
      const material: Material = Array.isArray(mesh.material)
        ? mesh.material[0]
        : mesh.material;
      material.side = DoubleSide;
      material.wireframe = true;

      return (
        <mesh
          key={`exterior-wall-${index}`}
          geometry={mesh.geometry}
          material={material}
          position={[mesh.position.x, mesh.position.y, mesh.position.z]}
          rotation={[mesh.rotation.x, mesh.rotation.y, mesh.rotation.z]}
          castShadow
          receiveShadow
        />
      );
    })}
  </>
);

const InteriorWalls = () => {
  const { interior, zones, rooms } = layoutGround;
  const height = ceilingHeights.ground;
  const thickness = wallThickness.interior;

  const walls = useMemo(() => {
    const livingWidth = zones.living.xMax - zones.living.xMin;
    const serviceWidth = zones.service.xMax - zones.service.xMin;

    const livingCenter = zones.living.xMin + livingWidth / 2;
    const serviceCenter = zones.service.xMin + serviceWidth / 2;

    const wallSegments: { position: [number, number, number]; size: [number, number, number] }[] = [];

    // Divider between living and service zones.
    wallSegments.push({
      position: [zones.living.xMax, height / 2, (interior.zMin + interior.zMax) / 2],
      size: [thickness, height, interior.depth],
    });

    const livingBoundaries = [rooms.zithoek.zMax, rooms.keuken.zMax];
    livingBoundaries.forEach((boundary) => {
      wallSegments.push({
        position: [livingCenter, height / 2, boundary],
        size: [livingWidth, height, thickness],
      });
    });

    const serviceBoundaries = [rooms.hall.zMax, rooms.stair.zMax];
    serviceBoundaries.forEach((boundary) => {
      wallSegments.push({
        position: [serviceCenter, height / 2, boundary],
        size: [serviceWidth, height, thickness],
      });
    });

    return wallSegments;
  }, [height, thickness]);

  return (
    <>
      {walls.map((wall, index) => (
        <mesh key={`interior-wall-${index}`} position={wall.position} castShadow receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={wallColor} side={DoubleSide} wireframe />
        </mesh>
      ))}
    </>
  );
};

const Lights = () => (
  <>
    <ambientLight args={[0xffffff, 0.7]} />
    <directionalLight args={[0xffffff, 0.6]} position={[6, 10, 6]} />
  </>
);

const PortalPlanes = () => {
  const frontZ = -footprint.depth / 2 - 0.5;
  const rearZ = footprint.depth / 2 + 0.5;

  return (
    <>
      <mesh position={[0, 2.0, frontZ]} rotation={[0, 0, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshBasicMaterial color="#ff00ff" side={DoubleSide} />
      </mesh>
      <mesh position={[0, 2.0, rearZ]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshBasicMaterial color="#ff00ff" side={DoubleSide} />
      </mesh>
    </>
  );
};

const HouseViewer = () => {
  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 100 }}
      style={{ width: '100vw', height: '100vh' }}
      shadows
      onCreated={({ camera }) => {
        camera.lookAt(...lookAtTarget);
      }}
    >
      <color attach="background" args={['#8fd3ff']} />
      <Lights />
      <Floor />
      <PortalPlanes />
      <InteriorWalls />
      <ExteriorWalls />
    </Canvas>
  );
};

export default HouseViewer;
