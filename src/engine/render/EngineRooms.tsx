import * as THREE from 'three';
import React, { useEffect, useMemo } from 'react';
import type { LevelSpec, RoomSpec } from '../architecturalTypes';
import { archToWorldXZ } from '../spaceMapping';

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

        const worldPts = room.polygon.map((p) => archToWorldXZ(p));

        const shape = new THREE.Shape(
          worldPts.map((p) => new THREE.Vector2(p.x, p.z))
        );

        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: level.height,
          bevelEnabled: false,
        });

        geometry.rotateX(-Math.PI / 2);

        const baseY = level.elevation - level.slab.thickness;

        return {
          room,
          geometry,
          y: baseY + ROOM_Y_OFFSET,
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
      {roomMeshData.map(({ room, geometry, y }) => (
        <mesh
          key={room.id}
          geometry={geometry}
          material={material}
          position={[0, y, 0]}
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
