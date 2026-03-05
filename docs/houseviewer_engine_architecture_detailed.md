# HouseViewer Engine Architecture (Detailed)

> Living document. Intended for `docs/ENGINE_ARCHITECTURE.md` (or similar) in the repo.

---

## Table of contents

1. Goals and non-goals
2. Big picture: data → derive → cache → render
3. Coordinate spaces and the mapping contract
4. Repository layout (high-level)
5. Engine entrypoints and runtime flow
6. Derived pipeline
7. Derived data model (types)
8. Geometry builders
9. Rendering layer (React Three Fiber)
10. Roof system (multi-plane) overview
11. Validation layer
12. Debug toolchain (`?debug=1`)
13. Performance: caching, revisions, disposal
14. Extension points (dormers, cuts, IFC)
15. “How to work in this codebase” checklist

---

## 1. Goals and non-goals

### Goals

- **Single source of truth** for building intent: the architectural model (`ArchitecturalHouse`).
- **Deterministic derivation** of engine-ready data: `deriveHouse(arch) → DerivedHouse`.
- **Stateless rendering**: renderers consume derived data and produce Three.js meshes without mutating architectural state.
- **Centralized coordinate mapping**: exactly one place where architectural→world conversion happens.
- **Debuggability**: debug overlays reveal pipeline stages, revisions, and geometry issues.
- **Performance**: cache geometry rebuilds by revision.

### Non-goals (for now)

- Full BIM/IFC semantic completeness (export can be layered on later).
- Fully incremental partial recompute graph (we do coarse revisions per subsystem).
- Full parametric edit history / undo stack (possible future work).

---

## 2. Big picture: data → derive → cache → render

### The canonical engine pipeline

```
ArchitecturalHouse (input JSON)
        ↓
deriveHouse()
        ↓
DerivedHouse
  ├ slabs
  ├ walls
  ├ openings
  └ roofs
        ↓
Geometry cache (per subsystem revision)
        ↓
Render layer (Three.js / R3F)
```

### Separation of responsibilities

- **Architectural layer**: describes intent, never contains rendering hacks.
- **Derive layer**: converts intent into consistent, engine-friendly primitives.
- **Geometry builders**: create buffer geometry in world space.
- **Render layer**: draws meshes, overlays and debug helpers.

---

## 3. Coordinate spaces and the mapping contract

### Architectural space (source of truth)

Architectural model coordinates are clean building-space coordinates:

- **+X = Right**
- **+Z = Front**
- **+Y = Up**

Architectural data must never contain camera or renderer compensations.

### Three.js world convention

Three.js common camera convention considers forward direction along **-Z**. To align architectural “front” with Three “forward”, we map:

```
worldZ = -architecturalZ
```

### The strict rule

**Architectural → World mapping MUST occur in exactly one place:**

- `src/engine/spaceMapping.ts`

This is the only allowed Z inversion. No other file should do `-z` as a “fix”.

Recommended helper:

```ts
export function archToWorldXZ(p: { x: number; z: number }) {
  return { x: p.x, z: -p.z };
}
```

### Geometry builders rule

All geometry builders must:

1. Accept architectural coordinates
2. Convert via `archToWorldXZ()`
3. Emit world-space positions only

Never mix architectural and world space inside the same data structure.

---

## 4. Repository layout (high-level)

This is the mental model of the repo modules (names reflect typical structure).

### `src/engine/`

- `EngineHouse.tsx`: engine composition component (entrypoint for engine scene).
- `architecturalTypes.ts`: types for architectural model.
- `spaceMapping.ts`: authoritative coordinate mapping.
- `derive/`: derive pipeline functions producing `DerivedHouse`.
- `render/`: renderers producing R3F meshes.
- `geometry/`: geometry helpers/builders.
- `validation/`: structural validation and roof/opening validation.

### `src/model/`

Domain helpers/constants (materials, envelope helpers, house spec constants, etc.).
This layer may contain legacy code; engine should prefer derived structures.

### `src/components/` and `src/ui/`

Viewer UI, debug helpers, JSON editor panel, etc.

---

## 5. Engine entrypoints and runtime flow

### Scene-level flow

At runtime, the viewer constructs a scene like:

```
HouseViewer
  └── <Canvas> (R3F)
        └── EngineHouse
              ├── EngineWalls
              ├── EngineSlabs
              ├── EngineRoofs (or EngineFlatRoofs / EngineGableRoofs depending on current setup)
              └── Debug overlays (when ?debug=1)
```

### EngineHouse

Responsibilities:

- Derive the engine model via `deriveHouse(architecturalHouse)` (usually `useMemo`).
- Pass derived primitives to renderer components.
- Mount debug overlays when debug is enabled.

---

## 6. Derived pipeline

### `deriveHouse(arch)`

The canonical derive entrypoint. Typical ordering:

1. Validate structure (optional gate)
2. Derive slabs
3. Derive walls (from footprint edges)
4. Derive openings (place doors/windows on wall edges)
5. Derive roofs (from JSON roof specs; multi-plane logic may derive face regions)

