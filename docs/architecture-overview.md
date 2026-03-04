# Architecture Overview

## 1) Directory tree

### `src/engine`

```text
src/engine
├── EngineHouse.tsx
├── architecturalHouse.ts
├── architecturalTypes.ts
├── buildHouse.ts
├── buildRoof.ts
├── buildWalls.ts
├── buildWallsFromDerivedSegments.ts
├── builders
│   ├── buildFacadePanels.ts
│   └── buildWindowMeshes.ts
├── derive
│   ├── deriveHouse.ts
│   ├── deriveOpenings.ts
│   ├── deriveRoofs.ts
│   ├── deriveSlabs.ts
│   └── deriveWalls.ts
├── deriveFlatRoofs.ts
├── deriveGableRoofs.ts
├── deriveSlabs.ts
├── deriveWallShells.ts
├── deriveWalls.ts
├── derived
│   └── derivedOpenings.ts
├── extrudeWallSegment.ts
├── geom2d
│   └── offsetPolygon.ts
├── geometry
│   ├── buildExtrudedShell.ts
│   ├── buildFrameGeometry.ts
│   ├── buildSill.ts
│   ├── facadeContext.ts
│   ├── wallSurfaceResolver.ts
│   └── windowFactory.ts
├── houseData.ts
├── render
│   ├── EngineFlatRoofs.tsx
│   ├── EngineGableRoofs.tsx
│   ├── EngineRoofs.tsx
│   ├── EngineSlabs.tsx
│   ├── EngineWallShells.tsx
│   └── EngineWalls.tsx
├── roof
│   ├── normalizeMultiPlaneRoof.ts
│   └── planMultiPlaneRoofFixes.ts
├── spaceMapping.ts
├── toThreeWorldMeshes.ts
├── types.ts
└── validation
    ├── validateMultiPlaneRoof.ts
    ├── validateOpenings.ts
    └── validateStructure.ts
```

### `src/model`

```text
src/model
├── constants
│   ├── facadeConstants.ts
│   └── windowConstants.ts
├── envelope.ts
├── houseSpec.ts
├── layoutGround.ts
├── materials
│   ├── brickMaterial.ts
│   └── windowMaterials.ts
├── orientation.ts
├── roof.ts
├── roomsFirst.ts
├── roomsGround.ts
├── runtimeFlags.ts
├── types
│   ├── FacadePlan.ts
│   ├── FacadeWindowPlacement.ts
│   ├── HouseSpec.ts
│   └── OpeningCut.ts
├── utils
│   ├── geometry.ts
│   └── units.ts
└── wallsEavesBand.ts
```

### `src/components`

```text
src/components
├── HouseViewer.tsx
├── ViewerControls.tsx
└── debug
    └── OrientationHelpers.tsx
```

### `src/ui`

```text
src/ui
└── RoofJsonEditorPanel.tsx
```

## 2) Engine pipeline (`deriveHouse`, `deriveWalls`, `deriveSlabs`, `deriveRoofs`, `deriveOpenings`)

### Function map and relationships

1. `deriveHouse(arch)` (`src/engine/derive/deriveHouse.ts`)
   - Stage 0: validates structure with `validateStructure`.
   - Stage 1: calls `deriveSlabs(arch)` then `deriveWalls(arch, slabs)`.
   - Stage 2: calls `deriveOpenings(arch)`.
   - Stage 3: calls `deriveRoofs(arch, walls)`.
   - Returns `{ slabs, walls, roofs, openings }`.

2. `deriveSlabs(house)` (`src/engine/derive/deriveSlabs.ts`)
   - Iterates levels and computes slab `elevationTop`, `elevationBottom`, `footprint`, `inset`.
   - Output feeds into `deriveHouse` and is passed to `deriveWalls` (currently unused by that function via `_slabs` parameter).

3. `deriveWalls(arch, _slabs)` (`src/engine/derive/deriveWalls.ts`)
   - Delegates to `deriveWallSegmentsFromLevels(arch)` in `src/engine/deriveWalls.ts`.
   - `_slabs` is accepted but not currently used.

