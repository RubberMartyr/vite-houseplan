import { jsxs as l, jsx as o } from "react/jsx-runtime";
import { Suspense as a, lazy as n } from "react";
import { i as r } from "./index-9DageTfe.js";
const s = n(
  () => import("./index-9DageTfe.js").then((e) => e.N).then((e) => ({ default: e.DebugWireframe }))
), t = n(
  () => import("./DerivedGraphOverlay-DuGGehtB.js").then((e) => ({ default: e.DerivedGraphOverlay }))
), i = n(
  () => import("./EngineDebugHUD-CBVMV1Cu.js").then((e) => ({ default: e.EngineDebugHUD }))
), u = n(
  () => import("./OpeningDebugOverlay-CQa5sGQ9.js").then((e) => ({ default: e.OpeningDebugOverlay }))
), f = n(
  () => import("./RoofPlaneVisualizer-aRMNSyE6.js").then((e) => ({ default: e.RoofPlaneVisualizer }))
), p = n(
  () => import("./WallNormalsOverlay-DEPe9gZl.js").then((e) => ({ default: e.WallNormalsOverlay }))
);
function g() {
  return r.enabled;
}
function b({ derived: e }) {
  return g() ? /* @__PURE__ */ l(a, { fallback: null, children: [
    /* @__PURE__ */ o(i, { derived: e }),
    r.showWireframe && /* @__PURE__ */ o(s, { forceVisible: !0 }),
    r.showRoofPlanes && /* @__PURE__ */ o(f, { roofs: e.roofs, roofRevision: e.revisions.roofs }),
    r.showDerivedGraph && /* @__PURE__ */ o(t, { derived: e }),
    r.showWallNormals && /* @__PURE__ */ o(p, { walls: e.walls }),
    r.showOpenings && /* @__PURE__ */ o(u, { openings: e.openings })
  ] }) : null;
}
export {
  b as EngineDebugLayer,
  g as shouldRenderDebugLayer
};
