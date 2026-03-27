# `src/model/builders/` usage report

Scope analyzed: `src/model/builders/`

Method used:
- Collected all TypeScript/TSX import/export edges in `src/**`.
- Computed inbound references for each builder file.
- Classified each file as:
  - `USED_BY_ENGINE`: referenced directly by `src/engine/**` (or required transitively by such files).
  - `USED_BY_UI`: referenced by `src/ui/**`, `src/components/**`, or `src/view/**`.
  - `UNUSED_LEGACY`: no active engine/UI usage path found.

## Results

| File | Inbound references in repo | Engine pipeline usage | Status |
|---|---|---|---|
| `buildExtrudedShell.ts` | `src/engine/buildWalls.ts`, `src/model/wallsEavesBand.ts` | Directly imported by engine wall builder | `USED_BY_ENGINE` |
| `buildFacadeAssembly.ts` | _(none)_ | Not referenced by engine | `UNUSED_LEGACY` |
| `buildFacadePlan.ts` | `src/model/builders/buildFacadeAssembly.ts` | Only referenced from an unused builder | `UNUSED_LEGACY` |
| `buildFacadeWindowPlacements.ts` | `src/model/builders/buildFacadePlan.ts` | Only referenced from unused facade planning chain | `UNUSED_LEGACY` |
| `facadePanel.ts` | _(none)_ | Not referenced by engine/UI | `UNUSED_LEGACY` |
| `buildRingGeometry.ts` | _(none)_ | Not referenced by engine/UI | `UNUSED_LEGACY` |
| `windowFactory.ts` | `src/engine/buildWalls.ts`, `src/model/builders/buildFacadeAssembly.ts`, `src/model/builders/buildFacadePlan.ts`, `src/model/builders/buildFacadeWindowPlacements.ts`, `src/model/builders/buildSideWindows.ts`, `src/model/builders/facadePanel.ts`, `src/model/types/FacadeWindowPlacement.ts` | Directly imported by engine wall builder (`ARCH_RIGHT_FACADE_SEGMENTS`, `RIGHT_WORLD_FACADE_SEGMENTS`) | `USED_BY_ENGINE` |
| `facadeGeometry.ts` | `src/model/builders/buildFacadeWindowPlacements.ts` | Only used by unused facade planning chain | `UNUSED_LEGACY` |
| `facadeContext.ts` | `src/engine/buildWalls.ts`, `src/model/builders/buildFacadeAssembly.ts`, `src/model/builders/buildFacadePlan.ts`, `src/model/builders/buildFacadeWindowPlacements.ts`, `src/model/builders/buildSideWindows.ts`, `src/model/builders/facadeGeometry.ts`, `src/model/builders/facadePanel.ts`, `src/model/types/FacadePlan.ts` | Directly imported by engine wall builder (`createFacadeContext`) | `USED_BY_ENGINE` |
| `sideFacade.ts` | _(none)_ | Not referenced by engine/UI | `UNUSED_LEGACY` |
| `buildSill.ts` | `src/model/builders/windowFactory.ts` | Used transitively via `windowFactory.ts` (engine imports `windowFactory.ts`) | `USED_BY_ENGINE` |
| `buildFrameGeometry.ts` | `src/model/builders/windowFactory.ts` | Used transitively via `windowFactory.ts` (engine imports `windowFactory.ts`) | `USED_BY_ENGINE` |
| `buildWallOpenings.ts` | `src/model/builders/buildFacadePlan.ts` | Only used by unused facade planning chain | `UNUSED_LEGACY` |
| `wallSurfaceResolver.ts` | `src/engine/buildWalls.ts`, `src/model/builders/buildSideWindows.ts`, `src/model/builders/facadeGeometry.ts` | Directly imported by engine wall builder (`getWallPlanesAtZ`) | `USED_BY_ENGINE` |
| `layoutFloor.ts` | `src/model/layoutGround.ts` | No engine/UI references found | `UNUSED_LEGACY` |
| `buildFloorRooms.ts` | `src/model/roomsGround.ts`, `src/model/roomsFirst.ts` | No engine/UI references found | `UNUSED_LEGACY` |
| `buildSideWindows.ts` | _(none)_ | Not referenced by engine/UI | `UNUSED_LEGACY` |

## Summary counts

- `USED_BY_ENGINE`: 6
- `USED_BY_UI`: 0
- `UNUSED_LEGACY`: 11

No files were deleted in this step.
