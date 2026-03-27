import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { DerivedRoom } from '../derive/types/DerivedRoom';
import { archToWorldXZ } from '../spaceMapping';

type EngineRoomsProps = {
  rooms?: DerivedRoom[];
  visible?: boolean;
  yOffset?: number;
};

type RoomMeshData = {
  room: DerivedRoom;
  geometry: THREE.ShapeGeometry;
  y: number;
  color: string;
};

function roomColor(index: number): string {
  const hue = (index * 67) % 360;
  return `hsl(${hue} 70% 55%)`;
}

export function EngineRooms({ rooms = [], visible = true, yOffset = 0.01 }: EngineRoomsProps) {
  console.log('ROOMS IN ENGINE:', rooms);

  const roomMeshData = useMemo<RoomMeshData[]>(() => {
    return rooms
      .map((room, index) => {
        if (room.polygon.length < 3) {
          return null;
        }

        const worldPolygon = room.polygon.map(archToWorldXZ);
        const shape = new THREE.Shape(
          worldPolygon.map((point) => new THREE.Vector2(point.x, point.z))
        );
        const geometry = new THREE.ShapeGeometry(shape);

        return {
          room,
          geometry,
          y: room.elevation + yOffset,
          color: roomColor(index),
        };
      })
      .filter((entry): entry is RoomMeshData => entry !== null);
  }, [rooms, yOffset]);

  useEffect(() => {
    return () => {
      roomMeshData.forEach((entry) => entry.geometry.dispose());
    };
  }, [roomMeshData]);

  if (!visible || roomMeshData.length === 0) {
    return null;
  }

  return (
    <group userData={{ debugType: 'rooms' }}>
      {roomMeshData.map(({ room, geometry, y, color }) => (
        <mesh
          key={room.id}
          geometry={geometry}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, y, 0]}
          onClick={() => {
            console.log('[EngineRooms] clicked room', { id: room.id, name: room.name });
          }}
          userData={{ roomId: room.id, roomName: room.name }}
        >
          <meshStandardMaterial color={color} transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
