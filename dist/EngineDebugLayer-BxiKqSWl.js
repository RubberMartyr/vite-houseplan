import { jsxs as l, jsx as o } from "react/jsx-runtime";
import { Suspense as a, lazy as n } from "react";
import { j as r } from "./index-BfNhbY69.js";
const s = n(
  () => import("./index-BfNhbY69.js").then((e) => e.O).then((e) => ({ default: e.DebugWireframe }))
), t = n(
  () => import("./DerivedGraphOverlay-D5LPuh6M.js").then((e) => ({ default: e.DerivedGraphOverlay }))
), i = n(
  () => import("./EngineDebugHUD-yTlo9KyZ.js").then((e) => ({ default: e.EngineDebugHUD }))
), u = n(
  () => import("./OpeningDebugOverlay-C9M6ws8X.js").then((e) => ({ default: e.OpeningDebugOverlay }))
), f = n(
  () => import("./RoofPlaneVisualizer-C8zEzEXv.js").then((e) => ({ default: e.RoofPlaneVisualizer }))
), p = n(
  () => import("./WallNormalsOverlay-BxCkj0Y6.js").then((e) => ({ default: e.WallNormalsOverlay }))
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
