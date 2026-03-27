import type { ArchitecturalHouse } from '../architecturalTypes';
import { validateFloorplan } from './validateFloorplan';

export function validateRooms(arch: ArchitecturalHouse): void {
  const result = validateFloorplan(arch);
  if (!result.ok) {
    const firstError = result.issues.find((issue) => issue.severity === 'error');
    throw new Error(firstError?.message ?? 'Room validation failed.');
  }
}
