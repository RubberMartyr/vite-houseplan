import * as THREE from 'three';
import React, { useEffect, useMemo } from 'react';
import type { LevelSpec, RoomSpec } from '../architecturalTypes';
import { buildRoomPrismGeometry } from '../geometry/buildRoomPrismGeometry';
import { getStructuralWallHeight } from '../derive/getStructuralWallHeight';

type EngineRoomsProps = {
  rooms: RoomSpec[];
  levels: LevelSpec[];
  selectedRoomId?: string | null;
  hoveredRoomId?: string | null;
  onRoomSelect?: (room: RoomSpec) => void;
  onRoomHover?: (roomId: string | null) => void;
};

type RoomMeshData = {
  room: RoomSpec;
  geometry: THREE.BufferGeometry;
  outlineGeometry: THREE.EdgesGeometry;
};

const BASE_FILL_COLOR = new THREE.Color('#5bbcff');
const HOVER_FILL_COLOR = new THREE.Color('#7fccff');
const SELECTED_FILL_COLOR = new THREE.Color('#9ad9ff');

export function EngineRooms({
  rooms,
  levels,
  selectedRoomId,
  hoveredRoomId,
  onRoomSelect,
  onRoomHover,
}: EngineRoomsProps) {
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

        const baseY = level.elevation;
        const levelIndex = levels.findIndex((l) => l.id === level.id);
        if (levelIndex < 0) {
          return null;
        }

        const height = getStructuralWallHeight(levels, levelIndex);

        const geometry = buildRoomPrismGeometry({
          polygon: room.polygon,
          baseY,
          height,
        });

        const positionAttribute = geometry.getAttribute('position');
        if (!positionAttribute || positionAttribute.count === 0) {
          geometry.dispose();
          return null;
        }

        const outlineGeometry = new THREE.EdgesGeometry(geometry, 1);

        return {
          room,
          geometry,
          outlineGeometry,
        };
      })
      .filter((entry): entry is RoomMeshData => entry !== null);
  }, [rooms, levels]);

  useEffect(() => {
    return () => {
      roomMeshData.forEach((entry) => {
        entry.geometry.dispose();
        entry.outlineGeometry.dispose();
      });
    };
  }, [roomMeshData]);

  if (roomMeshData.length === 0) {
    return null;
  }

  return (
    <group userData={{ debugType: 'rooms' }}>
      {roomMeshData.map(({ room, geometry, outlineGeometry }) => {
        const isSelected = room.id === selectedRoomId;
        const isHovered = room.id === hoveredRoomId;
        const fillColor = isSelected ? SELECTED_FILL_COLOR : isHovered ? HOVER_FILL_COLOR : BASE_FILL_COLOR;
        const opacity = isSelected ? 0.28 : isHovered ? 0.24 : 0.2;
        const emissiveIntensity = isSelected ? 0.34 : isHovered ? 0.24 : 0.16;
        const outlineColor = isSelected ? '#d9f2ff' : isHovered ? '#b8ecff' : '#79c8ff';
        const outlineOpacity = isSelected ? 0.95 : isHovered ? 0.85 : 0.62;
        const outlineWidth = isSelected ? 1.6 : 1.2;

        return (
          <group key={room.id}>
            <mesh
              geometry={geometry}
              onPointerEnter={(event) => {
                event.stopPropagation();
                document.body.style.cursor = 'pointer';
                onRoomHover?.(room.id);
              }}
              onPointerLeave={(event) => {
                event.stopPropagation();
                document.body.style.cursor = 'default';
                onRoomHover?.(null);
              }}
              onClick={(event) => {
                event.stopPropagation();
                onRoomSelect?.(room);
              }}
              userData={{
                type: 'room',
                roomId: room.id,
                roomName: room.name,
              }}
            >
              <meshStandardMaterial
                color={fillColor}
                emissive="#4da6ff"
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={opacity}
                depthWrite={false}
                roughness={0.25}
                metalness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
            <lineSegments geometry={outlineGeometry} renderOrder={2}>
              <lineBasicMaterial
                color={outlineColor}
                transparent
                opacity={outlineOpacity}
                depthWrite={false}
                linewidth={outlineWidth}
              />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}
