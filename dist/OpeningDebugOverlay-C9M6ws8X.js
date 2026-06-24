import { jsx as o, Fragment as a } from "react/jsx-runtime";
import { useMemo as s, useEffect as n } from "react";
import { l as i, M as h, e as l } from "./index-BfNhbY69.js";
function d({ openings: c }) {
  const r = s(() => new i(0.08, 12, 12), []), t = s(() => new h({ color: 16711680 }), []);
  return n(() => () => {
    r.dispose(), t.dispose();
  }, [r, t]), /* @__PURE__ */ o(a, { children: c.map((e) => {
    const m = l(
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
