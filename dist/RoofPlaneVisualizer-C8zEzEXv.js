import { jsx as g } from "react/jsx-runtime";
import { useRef as y, useMemo as m, useEffect as M } from "react";
import { m as h, M as w, D as P, j as b, B, F as E } from "./index-BfNhbY69.js";
function R() {
  const s = /* @__PURE__ */ new Map();
  return {
    get(e, r) {
      const t = s.get(e);
      return !t || t.revision !== r ? null : t.value;
    },
    set(e, r, t) {
      var a, o;
      const n = s.get(e);
      n != null && n.value && n.value !== t && ((o = (a = n.value).dispose) == null || o.call(a)), s.set(e, { revision: r, value: t });
    },
    clear(e) {
      var r, t;
      if (e) {
        const n = s.get(e);
        (t = (r = n == null ? void 0 : n.value) == null ? void 0 : r.dispose) == null || t.call(r), s.delete(e);
        return;
      }
      s.forEach((n) => {
        var a, o;
        return (o = (a = n.value).dispose) == null ? void 0 : o.call(a);
      }), s.clear();
    },
    dispose() {
      s.forEach((e) => {
        var r, t;
        return (t = (r = e.value).dispose) == null ? void 0 : t.call(r);
      }), s.clear();
    }
  };
}
function C(s) {
  const e = new B();
  return e.setAttribute("position", new E(s, 3)), {
    value: e,
    dispose: () => e.dispose()
  };
}
function D() {
  return b.enabled && b.showRoofPlanes;
}
function x({ roofs: s, roofRevision: e }) {
  const r = y(R()), t = D(), n = m(() => t ? s.flatMap((o, i) => o.faces ? o.faces.flatMap((f, v) => {
    const c = [];
    for (const l of f.triangles ?? [])
      c.push(...l.a, ...l.b, ...l.c);
    if (c.length === 0)
      return [];
    const u = `${o.id ?? i}:${f.id ?? v}`, d = r.current.get(u, e);
    if (d)
      return h("RoofPlanes", "Reusing roof debug geometry", { key: u, revision: e }), [{ key: u, geometry: d.value }];
    h("RoofPlanes", "Rebuilding roof debug geometry", { key: u, revision: e });
    const p = C(c);
    return r.current.set(u, e, p), [{ key: u, geometry: p.value }];
  }) : []) : [], [t, e, s]), a = m(
    () => new w({
      color: 4500223,
      transparent: !0,
      opacity: 0.35,
      depthWrite: !1,
      side: P
    }),
    []
  );
  return M(() => () => {
    a.dispose(), r.current.dispose();
  }, [a]), t ? /* @__PURE__ */ g("group", { children: n.map(({ key: o, geometry: i }) => /* @__PURE__ */ g("mesh", { geometry: i, material: a }, o)) }) : null;
}
export {
  x as RoofPlaneVisualizer,
  D as shouldShowRoofPlanes
};
