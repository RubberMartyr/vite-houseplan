# Material Finish Analysis

## Requested finish changes

1. Change all window frames to **RAL 7016 Coatex**.
2. Change all interior-facing walls to a **creamy white** finish.

## Implementation summary

- The shared opening frame finish is now explicitly authored as `#383e42`, which is the project mapping for **RAL 7016 / Anthracite Grey** in this scene.
- The interior wall finish is now set to `#f6f1e7`, a warm off-white selected to read as a soft creamy white under the current lighting.

## Where the changes are applied

- `architecturalHouse.materials.windows.frameColor`
  - Drives the frame material used by `EngineOpenings`.
  - This applies consistently across the modeled opening frames in the house scene.
- `architecturalHouse.materials.walls.interiorColor`
  - Drives the interior wall-side material used by `EngineWalls`.
  - This updates the inward-facing wall surfaces without changing exterior brick rendering.

## Notes

- The engine currently uses a shared opening frame material path for rendered openings, so the anthracite frame finish is controlled centrally from the architectural material spec.
- Exterior wall rendering remains unchanged and still uses the existing brick texture.
- This change stays within the existing architecture by updating material inputs rather than introducing render-side heuristics.
