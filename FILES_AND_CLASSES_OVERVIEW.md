# FILES_AND_CLASSES_OVERVIEW

High-level map of the current codebase, with key classes/types for faster navigation as the engine grows.

## Directory outline

```text
src/
├── engine/
│   ├── builders/
│   ├── cache/
│   ├── debug/
│   ├── derive/
│   ├── derived/
│   ├── geom2d/
│   ├── geometry/
│   ├── render/
│   ├── roof/
│   └── validation/
├── model/
│   ├── constants/
│   ├── materials/
│   ├── types/
│   └── utils/
├── ui/
├── components/
└── view/
```

## `src/engine/` overview

### Core scene composition and data flow

- `EngineHouse.tsx`: top-level engine renderer component (`Props`) that wires derived/build outputs into render components.
- `buildHouse.ts`: orchestrates house mesh building.
- `architecturalHouse.ts` + `architecturalTypes.ts`: architectural shape/type helpers and re-exports.
- `houseData.ts`: seed/sample house data.

### Derivation layer (`engine/derive/`)

- `deriveHouse.ts`: main derived model pipeline.
- `deriveWalls.ts`: wall derivation context (`DeriveWallsContext`).
- `deriveSlabs.ts`: slab derivation (`DerivedSlab`).
- `deriveRoofs.ts`: roof derivation (`DeriveRoofsContext`).
- `deriveOpenings.ts`: opening derivation (`DeriveOpeningsContext`, `Vec2XZ`).
- `types/DerivedHouse.ts`: central `DerivedHouse` + `DerivedRevisions` aggregate.
- `types/DerivedRoof.ts`: `DerivedRoof` contract.

### Render layer (`engine/render/`)

- `EngineWalls.tsx`: wall mesh renderer (`EngineWallsProps`).
- `EngineSlabs.tsx`: slab mesh renderer (`EngineSlabsProps`).
- `EngineRoofs.tsx`: roof switch/host renderer (`EngineRoofsProps`).
- `EngineFlatRoofs.tsx`: flat roof renderer (`Props`).
- `EngineGableRoofs.tsx`: gable roof renderer (`Props`, `BuildGeometriesOptions`).

### Geometry/build helpers

- `buildWalls.ts`: wall geometry assembly (`WallBuildOutput`).
- `buildWallsFromDerivedSegments.ts`: materializes `BuiltWall` meshes from derived wall segments.
- `buildRoof.ts`: roof segment construction (`RoofSegment` internal type).
- `geometry/buildRoofGeometry.ts`, `geometry/buildFrameGeometry.ts`, `geometry/buildSill.ts`, `geometry/buildExtrudedShell.ts` (`ShellResult`), `geometry/windowFactory.ts` (`WindowFactorySpec`, `WindowFactoryMesh`), `geometry/wallSurfaceResolver.ts`, `geometry/facadeContext.ts`.
- `builders/buildWindowMeshes.ts`: `EngineMesh`, `WindowBuilderConstants`.
- `builders/buildFacadePanels.ts`: facade panel mesh builder (`FacadePanelMesh`).

### Validation/debug/cache

- `validation/validateStructure.ts`: reusable validation framework (`ValidationIssue`, `ValidationReport`, `ValidationError`, `HouseValidationAdapter`).
- `validation/validateOpenings.ts`: opening checks.
- `validation/validateMultiPlaneRoof.ts`: roof validator (`MultiPlaneRoofValidationResult`, `RoofValidationDebug`).
- `debug/EngineDebugHUD.tsx`, `debug/DerivedGraphOverlay.tsx`, `debug/RoofPlaneVisualizer.tsx`, `debug/DebugWireframe.tsx`.
- `cache/geometryCache.ts`: lightweight cache entry wrapper (`CacheEntry<T>`).

### Shared engine contracts (`engine/types.ts`)

This is the densest type hub, including:

- Vector and geometry primitives: `Vec3`, `Vec2`, `XZ`, `PlanePoint`, `HalfPlane`.
- Roof models: `RoofFaceSpec`, `MultiPlaneRoofSpec`, union `RoofSpec`.
- Opening models: `OpeningKind`, `OpeningStyleSpec`, `OpeningEdgeRef`, `OpeningSpec`.
- Building domain models: `SlabSpec`, `LevelSpec`, `WallSpec`, `WallOpeningSpec`, `RoofFrameSpec`, `HouseSpec`, `ArchitecturalHouse`.

## `src/model/` overview

### Domain source of truth

- `types/HouseSpec.ts`: canonical `HouseSpec` interface.
- `houseSpec.ts`: richer house-domain aliases (`EnvelopePoint`, `ArchSide`, `RoomRange`).
- `roof.ts`, `envelope.ts`, `orientation.ts`: envelope/roof/orientation models (`Facade`, etc.).
- `roomsGround.ts`, `roomsFirst.ts`, `layoutGround.ts`: room/zoning data shaping (`RoomVolume`, `RoomSpec`, `ZoneSpec`).

### Utilities and constants

- `utils/geometry.ts`: `Point2D`, `Line2D` helpers.
- `utils/units.ts`: unit conversion helpers.
- `constants/facadeConstants.ts`, `constants/windowConstants.ts`: tuning constants.
- `materials/brickMaterial.ts`, `materials/windowMaterials.ts`: material factories.

### Additional model types

- `types/OpeningCut.ts`: opening cut rectangle/metadata contract.
- `types/FacadeWindowPlacement.ts`: facade opening placement contract.
- `types/FacadePlan.ts`: facade planning shape.

## `src/ui/` overview

- `RoofJsonEditorPanel.tsx`: JSON editing panel for multi-plane roof definitions (`RoofValidationEntry`, component `Props`), coupled with roof validation feedback.

## Useful convention for future updates

When adding or refactoring major modules, update this file by:

1. Keeping the directory outline aligned with `src/`.
2. Listing newly introduced exported `class`/`interface`/`type` names by feature folder.
3. Marking the main "hub" files (type hubs, pipeline entry points, top-level renderers).

A quick refresh command for exported type declarations is:

```bash
rg -n "^(export\\s+)?(class|interface|type|enum)\\s+" src
```
