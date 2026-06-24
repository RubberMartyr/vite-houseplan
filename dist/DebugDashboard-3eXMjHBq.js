var D = Object.defineProperty;
var _ = (r, n, i) => n in r ? D(r, n, { enumerable: !0, configurable: !0, writable: !0, value: i }) : r[n] = i;
var $ = (r, n, i) => _(r, typeof n != "symbol" ? n + "" : n, i);
import { jsxs as f, jsx as c } from "react/jsx-runtime";
import M, { useState as S, useMemo as R, useEffect as C } from "react";
import { v as P, a as G, g as V, d as W } from "./index-BfNhbY69.js";
function T({
  label: r,
  checked: n,
  onChange: i
}) {
  return /* @__PURE__ */ f(
    "label",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(148, 163, 184, 0.45)",
        background: "rgba(15, 23, 42, 0.5)"
      },
      children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: n, onChange: (s) => i(s.target.checked) }),
        r
      ]
    }
  );
}
function B({
  onRunFloorplanValidation: r,
  showFloorplanOverlay: n,
  onShowFloorplanOverlayChange: i,
  showValidationIssues: s,
  onShowValidationIssuesChange: a,
  onClearValidationOutput: t,
  validationLog: o = []
}) {
  const [l, d] = S([]), e = R(() => [...l, ...o], [l, o]);
  return /* @__PURE__ */ f("div", { children: [
    /* @__PURE__ */ c("h3", { style: { marginTop: 0, marginBottom: 12 }, children: "Floor Plan Validation" }),
    /* @__PURE__ */ f("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
      /* @__PURE__ */ c(
        T,
        {
          label: "Show floorplan layout",
          checked: n,
          onChange: i
        }
      ),
      /* @__PURE__ */ c(
        T,
        {
          label: "Show validation issues",
          checked: s,
          onChange: a
        }
      )
    ] }),
    /* @__PURE__ */ f("div", { style: { marginTop: 16, display: "grid", gap: 10 }, children: [
      /* @__PURE__ */ f("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ c("button", { type: "button", onClick: () => {
          const u = (/* @__PURE__ */ new Date()).toLocaleTimeString();
          d((h) => [{ level: "info", message: `[${u}] Validation requested.` }, ...h]), r();
        }, children: "Run Floorplan Validation" }),
        /* @__PURE__ */ c("button", { type: "button", onClick: t, children: "Clear Validation Output" })
      ] }),
      /* @__PURE__ */ c(
        "div",
        {
          style: {
            borderRadius: 10,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "rgba(2, 6, 23, 0.55)",
            padding: 10,
            minHeight: 80,
            maxHeight: 220,
            overflowY: "auto"
          },
          children: (e.length === 0 ? [{ level: "info", message: "No validation runs yet." }] : e).map((u, h) => {
            const p = u.level === "error" ? "#fca5a5" : u.level === "warn" ? "#fde68a" : "#86efac", b = u.level === "error" ? "Error" : u.level === "warn" ? "Warn" : "Info";
            return /* @__PURE__ */ f("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }, children: [
              /* @__PURE__ */ c("span", { style: { color: p, fontWeight: 700, minWidth: 46 }, children: b }),
              /* @__PURE__ */ c("span", { children: u.message })
            ] }, `${u.message}-${h}`);
          })
        }
      )
    ] })
  ] });
}
const v = 1e-6, E = 0.05;
function L(r) {
  var s, a;
  const n = new Map(r.levels.map((t, o) => [t.id, { lvl: t, idx: o }])), i = (t, o) => {
    var e;
    const l = (e = t.footprint.edges) == null ? void 0 : e.find((g) => g.id === o);
    if (l) return l.edgeIndex;
    if (!t.footprint.derivedFrom) return null;
    const d = r.levels.find((g) => g.id === t.footprint.derivedFrom);
    return d ? i(d, o) : null;
  };
  for (const t of r.openings ?? []) {
    const o = n.get(t.levelId);
    if (!o)
      throw new Error(`Opening ${t.id}: invalid levelId ${t.levelId}`);
    const { lvl: l } = o;
    if (!((a = (s = l.footprint) == null ? void 0 : s.outer) != null && a.length))
      throw new Error(`Opening ${t.id}: level has no footprint.outer`);
    if (t.edge.levelId !== t.levelId)
      throw new Error(
        `Opening ${t.id}: edge.levelId (${t.edge.levelId}) must match opening.levelId (${t.levelId})`
      );
    if (t.width <= 0 || t.height <= 0)
      throw new Error(`Opening ${t.id}: width/height must be > 0`);
    if (t.width < E || t.height < E)
      throw new Error(
        `Opening ${t.id}: width/height must be >= ${E}m (got width=${t.width}, height=${t.height})`
      );
    if (t.sillHeight < -v)
      throw new Error(`Opening ${t.id}: sillHeight must be >= 0`);
    if (t.sillHeight + t.height > l.height + v)
      throw new Error(`Opening ${t.id}: exceeds wall height (sill+height > level.height)`);
    const d = l.footprint.outer, e = d.length, g = t.edge.edgeIndex ?? (t.edge.edgeId ? i(l, t.edge.edgeId) : null);
    if (g == null)
      throw new Error(`Opening ${t.id}: could not resolve edge via edgeIndex/edgeId`);
    if (g < 0 || g >= e)
      throw new Error(`Opening ${t.id}: invalid edgeIndex ${g}`);
    const u = d[g], h = d[(g + 1) % e], p = h.x - u.x, b = h.z - u.z, x = Math.sqrt(p * p + b * b);
    if (x < v)
      throw new Error(`Opening ${t.id}: edge length too small`);
    if (t.offset < -v)
      throw new Error(`Opening ${t.id}: offset must be >= 0`);
    if (t.offset + t.width > x + v)
      throw new Error(`Opening ${t.id}: offset+width exceeds edge length`);
  }
}
function J(r) {
  const n = P(r);
  if (!n.ok) {
    const i = n.issues.find((s) => s.severity === "error");
    throw new Error((i == null ? void 0 : i.message) ?? "Room validation failed.");
  }
}
const U = 1e-6;
function q(r, n) {
  return {
    x: r.start.x + (r.end.x - r.start.x) * n,
    z: r.start.z + (r.end.z - r.start.z) * n
  };
}
function F(r, n, i) {
  const s = i.x - n.x, a = i.z - n.z, t = r.x - n.x, o = r.z - n.z;
  return t * a - o * s;
}
function k(r, n, i, s) {
  const a = { x: n.x - r.x, z: n.z - r.z }, t = { x: s.x - i.x, z: s.z - i.z }, o = a.x * t.z - a.z * t.x;
  if (Math.abs(o) < 1e-9) return null;
  const l = { x: i.x - r.x, z: i.z - r.z }, d = (l.x * t.z - l.z * t.x) / o;
  return d < -1e-9 || d > 1 + 1e-9 ? null : { x: r.x + d * a.x, z: r.z + d * a.z };
}
function j(r, n) {
  const i = (o) => {
    const l = F(o, n.a, n.b);
    return n.keep === "left" ? l >= -1e-9 : l <= 1e-9;
  }, s = [];
  for (let o = 0; o < r.length - 1; o++) {
    const l = r[o], d = r[o + 1], e = i(l), g = i(d);
    if (e && g)
      s.push(d);
    else if (e && !g) {
      const u = k(l, d, n.a, n.b);
      u && s.push(u);
    } else if (!e && g) {
      const u = k(l, d, n.a, n.b);
      u && s.push(u), s.push(d);
    }
  }
  if (s.length < 3) return s;
  const a = s[0], t = s[s.length - 1];
  return (Math.abs(a.x - t.x) > 1e-9 || Math.abs(a.z - t.z) > 1e-9) && s.push({ ...a }), s;
}
function Y(r, n, i) {
  const s = q(r, n), a = r.end.x - r.start.x, t = r.end.z - r.start.z, o = Math.hypot(a, t) || 1, l = a / o, d = t / o, e = -d, g = l, u = { x: s.x - e * 1e3, z: s.z - g * 1e3 }, h = { x: s.x + e * 1e3, z: s.z + g * 1e3 }, p = { x: s.x + l * 0.01, z: s.z + d * 0.01 }, x = F(p, u, h) >= 0 ? "left" : "right";
  return i === "ahead" ? { a: u, b: h, keep: x } : { a: u, b: h, keep: x === "left" ? "right" : "left" };
}
function X(r, n) {
  if (r.type === "halfPlanes") return r.planes;
  if (r.type !== "compound") return null;
  const i = [];
  for (const s of r.items) {
    const a = s;
    if (a.type === "ridgePerpCut") {
      const t = n.ridgeSegments.find((o) => o.id === a.ridgeId);
      if (!t) return null;
      i.push(Y(t, a.t, a.keep));
      continue;
    }
    i.push(s);
  }
  return i;
}
function K(r) {
  const n = r.ridgeSegments.flatMap((d) => [d.start, d.end]);
  if (n.length === 0)
    return [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: 10, z: 10 },
      { x: -10, z: 10 },
      { x: -10, z: -10 }
    ];
  const i = n.map((d) => d.x), s = n.map((d) => d.z), a = Math.min(...i) - 10, t = Math.max(...i) + 10, o = Math.min(...s) - 10, l = Math.max(...s) + 10;
  return [
    { x: a, z: o },
    { x: t, z: o },
    { x: t, z: l },
    { x: a, z: l },
    { x: a, z: o }
  ];
}
function Q(r, n) {
  if (n.region.type === "ridgeCapTriangle")
    return null;
  const i = X(n.region, r);
  if (!i) return [];
  let s = K(r);
  for (const a of i)
    if (s = j(s, a), s.length < 4) return s;
  return s;
}
function Z(r) {
  const n = [], i = [], s = [], a = [], t = [], o = [], l = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Map();
  for (const e of r.ridgeSegments) {
    d.set(e.id, e), l.has(e.id) && (n.push({
      severity: "error",
      code: "RIDGE_DUPLICATE_ID",
      message: `Duplicate ridge id "${e.id}".`,
      roofId: r.id,
      ridgeId: e.id,
      path: `ridgeSegments[id=${e.id}]`
    }), s.push(e)), l.add(e.id), Math.hypot(e.end.x - e.start.x, e.end.z - e.start.z) <= U && (n.push({
      severity: "error",
      code: "RIDGE_DEGENERATE",
      message: `Ridge "${e.id}" start and end are identical or too close.`,
      roofId: r.id,
      ridgeId: e.id,
      path: `ridgeSegments[id=${e.id}].start/end`
    }), s.push(e));
    const u = e.end.x - e.start.x, h = e.end.z - e.start.z;
    u * u + h * h < 1e-6 && (n.push({
      severity: "error",
      code: "ridge-zero-length",
      message: `Ridge "${e.id}" has zero length.`,
      roofId: r.id,
      ridgeId: e.id
    }), s.push(e)), e.height <= r.eaveHeight && (n.push({
      severity: "error",
      code: "ridge-height-invalid",
      message: `Ridge "${e.id}" height must be above eaveHeight.`,
      roofId: r.id,
      ridgeId: e.id
    }), s.push(e)), e.height <= 0 && (n.push({
      severity: "error",
      code: "RIDGE_HEIGHT_INVALID",
      message: `Ridge "${e.id}" height must be above base level (>0).`,
      roofId: r.id,
      ridgeId: e.id,
      path: `ridgeSegments[id=${e.id}].height`
    }), s.push(e));
  }
  for (const e of r.faces) {
    let g = !1;
    if (e.ridgeId && (r.ridgeSegments.find((p) => p.id === e.ridgeId) || (n.push({
      severity: "error",
      code: "ridge-not-found",
      message: `Face "${e.id}" references missing ridge "${e.ridgeId}".`,
      roofId: r.id,
      faceId: e.id
    }), g = !0)), e.kind === "ridgeSideSegment") {
      (!e.ridgeId || !d.has(e.ridgeId)) && (n.push({
        severity: "error",
        code: "FACE_RIDGE_MISSING",
        message: `Face "${e.id}" references unknown ridgeId.`,
        roofId: r.id,
        faceId: e.id,
        ridgeId: e.ridgeId,
        path: `faces[id=${e.id}].ridgeId`
      }), g = !0);
      const h = e.ridgeT0, p = e.ridgeT1;
      typeof h != "number" || typeof p != "number" ? (n.push({
        severity: "error",
        code: "FACE_TRANGE_MISSING",
        message: `Face "${e.id}" must define ridgeT0 and ridgeT1.`,
        roofId: r.id,
        faceId: e.id,
        path: `faces[id=${e.id}].ridgeT0/ridgeT1`
      }), g = !0) : ((h < 0 || h > 1) && (n.push({
        severity: "error",
        code: "ridgeT0-out-of-range",
        message: `Face "${e.id}" ridgeT0 must be between 0 and 1.`,
        roofId: r.id,
        faceId: e.id,
        ridgeId: e.ridgeId
      }), g = !0, t.push(e)), (p < 0 || p > 1) && (n.push({
        severity: "error",
        code: "ridgeT1-out-of-range",
        message: `Face "${e.id}" ridgeT1 must be between 0 and 1.`,
        roofId: r.id,
        faceId: e.id,
        ridgeId: e.ridgeId
      }), g = !0, t.push(e)), (h < 0 || h > 1 || p < 0 || p > 1) && (n.push({
        severity: "error",
        code: "FACE_TRANGE_BOUNDS",
        message: `Face "${e.id}" ridgeT values must be within [0,1].`,
        roofId: r.id,
        faceId: e.id,
        path: `faces[id=${e.id}].ridgeT0/ridgeT1`
      }), g = !0, t.push(e)), h >= p ? (n.push({
        severity: "error",
        code: "ridgeT-range-invalid",
        message: `Face "${e.id}" ridgeT0 must be less than ridgeT1.`,
        roofId: r.id,
        faceId: e.id,
        ridgeId: e.ridgeId
      }), g = !0, t.push(e), n.push({
        severity: "error",
        code: "FACE_TRANGE_ORDER",
        message: `Face "${e.id}" requires ridgeT0 < ridgeT1.`,
        roofId: r.id,
        faceId: e.id,
        path: `faces[id=${e.id}].ridgeT0/ridgeT1`
      }), g = !0, t.push(e)) : p - h < 0.02 && (i.push({
        severity: "warning",
        code: "FACE_TRANGE_TINY",
        message: `Face "${e.id}" has a very small ridge segment span (${(p - h).toFixed(3)}).`,
        roofId: r.id,
        faceId: e.id,
        path: `faces[id=${e.id}].ridgeT0/ridgeT1`
      }), t.push(e))), e.capEnd && i.push({
        severity: "warning",
        code: "FACE_CAPEND_UNUSED",
        message: `Face "${e.id}" defines capEnd but is ridgeSideSegment.`,
        roofId: r.id,
        faceId: e.id,
        path: `faces[id=${e.id}].capEnd`
      });
    } else e.kind === "hipCap" && e.capEnd && !e.ridgeId && e.region.type !== "ridgeCapTriangle" && (n.push({
      severity: "error",
      code: "FACE_CAPEND_CONTEXT",
      message: `Face "${e.id}" capEnd requires a ridgeSideSegment context.`,
      roofId: r.id,
      faceId: e.id,
      path: `faces[id=${e.id}].capEnd`
    }), g = !0);
    const u = Q(r, e);
    Array.isArray(u) && u.length > 0 && u.length < 4 && (n.push({
      severity: "error",
      code: "FACE_REGION_EMPTY",
      message: `Face "${e.id}" region clipping produced an empty/degenerate polygon.`,
      roofId: r.id,
      faceId: e.id,
      path: `faces[id=${e.id}].region`
    }), o.push({ faceId: e.id, polygon: u }), g = !0), g && a.push(e);
  }
  return {
    errors: n,
    warnings: i,
    debug: {
      invalidRidges: s,
      invalidFaces: a,
      suspiciousFaces: t,
      invalidFacePolygons: o
    }
  };
}
function ee(r) {
  let n;
  try {
    n = JSON.parse(r);
  } catch (t) {
    return {
      success: !1,
      parsedHouse: null,
      entries: [{ level: "error", message: `JSON parse error: ${t instanceof Error ? t.message : "Unable to parse JSON."}` }]
    };
  }
  const i = n, s = [];
  try {
    const t = G(
      i,
      {
        getLevels: (o) => o.levels,
        getLevelElevation: (o) => o.elevation,
        getLevelHeight: (o, l) => V(i.levels, l),
        getSlabThickness: (o) => {
          var l;
          return ((l = o.slab) == null ? void 0 : l.thickness) ?? null;
        },
        elevationConvention: "TOP_OF_SLAB",
        allowGroundSupport: !0
      },
      { mode: "report" }
    );
    for (const o of t.issues)
      s.push({
        level: o.severity === "error" ? "error" : "warn",
        message: o.message
      });
    J(i), L(i);
    for (const o of i.roofs ?? []) {
      if (o.type !== "multi-plane")
        continue;
      const l = Z(o);
      for (const d of l.errors)
        s.push({ level: "error", message: `Roof ${o.id}: ${d.message}` });
      for (const d of l.warnings)
        s.push({ level: "warn", message: `Roof ${o.id}: ${d.message}` });
    }
    W(i);
  } catch (t) {
    const o = t instanceof Error ? t.message : "Validation failed with an unknown error.";
    s.push({ level: "error", message: o });
  }
  s.length === 0 && s.push({ level: "info", message: "Validation successful." });
  const a = s.every((t) => t.level !== "error");
  return { success: a, entries: s, parsedHouse: a ? i : null };
}
function re({ initialJson: r, onApplyArchitecturalHouse: n }) {
  const [i, s] = S(r), [a, t] = S({
    success: !1,
    entries: [{ level: "info", message: "Edit JSON, then run Validate." }],
    parsedHouse: null
  });
  C(() => {
    s(r), t({
      success: !1,
      entries: [{ level: "info", message: "Source JSON changed. Validate to apply new edits." }],
      parsedHouse: null
    });
  }, [r]);
  const o = R(() => a.success && a.parsedHouse !== null, [a]);
  return /* @__PURE__ */ f("div", { style: { display: "grid", gridTemplateRows: "auto 1fr auto auto", gap: 12, minHeight: 0, height: "100%" }, children: [
    /* @__PURE__ */ c("h3", { style: { margin: 0 }, children: "JSON" }),
    /* @__PURE__ */ c(
      "textarea",
      {
        value: i,
        onChange: (d) => s(d.target.value),
        spellCheck: !1,
        style: {
          width: "100%",
          minHeight: 0,
          resize: "none",
          borderRadius: 10,
          border: "1px solid rgba(148, 163, 184, 0.45)",
          background: "rgba(2, 6, 23, 0.85)",
          color: "#e2e8f0",
          padding: 12,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.5
        }
      }
    ),
    /* @__PURE__ */ f("div", { style: { display: "flex", gap: 8 }, children: [
      /* @__PURE__ */ c(
        "button",
        {
          type: "button",
          onClick: () => {
            try {
              const d = JSON.parse(i);
              s(JSON.stringify(d, null, 2));
            } catch {
              t({
                success: !1,
                parsedHouse: null,
                entries: [{ level: "error", message: "Cannot format because JSON is invalid." }]
              });
            }
          },
          children: "Format"
        }
      ),
      /* @__PURE__ */ c("button", { type: "button", onClick: () => t(ee(i)), children: "Validate" }),
      /* @__PURE__ */ c("button", { type: "button", onClick: async () => {
        try {
          const d = JSON.parse(i), e = `export const architecturalHouse: ArchitecturalHouse = ${JSON.stringify(d, null, 2)};`;
          await navigator.clipboard.writeText(e), t({
            success: !0,
            parsedHouse: d,
            entries: [{ level: "info", message: "Copied as TypeScript for architecturalHouse.ts." }]
          });
        } catch (d) {
          const e = d instanceof Error ? d.message : "Unable to copy TypeScript snippet.";
          t({
            success: !1,
            parsedHouse: null,
            entries: [{ level: "error", message: e }]
          });
        }
      }, children: "Copy as TS" }),
      /* @__PURE__ */ c(
        "button",
        {
          type: "button",
          disabled: !o,
          onClick: () => {
            a.parsedHouse && (n(a.parsedHouse), t({
              success: !0,
              parsedHouse: a.parsedHouse,
              entries: [{ level: "info", message: "ArchitecturalHouse applied to scene." }]
            }));
          },
          children: "Apply"
        }
      )
    ] }),
    /* @__PURE__ */ c(
      "div",
      {
        style: {
          borderRadius: 10,
          border: "1px solid rgba(148, 163, 184, 0.35)",
          background: "rgba(2, 6, 23, 0.55)",
          padding: 10,
          minHeight: 80,
          maxHeight: 160,
          overflowY: "auto"
        },
        children: a.entries.map((d, e) => {
          const g = d.level === "error" ? "#fca5a5" : d.level === "warn" ? "#fde68a" : "#86efac", u = d.level === "error" ? "Error" : d.level === "warn" ? "Warn" : "OK";
          return /* @__PURE__ */ f("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }, children: [
            /* @__PURE__ */ c("span", { style: { color: g, fontWeight: 700, minWidth: 46 }, children: u }),
            /* @__PURE__ */ c("span", { children: d.message })
          ] }, `${d.message}-${e}`);
        })
      }
    )
  ] });
}
function z({
  label: r,
  checked: n,
  onChange: i
}) {
  return /* @__PURE__ */ f(
    "label",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(148, 163, 184, 0.45)",
        background: "rgba(15, 23, 42, 0.5)"
      },
      children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: n, onChange: (s) => i(s.target.checked) }),
        r
      ]
    }
  );
}
function te({
  showWireframe: r,
  onShowWireframeChange: n,
  showEdges: i,
  onShowEdgesChange: s,
  showOpeningEdges: a,
  onShowOpeningEdgesChange: t
}) {
  return /* @__PURE__ */ f("div", { children: [
    /* @__PURE__ */ c("h3", { style: { marginTop: 0, marginBottom: 12 }, children: "Rendering" }),
    /* @__PURE__ */ f("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
      /* @__PURE__ */ c(z, { label: "Wireframe mode", checked: r, onChange: n }),
      /* @__PURE__ */ c(z, { label: "Show structural edges", checked: i, onChange: s }),
      /* @__PURE__ */ c(z, { label: "Show opening/frame edges", checked: a, onChange: t })
    ] })
  ] });
}
function w({
  label: r,
  checked: n,
  onChange: i
}) {
  return /* @__PURE__ */ f(
    "label",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(148, 163, 184, 0.45)",
        background: "rgba(15, 23, 42, 0.5)"
      },
      children: [
        /* @__PURE__ */ c("input", { type: "checkbox", checked: n, onChange: (s) => i(s.target.checked) }),
        r
      ]
    }
  );
}
function ne({ visibility: r, onVisibilityChange: n }) {
  return /* @__PURE__ */ f("div", { children: [
    /* @__PURE__ */ c("h3", { style: { marginTop: 0, marginBottom: 12 }, children: "Visibility" }),
    /* @__PURE__ */ f("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
      /* @__PURE__ */ c(
        w,
        {
          label: "Show slabs",
          checked: r.showSlabs,
          onChange: (i) => n({ ...r, showSlabs: i })
        }
      ),
      /* @__PURE__ */ c(
        w,
        {
          label: "Show windows",
          checked: r.showWindows,
          onChange: (i) => n({ ...r, showWindows: i })
        }
      ),
      /* @__PURE__ */ c(
        w,
        {
          label: "Show walls",
          checked: r.showWalls,
          onChange: (i) => n({ ...r, showWalls: i })
        }
      ),
      /* @__PURE__ */ c(
        w,
        {
          label: "Show rooms",
          checked: r.showRooms,
          onChange: (i) => n({ ...r, showRooms: i })
        }
      ),
      /* @__PURE__ */ c(
        w,
        {
          label: "Show roof",
          checked: r.showRoof,
          onChange: (i) => n({ ...r, showRoof: i })
        }
      )
    ] })
  ] });
}
class ie extends M.Component {
  constructor() {
    super(...arguments);
    $(this, "state", {
      errorMessage: null
    });
  }
  static getDerivedStateFromError(i) {
    return { errorMessage: i instanceof Error ? i.message : "Unknown debug panel error." };
  }
  componentDidCatch() {
  }
  render() {
    return this.state.errorMessage ? /* @__PURE__ */ f(
      "div",
      {
        style: {
          borderRadius: 10,
          border: "1px solid rgba(252, 165, 165, 0.55)",
          background: "rgba(127, 29, 29, 0.2)",
          color: "#fecaca",
          padding: 12
        },
        children: [
          "Debug panel failed to render: ",
          this.state.errorMessage
        ]
      }
    ) : this.props.children;
  }
}
function le({
  isOpen: r,
  onClose: n,
  showWireframe: i,
  onShowWireframeChange: s,
  showEdges: a,
  onShowEdgesChange: t,
  showOpeningEdges: o,
  onShowOpeningEdgesChange: l,
  initialJson: d,
  onApplyArchitecturalHouse: e,
  onRunFloorplanValidation: g,
  showFloorplanOverlay: u,
  onShowFloorplanOverlayChange: h,
  showValidationIssues: p,
  onShowValidationIssuesChange: b,
  onClearValidationOutput: x,
  validationLog: H = [],
  visibility: N,
  onVisibilityChange: O
}) {
  const [y, A] = S("rendering");
  return C(() => {
    if (!r)
      return;
    const m = (I) => {
      I.key === "Escape" && n();
    };
    return window.addEventListener("keydown", m), () => window.removeEventListener("keydown", m);
  }, [r, n]), r ? /* @__PURE__ */ c(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        background: "rgba(2, 6, 23, 0.58)",
        display: "grid",
        placeItems: "center",
        zIndex: 2100
      },
      onClick: n,
      children: /* @__PURE__ */ f(
        "section",
        {
          onClick: (m) => m.stopPropagation(),
          style: {
            width: "80%",
            height: "80%",
            borderRadius: 16,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "rgba(15, 23, 42, 0.97)",
            color: "#f8fafc",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.45)",
            overflow: "hidden",
            display: "grid",
            gridTemplateRows: "auto auto 1fr"
          },
          children: [
            /* @__PURE__ */ c("header", { style: { padding: "14px 18px", borderBottom: "1px solid rgba(148, 163, 184, 0.3)", fontWeight: 700 }, children: "HouseViewer Debug Dashboard" }),
            /* @__PURE__ */ c("div", { style: { padding: "10px 14px", borderBottom: "1px solid rgba(148, 163, 184, 0.2)", display: "flex", gap: 8 }, children: [
              { id: "rendering", label: "Rendering" },
              { id: "floorplan-validation", label: "Floor Plan Validation" },
              { id: "visibility", label: "Visibility" },
              { id: "json", label: "JSON" }
            ].map((m) => {
              const I = m.id === y;
              return /* @__PURE__ */ c(
                "button",
                {
                  type: "button",
                  onClick: () => A(m.id),
                  style: {
                    borderRadius: 999,
                    border: `1px solid ${I ? "rgba(125, 211, 252, 0.8)" : "rgba(148, 163, 184, 0.45)"}`,
                    background: I ? "rgba(3, 105, 161, 0.4)" : "rgba(15, 23, 42, 0.6)",
                    color: "#f8fafc",
                    padding: "6px 14px",
                    cursor: "pointer"
                  },
                  children: m.label
                },
                m.id
              );
            }) }),
            /* @__PURE__ */ c("div", { style: { padding: 14, minHeight: 0 }, children: /* @__PURE__ */ c(ie, { children: y === "json" ? /* @__PURE__ */ c(re, { initialJson: d, onApplyArchitecturalHouse: e }) : y === "rendering" ? /* @__PURE__ */ c(
              te,
              {
                showWireframe: i,
                onShowWireframeChange: s,
                showEdges: a,
                onShowEdgesChange: t,
                showOpeningEdges: o,
                onShowOpeningEdgesChange: l
              }
            ) : y === "floorplan-validation" ? /* @__PURE__ */ c(
              B,
              {
                onRunFloorplanValidation: g,
                showFloorplanOverlay: u,
                onShowFloorplanOverlayChange: h,
                showValidationIssues: p,
                onShowValidationIssuesChange: b,
                onClearValidationOutput: x,
                validationLog: H
              }
            ) : /* @__PURE__ */ c(ne, { visibility: N, onVisibilityChange: O }) }) })
          ]
        }
      )
    }
  ) : null;
}
export {
  le as DebugDashboard
};
