# HouseViewer Engine – Agent Guide

This repository contains a procedural 3D house engine.

The engine converts architectural data into 3D geometry using a deterministic pipeline.

Agents modifying this repository must follow the architecture described below.

## Core Architecture

The engine follows this pipeline:

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
Render layer (Three.js / React Three Fiber)

Rendering components must never implement architectural logic.

All structural logic belongs in the derive layer.

## Important Derived Types

DerivedHouse contains:

- slabs
- walls
- openings
- roofs
- revisions

Renderers use revision numbers to cache geometry.

## Rendering Components

Main rendering components:

EngineWalls  
EngineSlabs  
EngineRoofs  
EngineOpenings  

These components convert derived data into Three.js meshes.

Renderers must remain stateless.

## Coordinate System

Architectural space uses:

+X → right  
+Z → front  
+Y → up  

Three.js uses a flipped Z axis.

The ONLY allowed coordinate conversion is inside:

src/engine/spaceMapping.ts

Never invert Z anywhere else.

## Geometry Rules

Geometry generation should follow this pattern:

Derived data → geometry builder → mesh

Examples:

extrudeWallSegment  
buildSlabMesh  
deriveGableRoofGeometries  

Avoid creating geometry directly inside React components.

## Debug System

Debug mode is enabled using:

?debug=1

Debug tools include:

EngineDebugHUD  
DerivedGraphOverlay  
RoofPlaneVisualizer  

New debug tools should follow the same pattern.

## Development Commands

Install dependencies

npm install

Run dev server

npm run dev

Build project

npm run build

## Code Guidelines

Agents modifying this repository must follow these rules:

1. Do not introduce architectural logic in render components.
2. Keep derivation deterministic.
3. Prefer modifying derive layer over render layer.
4. Keep coordinate transformations centralized.
5. Avoid adding hidden geometry heuristics.

## Documentation

More detailed architecture documentation exists in:

docs/ENGINE_ARCHITECTURE.md  
docs/houseviewer_engine_architecture_detailed.md  
docs/developer-guide.md

Agents should read these files before making structural changes.
