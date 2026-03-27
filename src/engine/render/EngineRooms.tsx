import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { LevelSpec, RoomSpec } from '../architecturalTypes';

type EngineRoomsProps = {
  rooms: RoomSpec[];
  levels: LevelSpec[];
};

type RoomMeshData = {
  room: RoomSpec;
  geometry: THREE.ExtrudeGeometry;
  y: number;
};

const ROOM_Y_OFFSET = 0.01;

export function EngineRooms({ rooms, levels }: EngineRoomsProps) {
  console.log('ROOMS IN ENGINE:', rooms);
  console.log('EngineRooms:', rooms.length);
  const levelById = useMemo(
    () => new Map(levels.map((level) => [level.id, level])),
    [levels]
  );

  const roomMeshData = useMemo<RoomMeshData[]>(() => {
    return rooms
      .map((room) => {
        if (room.polygon.length < 3) {
          return null;
        }
        const level = levelById.get(room.levelId);
        if (!level) {
          return null;
        }

        const shape = new THREE.Shape(
          room.polygon.map((point) => new THREE.Vector2(point.x, point.z))
        );
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: level.height,
          bevelEnabled: false,
        });
        geometry.rotateX(-Math.PI / 2);

        return {
          room,
          geometry,
          y: level.elevation - level.slab.thickness + ROOM_Y_OFFSET,
        };
      })
      .filter((entry): entry is RoomMeshData => entry !== null);
  }, [rooms, levelById]);

  useEffect(() => {
    return () => {
      roomMeshData.forEach((entry) => entry.geometry.dispose());
    };
  }, [roomMeshData]);

  if (roomMeshData.length === 0) {
    return null;
  }

  return (
    <group userData={{ debugType: 'rooms' }}>
      {roomMeshData.map(({ room, geometry, y }) => (
        <mesh
          key={room.id}
          geometry={geometry}
          position={[0, y, 0]}
          onPointerDown={(event) => {
            event.stopPropagation();
            console.log('ROOM CLICKED:', room.id, room.name);
          }}
          userData={{ type: 'room', roomId: room.id, roomName: room.name }}
        >
          <meshBasicMaterial
            color={0xff0000}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
