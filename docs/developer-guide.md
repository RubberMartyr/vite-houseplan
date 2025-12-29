# House Viewer Developer Guide

## Coordinate system and facades

- World axes follow Three.js defaults: +X to the right, +Y up, +Z forward.
- Facade planes are defined in `src/model/houseSpec.ts` and wrapped by helpers in `src/model/orientation.ts`:
  - **Front**: `z = frontZ` (faces -Z)
  - **Rear**: `z = rearZ` (faces +Z)
  - **Left**: `x = leftX` (faces -X)
  - **Right**: `x = rightX` (faces +X)
- Use `getFacadePlane` and `isPointOnFacade` to avoid implicit sign assumptions. Logging `logOrientationAssertions()` in dev mode prints the active planes.
- The house group is offset by `originOffset` so that the footprint is centered near the world origin; markers account for this offset.

## Debug and orientation overlays

- Enable orientation debugging via `VITE_DEBUG_ORIENTATION=true` or by loading the app with `?debug=1`.
- In debug mode the scene shows:
  - `AxesHelper` at the house origin (with `originOffset` applied).
  - Labeled sprites for each facade plane (FRONT, REAR, LEFT, RIGHT).
  - Markers at the world origin and at each envelope corner.
- Use `?screenshot=1` to combine deterministic rendering settings (fixed DPR, camera preset) with the debug overlay for regression captures.

## Adding new geometry (windows/walls)

- Derive facade positions from `orientation.ts` or `houseSpec.ts` instead of hardcoding signs.
- Keep meshes parented under the house group positioned at `originOffset` so that coordinates align with the envelope polygons.
- Reuse existing material factories to avoid per-frame recreation and potential leaks.

## Visual regression checks

1. Start the dev server on port 3000:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 3000
   ```
2. Install Playwright once (if not already):
   ```bash
   npm install -D @playwright/test
   npx playwright install chromium
   ```
3. Run the baseline capture suite (saves to `artifacts/`):
   ```bash
   npx playwright test tests/visual-regression.spec.ts --project=chromium
   ```
   The tests load `?screenshot=1&debug=1` to fix viewport/DPR and include orientation markers.
