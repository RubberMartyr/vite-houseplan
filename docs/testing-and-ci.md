# Testing & CI Guardrails

## Local commands

- `npm run typecheck`: runs TypeScript checks with no emit.
- `npm run test`: bundles and runs deterministic Node test files under src/engine/**/__tests__.
- `npm run build`: runs the production build.
- `npm run check:legacy`: blocks reintroduction of legacy imports.
- `npm run check:coordinate-mapping`: blocks inline Z inversion outside `spaceMapping.ts`.
- `npm run check:deadcode`: fails when legacy-engine source files are reintroduced under src/engine/legacy.
- `npm run check:render-architecture`: prevents render layer imports from architectural/model/legacy paths.
- `npm run check:bundle-size`: enforces JS bundle-size thresholds after build.
- `npm run ci`: executes full local CI guardrail sequence.

## CI behavior

The GitHub Actions workflow executes:

1. install dependencies via `npm ci`
2. type checks
3. unit tests
4. production build
5. legacy import guard
6. coordinate mapping guard
7. dead-code guard
8. render architecture guard
9. bundle size check

The pipeline should fail when any guard or test fails, including:

- legacy import reintroduction
- inline Z inversion outside `src/engine/spaceMapping.ts`
- architectural imports from render components
- typecheck/build/test failures
- dramatic JS bundle size growth (>2.0 MB)
