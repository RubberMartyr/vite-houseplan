# Engine Architecture

This document describes the runtime architecture of the house engine, from source data (`ArchitecturalHouse`) through derivation (`DerivedHouse`) to Three.js rendering.

## 1) Directory overview

### Top-level structure (engine-relevant)

- `src/engine/` — core architecture/derivation/render pipeline.
  - `derive/` — staged derivation (`deriveHouse`, slabs/walls/openings/roofs).
  - `derive/types/` — derived domain contracts (`DerivedHouse`, `DerivedRoof`).
  - `render/` — React Three Fiber render adapters (`EngineWalls`, `EngineSlabs`, `EngineRoofs`).
  - `geometry/` — reusable geometric builders (extrusions, roof geometry, frames, etc.).
  - `debug/` — debug overlays and visual tools.
  - `validation/` — structural/opening/roof validators.
  - `roof/` — multi-plane roof normalization/planning helpers.
- `src/view/` — rendering helpers + overlays used by engine/view layer (`buildSlabMeshes`, `RoofValidationOverlay`).
- `src/model/` — upstream model constants/types/material/runtime flags used by engine pieces.
- `docs/` — architecture and developer docs.

### Key entry points

- App-level engine entry: `src/engine/EngineHouse.tsx`
- Derivation orchestrator: `src/engine/derive/deriveHouse.ts`
- Architectural source schema: `src/engine/types.ts` (re-exported by `architecturalTypes.ts`)

---

## 2) Core engine pipeline

The current runtime pipeline is orchestrated in `deriveHouse` and consumed in `EngineHouse`.

## Stage 0 — validation

`deriveHouse` validates the incoming architectural payload using `validateStructure` before any geometry derivation.

## Stage 1 — structural primitives

- `deriveSlabs(arch)` generates slab elevations/footprints/insets.
- `deriveWalls(arch, { slabs })` derives wall segments from level footprint edges.

## Stage 2 — openings

- `deriveOpenings(arch, { slabs, walls })` resolves opening extents (`u/v` ranges), center point, tangent, and outward normal against level footprint edges.

## Stage 3 — roofs

- `deriveRoofs(arch, { slabs, walls, openings })` maps roof specs to derived roofs, resolves base level metadata, ensures closed polygons, and applies overhang through polygon offset.

## Stage 4 — revision stamps

`deriveHouse` increments per-domain revision counters (`slabs/walls/openings/roofs`) and returns `DerivedHouse` including revision metadata for render caching.

---

## 3) Key classes and types

## Source architectural types

Defined in `src/engine/types.ts`:

- `ArchitecturalHouse`
  - `wallThickness`
  - `levels: LevelSpec[]`
  - optional `roofs: RoofSpec[]`
  - optional `openings: OpeningSpec[]`
- `LevelSpec` — level id, elevation, height, footprint, slab.
- `Footprint` — `outer` polygon + optional hole polygons in X/Z space.
- `RoofSpec` — discriminated union: `flat`, `gable`, `multi-ridge`, `multi-plane`.
- `OpeningSpec` — edge-referenced opening placement and style.

## Derived types

- `DerivedHouse` (`derive/types/DerivedHouse.ts`)
  - `slabs: DerivedSlab[]`
  - `walls: DerivedWallSegment[]`
  - `roofs: DerivedRoof[]`
  - `openings: DerivedOpeningRect[]`
  - `revisions` object used by render caches.
- `DerivedWallSegment` (`deriveWalls.ts`)
  - start/end points, height, thickness, outwardSign.
- `DerivedSlab` (`derive/deriveSlabs.ts`)
  - top/bottom elevations, footprint, inset, level index.
- `DerivedOpeningRect` (`derived/derivedOpenings.ts`)
  - opening UV extents along wall edge, center/tangent/outward vectors.
- `DerivedRoof` (`derive/types/DerivedRoof.ts`)
  - roof identity, base-level metadata, footprint/roof polygons, source spec.

---

## 4) Data flow (ArchitecturalHouse → DerivedHouse → Render)

