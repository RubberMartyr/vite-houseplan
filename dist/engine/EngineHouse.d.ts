import type { ArchitecturalHouse, RoomSpec, SiteSpec } from './architecturalTypes';
type Props = {
    house: ArchitecturalHouse;
    site?: SiteSpec;
    showWalls?: boolean;
    showRoof?: boolean;
    showSlabs?: boolean;
    showGlass?: boolean;
    showRooms?: boolean;
    showDebug?: boolean;
    selectedRoomId?: string | null;
    hoveredRoomId?: string | null;
    onRoomSelect?: (room: RoomSpec) => void;
    onRoomHover?: (roomId: string | null) => void;
};
export declare function EngineHouse({ house, site, showWalls, showRoof, showSlabs, showGlass, showRooms, showDebug, selectedRoomId, hoveredRoomId, onRoomSelect, onRoomHover, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
