import { jsxs as D, jsx as L } from "react/jsx-runtime";
import { useMemo as G, useEffect as C } from "react";
import { c as x, D as N, e as W, S as w, f as X, h as Y } from "./index-9DageTfe.js";
function h(r, i) {
  if (r.length < 3)
    return null;
  const e = new w();
  r.forEach((l, a) => {
    const o = X(l);
    a === 0 ? e.moveTo(o.x, o.z) : e.lineTo(o.x, o.z);
  });
  const s = new Y(e);
  return s.rotateX(-Math.PI / 2), s.translate(0, i, 0), s;
}
function J(r, i) {
  const e = i.map((s) => {
    const l = x(s.x, r, s.z);
    return [l.x, l.y, l.z];
  });
  return e.length > 0 && e.push(e[0]), e;
}
function R(r, i) {
  return r.filter((e) => e.edge).map((e, s) => {
    var v;
    const l = (e.levelId ? (v = i.get(e.levelId)) == null ? void 0 : v.elevation : void 0) ?? 0, a = e.code === "ROOM_T_JUNCTION" ? "#22d3ee" : e.code === "ROOM_PARTIAL_SHARED_EDGE" && e.severity === "warning" ? "#facc15" : e.severity === "error" ? "#fb923c" : e.severity === "warning" ? "#facc15" : "#38bdf8", o = x(e.edge.a.x, l + 0.08, e.edge.a.z), y = x(e.edge.b.x, l + 0.08, e.edge.b.z);
    return {
      key: `${e.code}-${s}`,
      points: [
        [o.x, o.y, o.z],
        [y.x, y.y, y.z]
      ],
      color: a
    };
  });
}
function U(r) {
  return r.relationshipType === "exterior_boundary" ? "#ffffff" : r.relationshipType === "t_junction" ? "#22d3ee" : r.relationshipType === "partial_shared" ? "#facc15" : r.hasTypeMismatch ? "#ef4444" : "#22c55e";
}
function F({
  architecturalHouse: r,
  validationResult: i,
  showFloorplanOverlay: e,
  showValidationIssues: s
}) {
  const l = G(
    () => new Map(r.levels.map((o) => [o.id, o])),
    [r.levels]
  ), a = G(() => {
    var v, M, k, E, _, O, P, j, A;
    const o = [], y = [];
    if (e) {
      for (const f of r.levels) {
        const n = h(f.footprint.outer, f.elevation + 0.015);
        n && o.push({
          key: `footprint-${f.id}`,
          geometry: n,
          color: "#22c55e",
          opacity: 0.18
        }), y.push({
          key: `footprint-line-${f.id}`,
          points: J(f.elevation + 0.03, f.footprint.outer),
          color: "#22c55e"
        });
      }
      for (const f of r.rooms ?? []) {
        const n = l.get(f.levelId);
        if (!n) continue;
        const d = h(f.polygon, n.elevation + 0.04);
        d && o.push({
          key: `room-overlay-${f.id}`,
          geometry: d,
          color: "#ef4444",
          opacity: 0.2
        });
      }
    }
    if (s && i) {
      for (const n of r.levels) {
        const d = ((v = i.perLevel[n.id]) == null ? void 0 : v.coveredPolygons) ?? [];
        for (let t = 0; t < d.length; t += 1) {
          const c = h(d[t], n.elevation + 0.055);
          c && o.push({
            key: `covered-${n.id}-${t}`,
            geometry: c,
            color: "#22c55e",
            opacity: 0.15
          });
        }
        const g = ((M = i.perLevel[n.id]) == null ? void 0 : M.uncoveredPolygons) ?? [], I = ((k = i.perLevel[n.id]) == null ? void 0 : k.issues.some((t) => t.code === "ROOM_MICRO_GAP")) ?? !1;
        for (let t = 0; t < g.length; t += 1) {
          const c = h(g[t], n.elevation + 0.06);
          c && o.push({
            key: `uncovered-${n.id}-${t}`,
            geometry: c,
            color: I ? "#f59e0b" : "#ef4444",
            opacity: 0.42
          });
        }
        const m = ((E = i.perLevel[n.id]) == null ? void 0 : E.adjacencyEdges) ?? [];
        for (const [t, c] of m.entries()) {
          if (!Number.isFinite(c.sharedLength) || c.sharedLength <= 1e-3)
            continue;
          const T = (_ = r.rooms) == null ? void 0 : _.find((p) => p.id === c.roomAId && p.levelId === n.id), S = (O = r.rooms) == null ? void 0 : O.find((p) => p.id === c.roomBId && p.levelId === n.id), $ = T ?? S;
          if (!$) continue;
          const u = $.polygon.map((p, B) => ({ a: p, b: $.polygon[(B + 1) % $.polygon.length] })).find((p) => Math.hypot(p.a.x - p.b.x, p.a.z - p.b.z) >= c.sharedLength - 0.1) ?? null;
          if (!u) continue;
          const b = x(u.a.x, n.elevation + 0.09, u.a.z), z = x(u.b.x, n.elevation + 0.09, u.b.z);
          y.push({
            key: `adj-${n.id}-${c.roomAId}-${c.roomBId}-${c.relationshipType}-${t}`,
            points: [
              [b.x, b.y, b.z],
              [z.x, z.y, z.z]
            ],
            color: U(c)
          });
        }
      }
      const f = i.issues.filter((n) => n.code === "ROOM_OVERLAP");
      for (const [n, d] of f.entries()) {
        const g = ((P = d.meta) == null ? void 0 : P.overlapPolygons) ?? [], I = (d.levelId ? (j = l.get(d.levelId)) == null ? void 0 : j.elevation : void 0) ?? 0;
        if (g.length === 0 && d.roomIds) {
          for (const m of d.roomIds) {
            const t = (A = r.rooms) == null ? void 0 : A.find((T) => T.id === m);
            if (!t) continue;
            const c = h(t.polygon, I + 0.07);
            c && o.push({
              key: `overlap-room-highlight-${t.id}-${n}`,
              geometry: c,
              color: "#9333ea",
              opacity: 0.2
            });
          }
          continue;
        }
        for (let m = 0; m < g.length; m += 1) {
          const t = h(g[m], I + 0.07);
          t && o.push({
            key: `overlap-polygon-${n}-${m}`,
            geometry: t,
            color: "#9333ea",
            opacity: 0.45
          });
        }
      }
      y.push(...R(i.issues, l));
    }
    return { meshes: o, lines: y };
  }, [r, l, e, s, i]);
  return C(() => () => {
    a.meshes.forEach((o) => o.geometry.dispose());
  }, [a.meshes]), !e && !(s && i) ? null : /* @__PURE__ */ D("group", { children: [
    a.meshes.map((o) => /* @__PURE__ */ L("mesh", { geometry: o.geometry, children: /* @__PURE__ */ L(
      "meshBasicMaterial",
      {
        color: o.color,
        transparent: !0,
        opacity: o.opacity,
        side: N,
        depthTest: !1
      }
    ) }, o.key)),
    a.lines.map((o) => /* @__PURE__ */ L(W, { points: o.points, color: o.color, lineWidth: 3, depthTest: !1 }, o.key))
  ] });
}
export {
  F as FloorplanValidationOverlay
};