```text
ArchitecturalHouse (input data)
  └─ EngineHouse.tsx
      └─ useMemo(deriveHouse)
          ├─ validateStructure
          ├─ deriveSlabs
          ├─ deriveWalls
          ├─ deriveOpenings
          └─ deriveRoofs
             => DerivedHouse { slabs, walls, openings, roofs, revisions }

DerivedHouse
  ├─ EngineWalls(walls, wallRevision)
  │   └─ geometry cache keyed by wallRevision
  │       └─ buildWallsFromDerivedSegments
  │           └─ extrudeWallSegment
  │               └─ THREE.BufferGeometry
  ├─ EngineSlabs(slabs)
  │   └─ buildSlabMesh(...) per slab
  ├─ EngineRoofs(roofs, roofRevision)
  │   ├─ EngineFlatRoofs -> deriveFlatRoofGeometries
  │   └─ EngineGableRoofs -> deriveGableRoofGeometries
  └─ debug overlays (HUD/graph/roof plane visualizer)
```

Rendering strategy is split by element class:

- Walls: per-segment procedural box-like geometry.
- Slabs: mesh builder from derived slab envelopes.
- Roofs: derived roof set fanned into flat/gable render passes.

---

## 5) Debug tools

## Runtime toggle

- `src/engine/debug/debugFlags.ts`: debug enabled when URL contains `?debug`.
- Some legacy/runtime code also checks `src/runtime/debugFlags.ts` (`debug=1` convention).

## Overlays and helpers

- `EngineDebugHUD` — counts of derived entity arrays.
- `DerivedGraphOverlay` — visualizes per-stage revision numbers and highlights changed stages.
- `RoofPlaneVisualizer` — draws translucent meshes from roof face triangles.
- `DebugWireframe` — edge overlay attached to render meshes.
- `RoofValidationOverlay` (in `src/view/`) — visualizes invalid ridges/faces from multi-plane roof validation.
- `EngineWallsDebug` (in `src/view/`) — direct wall segment debug rendering without cache layer.

## Debug logging hotspots

- `deriveOpenings` logs edge checks, center-on-edge checks, and serialized output.

---

## 6) Geometry pipeline

Two geometry paths coexist: a modern derive→render path and a legacy build-house path.

## A) Active derive→render geometry path

1. `deriveHouse` produces `DerivedHouse`.
2. `EngineWalls` builds and caches wall geometries via:
   - `buildWallsFromDerivedSegments`
   - `extrudeWallSegment`
3. `EngineSlabs` builds slab meshes via `buildSlabMesh`.
4. `EngineRoofs` builds roof geometries via:
   - `deriveFlatRoofGeometries` (flat roofs, polygon clipping + extrusion)
   - `deriveGableRoofGeometries` (gable/multi-ridge/multi-plane roof meshing)
5. `DebugWireframe` optionally overlays edge lines.

Caching is revision-driven (`createGeometryCache`): when revision id is unchanged, previously built geometry is reused.

## B) Legacy/parallel build path

The legacy `buildHouse.ts` + `toThreeWorldMeshes.ts` path has been removed.

Remaining migration target in this area is `buildRoof.ts`, which is still consumed by `src/model/roof.ts`.

---

## 7) Coordinate mapping rules

The engine uses architectural X/Z coordinates and maps to Three.js world space with a centralized Z inversion.

## Canonical rules (`spaceMapping.ts`)

- `archToWorldXZ({x, z}) => { x, z: -z }`
- `archToWorldVec3(x, y, z) => Vector3(x, y, -z)`
- `archArrayToWorld(points)` maps arrays with the same Z-flip rule.

## Practical implications

- Architectural geometry should be authored in local architectural axes (`x`, `z`) and transformed only at dedicated mapping boundaries.
- Wall extrusion (`extrudeWallSegment`) maps segment endpoints to world space first, then computes thickness normal (`outwardSign` preserved after mapping).
- Shape-based extrusion builders (e.g., `buildExtrudedShell`) convert each 2D point via `archToWorldXZ` before creating Three.js `Shape`/`Path` objects.
- Debug/validation overlays (`RoofValidationOverlay`) also use mapping helpers, so overlays and meshes stay spatially consistent.

## Consistency guideline

When adding new geometry code:

1. Keep derivation in architectural space.
2. Apply world mapping exactly once (prefer `spaceMapping.ts`).
3. Avoid ad-hoc per-call Z negation outside mapping helpers.

This prevents mirrored geometry, inverted winding mistakes, and overlay misalignment.
