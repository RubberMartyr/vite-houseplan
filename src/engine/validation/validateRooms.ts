import type { ArchitecturalHouse } from '../architecturalTypes';
import { validateFloorplan } from './validateFloorplan';

export function validateRooms(arch: ArchitecturalHouse): void {
  validateFloorplan(arch);
}
