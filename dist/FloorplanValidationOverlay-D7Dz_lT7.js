import { jsxs as D, jsx as k } from "react/jsx-runtime";
import { useMemo as S, useEffect as w } from "react";
import { c as C, e as x, D as N, f as W, S as V, h as X, i as Y } from "./index-BfNhbY69.js";
function h(t, c) {
  if (t.length < 3)
    return null;
  const e = new V();
  t.forEach((p, a) => {
    const o = X(p);
    a === 0 ? e.moveTo(o.x, o.z) : e.lineTo(o.x, o.z);
  });
  const f = new Y(e);
  return f.rotateX(-Math.PI / 2), f.translate(0, c, 0), f;
}
function F(t, c) {
  const e = c.map((f) => {
    const p = x(f.x, t, f.z);
    return [p.x, p.y, p.z];
  });
  return e.length > 0 && e.push(e[0]), e;
}
function J(t, c) {
  return t.filter((e) => e.edge).map((e, f) => {
    var v;
    const p = (e.levelId ? (v = c.get(e.levelId)) == null ? void 0 : v.elevation : void 0) ?? 0, a = e.code === "ROOM_T_JUNCTION" ? "#22d3ee" : e.code === "ROOM_PARTIAL_SHARED_EDGE" && e.severity === "warning" ? "#facc15" : e.severity === "error" ? "#fb923c" : e.severity === "warning" ? "#facc15" : "#38bdf8", o = x(e.edge.a.x, p + 0.08, e.edge.a.z), y = x(e.edge.b.x, p + 0.08, e.edge.b.z);
    return {
      key: `${e.code}-${f}`,
      points: [
        [o.x, o.y, o.z],
        [y.x, y.y, y.z]
      ],
      color: a
    };
  });
}
function R(t) {
  return t.relationshipType === "exterior_boundary" ? "#ffffff" : t.relationshipType === "t_junction" ? "#22d3ee" : t.relationshipType === "partial_shared" ? "#facc15" : t.hasTypeMismatch ? "#ef4444" : "#22c55e";
}
function K({
  architecturalHouse: t,
  validationResult: c,
  showFloorplanOverlay: e,
  showValidationIssues: f
}) {
  const p = S(
    () => new Map(t.levels.map((o) => [o.id, o])),
    [t.levels]
  ), a = S(() => {
    var v, L, M, E, O, _, P, j, A;
    const o = [], y = [];
    if (e) {
      for (const s of t.levels) {
        const n = C(s);
        if (n.length < 3) {
          console.warn("[HouseViewer] Skipping footprint geometry: missing footprint.outer", {
            levelId: s == null ? void 0 : s.id,
            level: s
          });
          continue;
        }
        const l = h(n, s.elevation + 0.015);
        l && o.push({
          key: `footprint-${s.id}`,
          geometry: l,
          color: "#22c55e",
          opacity: 0.18
        }), y.push({
          key: `footprint-line-${s.id}`,
          points: F(s.elevation + 0.03, n),
          color: "#22c55e"
        });
      }
      for (const s of t.rooms ?? []) {
        const n = p.get(s.levelId);
        if (!n) continue;
        const l = h(s.polygon, n.elevation + 0.04);
        l && o.push({
          key: `room-overlay-${s.id}`,
          geometry: l,
          color: "#ef4444",
          opacity: 0.2
        });
      }
    }
    if (f && c) {
      for (const n of t.levels) {
        const l = ((v = c.perLevel[n.id]) == null ? void 0 : v.coveredPolygons) ?? [];
        for (let r = 0; r < l.length; r += 1) {
          const i = h(l[r], n.elevation + 0.055);
          i && o.push({
            key: `covered-${n.id}-${r}`,
            geometry: i,
            color: "#22c55e",
            opacity: 0.15
          });
        }
        const g = ((L = c.perLevel[n.id]) == null ? void 0 : L.uncoveredPolygons) ?? [], I = ((M = c.perLevel[n.id]) == null ? void 0 : M.issues.some((r) => r.code === "ROOM_MICRO_GAP")) ?? !1;
        for (let r = 0; r < g.length; r += 1) {
          const i = h(g[r], n.elevation + 0.06);
          i && o.push({
            key: `uncovered-${n.id}-${r}`,
            geometry: i,
            color: I ? "#f59e0b" : "#ef4444",
            opacity: 0.42
          });
        }
        const m = ((E = c.perLevel[n.id]) == null ? void 0 : E.adjacencyEdges) ?? [];
        for (const [r, i] of m.entries()) {
          if (!Number.isFinite(i.sharedLength) || i.sharedLength <= 1e-3)
            continue;
          const T = (O = t.rooms) == null ? void 0 : O.find((d) => d.id === i.roomAId && d.levelId === n.id), G = (_ = t.rooms) == null ? void 0 : _.find((d) => d.id === i.roomBId && d.levelId === n.id), $ = T ?? G;
          if (!$) continue;
          const u = $.polygon.map((d, B) => ({ a: d, b: $.polygon[(B + 1) % $.polygon.length] })).find((d) => Math.hypot(d.a.x - d.b.x, d.a.z - d.b.z) >= i.sharedLength - 0.1) ?? null;
          if (!u) continue;
          const b = x(u.a.x, n.elevation + 0.09, u.a.z), z = x(u.b.x, n.elevation + 0.09, u.b.z);
          y.push({
            key: `adj-${n.id}-${i.roomAId}-${i.roomBId}-${i.relationshipType}-${r}`,
            points: [
              [b.x, b.y, b.z],
              [z.x, z.y, z.z]
            ],
            color: R(i)
          });
        }
      }
      const s = c.issues.filter((n) => n.code === "ROOM_OVERLAP");
      for (const [n, l] of s.entries()) {
        const g = ((P = l.meta) == null ? void 0 : P.overlapPolygons) ?? [], I = (l.levelId ? (j = p.get(l.levelId)) == null ? void 0 : j.elevation : void 0) ?? 0;
        if (g.length === 0 && l.roomIds) {
          for (const m of l.roomIds) {
            const r = (A = t.rooms) == null ? void 0 : A.find((T) => T.id === m);
            if (!r) continue;
            const i = h(r.polygon, I + 0.07);
            i && o.push({
              key: `overlap-room-highlight-${r.id}-${n}`,
              geometry: i,
              color: "#9333ea",
              opacity: 0.2
            });
          }
          continue;
        }
        for (let m = 0; m < g.length; m += 1) {
          const r = h(g[m], I + 0.07);
          r && o.push({
            key: `overlap-polygon-${n}-${m}`,
            geometry: r,
            color: "#9333ea",
            opacity: 0.45
          });
        }
      }
      y.push(...J(c.issues, p));
    }
    return { meshes: o, lines: y };
  }, [t, p, e, f, c]);
  return w(() => () => {
    a.meshes.forEach((o) => o.geometry.dispose());
  }, [a.meshes]), !e && !(f && c) ? null : /* @__PURE__ */ D("group", { children: [
    a.meshes.map((o) => /* @__PURE__ */ k("mesh", { geometry: o.geometry, children: /* @__PURE__ */ k(
      "meshBasicMaterial",
      {
        color: o.color,
        transparent: !0,
        opacity: o.opacity,
        side: N,
        depthTest: !1
      }
    ) }, o.key)),
    a.lines.map((o) => /* @__PURE__ */ k(W, { points: o.points, color: o.color, lineWidth: 3, depthTest: !1 }, o.key))
  ] });
}
export {
  K as FloorplanValidationOverlay
};
