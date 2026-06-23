import { jsx as o, Fragment as a } from "react/jsx-runtime";
import { useMemo as c, useEffect as n } from "react";
import { k as i, M as h, c as p } from "./index-9DageTfe.js";
function d({ openings: s }) {
  const r = c(() => new i(0.08, 12, 12), []), t = c(() => new h({ color: 16711680 }), []);
  return n(() => () => {
    r.dispose(), t.dispose();
  }, [r, t]), /* @__PURE__ */ o(a, { children: s.map((e) => {
    const m = p(
      e.centerArch.x,
      e.centerArch.y,
      e.centerArch.z
    );
    return /* @__PURE__ */ o("mesh", { position: m, geometry: r, material: t }, e.id);
  }) });
}
export {
  d as OpeningDebugOverlay
};
