import { useEffect as f } from "react";
import { u as p, E as m, L as y, b as d } from "./index-BfNhbY69.js";
function l(r) {
  return r ? Array.isArray(r) ? r.some((n) => n.transparent) : r.transparent : !1;
}
function E({ showEdges: r, showOpeningEdges: n }) {
  const { scene: a } = p();
  return f(() => {
    if (!r)
      return;
    const i = [];
    return a.traverse((t) => {
      var c;
      if (!t.isMesh)
        return;
      const e = t;
      if (((c = e.userData) == null ? void 0 : c.debugType) !== "structure" || !e.geometry || l(e.material))
        return;
      const o = new m(e.geometry), u = new y({
        color: 0,
        linewidth: 1
      }), s = new d(o, u);
      s.position.copy(e.position), s.rotation.copy(e.rotation), s.scale.copy(e.scale), e.add(s), i.push(s);
    }), () => {
      i.forEach((t) => {
        t.removeFromParent(), t.geometry.dispose();
        const e = t.material;
        Array.isArray(e) ? e.forEach((o) => o.dispose()) : e.dispose();
      });
    };
  }, [a, r, n]), null;
}
export {
  E as DebugEdges
};
