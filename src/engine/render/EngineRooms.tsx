import * as THREE from 'three';
import React, { useEffect, useMemo } from 'react';
import type { LevelSpec, RoomSpec } from '../architecturalTypes';
import { buildRoomPrismGeometry } from '../geometry/buildRoomPrismGeometry';

type EngineRoomsProps = {
  rooms: RoomSpec[];
  levels: LevelSpec[];
};

type RoomMeshData = {
  room: RoomSpec;
  geometry: THREE.BufferGeometry;
};

export function EngineRooms({ rooms, levels }: EngineRoomsProps) {
  console.log('EngineRooms:', rooms.length);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  const roomMeshData = useMemo<RoomMeshData[]>(() => {
    return rooms
      .map((room) => {
        if (room.polygon.length < 3) {
          return null;
        }

        const level = levels.find((l) => l.id === room.levelId);
        if (!level) {
          return null;
        }

        const baseY = level.elevation - level.slab.thickness;
        const height = level.height;

        const geometry = buildRoomPrismGeometry({
          polygon: room.polygon,
          baseY,
          height,
        });

        return {
          room,
          geometry,
        };
      })
      .filter((entry): entry is RoomMeshData => entry !== null);
  }, [rooms, levels]);

  useEffect(() => {
    return () => {
      roomMeshData.forEach((entry) => entry.geometry.dispose());
    };
  }, [roomMeshData]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  if (roomMeshData.length === 0) {
    return null;
  }

  return (
    <group userData={{ debugType: 'rooms' }}>
      {roomMeshData.map(({ room, geometry }) => (
        <mesh
          key={room.id}
          geometry={geometry}
          material={material}
          onPointerDown={(e) => {
            e.stopPropagation();
            console.log('ROOM CLICKED:', room.id, room.name);
          }}
          userData={{
            type: 'room',
            roomId: room.id,
            roomName: room.name,
          }}
        />
      ))}
    </group>
  );
}