**Output**: `DerivedHouse`

### Why ordering matters

Even if some subsystems currently ignore dependencies, ordering communicates intent and prevents future coupling bugs.

---

## 7. Derived data model (types)

### `DerivedHouse`

The engine’s canonical internal model:

- `slabs: DerivedSlab[]`
- `walls: DerivedWallSegment[]`
- `openings: DerivedOpening[]`
- `roofs: DerivedRoof[]`
- `revisions: { slabs, walls, openings, roofs }`

Revisions are small, deterministic numbers used by geometry caching.

### `DerivedSlab`

A slab is usually a footprint polygon + elevation/height data.

Common fields:

- `levelId`
- `footprint.outer: XZ[]`
- `footprint.holes?: XZ[][]`
- `elevationTop`, `elevationBottom` (or similar)

### `DerivedWallSegment`

Walls are derived from level footprint edges.

Key fields:

- `id`
- `levelId`
- `start: { x,y,z }`
- `end: { x,y,z }`
- `height`
- `thickness`
- `outwardSign` (computed from polygon winding)

**Outward sign** prevents mirrored thickness and fixes “inside-out” walls.

### `DerivedOpening`

Openings are placed on walls. Typical fields:

- `id`
- `levelId`
- `wallSegmentId` or computed segment reference
- `center / start / end` on the segment
- `width`, `height`, `sillHeight`
- `outwardNormal` (for cuts / framing)

### `DerivedRoof`

Roofs are JSON-driven specs (e.g., `type: "multi-plane"`). Derived roofs may include:

- `id`, `type`, `baseLevelId`
- `overhang`, `thickness`, `eaveHeight`
- `ridgeSegments[]`
- `faces[]` (hip caps, ridge side segments, etc.)

**Note:** Triangulation/geometry creation currently lives near the roof geometry builder / renderer for stability.

---

## 8. Geometry builders

Geometry builders convert derived primitives into Three.js `BufferGeometry`.

### Wall segment extrusion

Typical steps:

1. Work in architectural coordinates
2. Map segment endpoints to world space via `archToWorldXZ`
3. Compute perpendicular (normal) using `outwardSign`
4. Build a prism (8 vertices) and generate triangles
5. Return `BufferGeometry`

### Roof face geometry

Roof system typically:

- defines regions per roof face (clipped polygons)
- triangulates each region in XZ
- extrudes thickness downward
- computes normals

---

## 9. Rendering layer (React Three Fiber)

Renderers should be as dumb as possible:

- take derived primitives
- obtain cached geometry by revision
- render a mesh

### Geometry caching (per revision)

Pattern:

```
if revision unchanged:
  reuse geometry
else:
  rebuild geometry once
```

### Disposal (recommended)

When replacing cached geometries, call `geometry.dispose()` to avoid GPU memory growth.

---

## 10. Roof system (multi-plane) overview

### Objective

The roof system is designed to be:

- JSON-driven (no hidden heuristics)
- capable of asymmetric ridges
- capable of hip caps front/back
- constant pitch per side
- robust to indented footprints

### Two-pass geometry architecture (conceptual)

1. **Hip caps pass**
   - compute hip triangle regions
   - store seam base points
2. **Ridge sides pass**
   - build one plane per side (left/right) to enforce constant pitch
   - clip plane into segments
   - triangulate clipped regions

### Key stability rule (corner triangles)

For ridge-end corner triangles, the stable rule is *topological*:

1. Seam base `B` lies on a footprint edge.
2. That edge has endpoints `A` and `C`.
3. The correct corner is the endpoint that is **not equal** to `B`.

---

## 11. Validation layer

Validation exists to catch structural problems early:

- `validateStructure`
- `validateOpenings`
- `validateMultiPlaneRoof`

---

## 12. Debug toolchain (`?debug=1`)

Debug mode should **not** change model behavior.

Typical enabled tools:

- Axis helper
- EngineDebugHUD: counts + revisions
- DerivedGraph overlay: dependency visualization
- Wireframe overlay (edges)
- Roof plane visualizer (semi-transparent faces)

---

## 13. Performance: caching, revisions, disposal

Already implemented:

- Clean revision counters (small, readable)
- Geometry caching by revision

Recommended next:

- Dispose replaced geometries
- Optional per-roof/face caching for heavy roofs

---

## 14. Extension points

- Dormers and roof cuts (face polygons + boolean regions)
- IFC / BIM export (DerivedHouse → IFC objects)
- Parametric edits (stable IDs + incremental recompute)

---

## 15. “How to work in this codebase” checklist

### Adding geometry

- Put intent in architectural model
- Put engine primitives in derive layer
- Put buffer generation in geometry builder
- Keep renderers stateless
- Never invert axes outside `spaceMapping.ts`

### Debugging “it disappeared”

- Check derived counts in HUD
- Check wireframe overlay
- Check for degenerate triangles
- Check face winding / culling
- Check arch vs world coordinate mismatch

---

_End._