4. `deriveOpenings(house)` (`src/engine/derive/deriveOpenings.ts`)
   - Builds per-opening geometric placement on footprint edges.
   - Uses internal helpers: `polygonSignedAreaXZ`, `isPointOnSegmentXZ`, `isPointInsidePolygonXZ`, `pickOutwardNormalXZ`, `distPointToSegmentXZ`.
   - Returns `DerivedOpeningRect[]`.

5. `deriveRoofs(arch, _walls)` (`src/engine/derive/deriveRoofs.ts`)
   - Currently passthrough: returns `arch.roofs ?? []`.
   - `_walls` is accepted but not currently used.

### Relationship summary (direct calls)

```text
deriveHouse
├─ validateStructure
├─ deriveSlabs
├─ deriveWalls
│  └─ deriveWallSegmentsFromLevels
├─ deriveOpenings
│  ├─ polygonSignedAreaXZ
│  ├─ isPointOnSegmentXZ
│  ├─ isPointInsidePolygonXZ
│  ├─ pickOutwardNormalXZ
│  └─ distPointToSegmentXZ
└─ deriveRoofs
```

### Call-site inventory requested

- `buildExtrudedShell` is called by:
  - `src/engine/buildWalls.ts`
  - `src/model/wallsEavesBand.ts`

- `deriveWalls` is called by:
  - `src/engine/derive/deriveHouse.ts`

- `deriveHouse` is called by:
  - `src/engine/EngineHouse.tsx`

## 3) Dependency graph (ArchitecturalHouse → derive → geometry → Three.js rendering)

```text
architecturalHouse (data instance)
  from src/engine/architecturalHouse.ts
        │
        ▼
EngineHouse (React component)
  src/engine/EngineHouse.tsx
        │ useMemo
        ▼
deriveHouse(architecturalHouse)
  src/engine/derive/deriveHouse.ts
        ├── deriveSlabs ────────────────┐
        ├── deriveWalls (segments)       │
        ├── deriveOpenings               │
        └── deriveRoofs                  │
                                         │
                                         ▼
                           EngineSlabs uses buildSlabMesh
                           src/engine/render/EngineSlabs.tsx
                           src/view/buildSlabMeshes.ts
                                         │
                                         ▼
                                   Three.js Mesh/Geometry

Parallel wall geometry path used by render:

EngineHouse
  └── EngineWallShells
      └── deriveWallShellsFromLevels
          └── THREE.ExtrudeGeometry
              (wireframe mesh rendering)

Additional geometry builder path in codebase:

buildWallsFromCurrentSystem
  src/engine/buildWalls.ts
      └── buildExtrudedShell
          src/engine/geometry/buildExtrudedShell.ts
              └── THREE.ExtrudeGeometry
```

Notes:
- Roof rendering components currently consume `arch` directly (`EngineFlatRoofs`, `EngineGableRoofs`) rather than `derived.roofs` from `deriveHouse`.
- Wall rendering in `EngineHouse` uses shell derivation (`deriveWallShellsFromLevels`) instead of `deriveWalls` segment output.

## 4) Unused files (heuristic)

Method used: static relative-import graph across `src/**/*.ts(x)`; files in `src/model` and `src/engine` with **zero inbound imports** were flagged.

### `src/model` candidates
- `src/model/constants/facadeConstants.ts`
- `src/model/materials/brickMaterial.ts`
- `src/model/roof.ts`
- `src/model/roomsFirst.ts`
- `src/model/types/FacadePlan.ts`

### `src/engine` candidates
- `src/engine/buildHouse.ts`
- `src/engine/deriveSlabs.ts`
- `src/engine/render/EngineRoofs.tsx`
- `src/engine/render/EngineWalls.tsx`

Caveat:
- This is static/import-based only. It will not detect runtime/dynamic references or external consumers outside `src`.
