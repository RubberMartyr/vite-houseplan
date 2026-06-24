import { jsx as t, jsxs as l } from "react/jsx-runtime";
import { useRef as a, useMemo as u } from "react";
import { H as f } from "./index-BfNhbY69.js";
function g(s) {
  return [
    `slabs: ${s.slabs.length} (rev ${s.revisions.slabs})`,
    `walls: ${s.walls.length} (rev ${s.revisions.walls})`,
    `openings: ${s.openings.length} (rev ${s.revisions.openings})`,
    `roofs: ${s.roofs.length} (rev ${s.revisions.roofs})`,
    `carports: ${s.carports.length} (rev ${s.revisions.carports})`
  ];
}
function v({ derived: s }) {
  const i = a(s.revisions), n = a({
    slabs: 0,
    walls: 0,
    openings: 0,
    roofs: 0,
    carports: 0
  }), c = u(() => {
    const o = ["slabs", "walls", "openings", "roofs", "carports"];
    let e = null;
    for (const r of o)
      i.current[r] !== s.revisions[r] && (n.current[r] += 1, e = r);
    return i.current = s.revisions, e;
  }, [s.revisions]), p = (o) => ({
    color: c === o ? "#34d399" : "white"
  });
  return /* @__PURE__ */ t(f, { prepend: !0, fullscreen: !0, style: { pointerEvents: "none" }, children: /* @__PURE__ */ l(
    "div",
    {
      style: {
        position: "absolute",
        top: 120,
        left: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999
      },
      children: [
        /* @__PURE__ */ t("div", { children: "Derived Graph" }),
        g(s).map((o, e) => {
          const r = ["slabs", "walls", "openings", "roofs", "carports"];
          return /* @__PURE__ */ t("div", { style: p(r[e]), children: o }, r[e]);
        }),
        /* @__PURE__ */ l("div", { children: [
          "last changed: ",
          c ?? "none"
        ] }),
        /* @__PURE__ */ l("div", { children: [
          "rebuilds: s=",
          n.current.slabs,
          " w=",
          n.current.walls,
          " o=",
          n.current.openings,
          " ",
          "r=",
          n.current.roofs,
          " c=",
          n.current.carports
        ] })
      ]
    }
  ) });
}
export {
  v as DerivedGraphOverlay,
  g as getDerivedGraphSummary
};
