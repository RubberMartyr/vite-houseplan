import type { LevelSpec, RoomSpec } from '../architecturalTypes';
type EngineRoomsProps = {
    rooms: RoomSpec[];
    levels: LevelSpec[];
    selectedRoomId?: string | null;
    hoveredRoomId?: string | null;
    onRoomSelect?: (room: RoomSpec) => void;
    onRoomHover?: (roomId: string | null) => void;
};
export declare const EngineRooms: import("react").NamedExoticComponent<EngineRoomsProps>;
export {};
