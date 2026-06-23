import { jsx as c } from "react/jsx-runtime";
import { useState as h, useRef as g, useEffect as w, useMemo as p } from "react";
import { j as v, H as M, s as R } from "./index-9DageTfe.js";
function F(e) {
  const i = [
    "DerivedHouse",
    `slabs: ${e.derived.slabs}`,
    `walls: ${e.derived.walls}`,
    `roofs: ${e.derived.roofs}`,
    `carports: ${e.derived.carports}`,
    `openings: ${e.derived.openings}`,
    "",
    "Revisions",
    `slabsRev: ${e.revisions.slabs}`,
    `wallsRev: ${e.revisions.walls}`,
    `roofsRev: ${e.revisions.roofs}`,
    `openingsRev: ${e.revisions.openings}`,
    "",
    "Rebuild Counters",
    `wallRebuildCount: ${e.rebuilds.walls}`,
    `roofRebuildCount: ${e.rebuilds.roofs}`,
    `slabRebuildCount: ${e.rebuilds.slabs}`,
    "",
    "Cache",
    `walls: ${e.cache.wallHits} hits / ${e.cache.wallMisses} misses`,
    `roofs: ${e.cache.roofHits} hits / ${e.cache.roofMisses} misses`,
    `slabs: ${e.cache.slabHits} hits / ${e.cache.slabMisses} misses`,
    "",
    "Build Times",
    `walls: ${e.timingsMs.wallBuild.toFixed(1)}ms`,
    `roofs: ${e.timingsMs.roofBuild.toFixed(1)}ms`,
    `slabs: ${e.timingsMs.slabBuild.toFixed(1)}ms`,
    "",
    "Triangles",
    `walls: ${e.geometry.wallTriangles}`,
    `roofs: ${e.geometry.roofTriangles}`,
    `slabs: ${e.geometry.slabTriangles}`,
    `total: ${e.geometry.totalTriangles}`,
    "",
    "Geometry Memory",
    `${(e.geometry.estimatedMemoryMB ?? 0).toFixed(2)} MB`
  ];
  return e.roof && i.push(
    "",
    "Roof Diagnostics",
    `seamBases: ${e.roof.seamBases}`,
    `roofRegions: ${e.roof.roofRegions}`,
    `hipCaps: ${e.roof.hipCaps}`,
    `ridgeSegments: ${e.roof.ridgeSegments}`
  ), e.walls && i.push(
    "",
    "Wall Diagnostics",
    `shellSegments: ${e.walls.shellSegments}`,
    `facadePanels: ${e.walls.facadePanels}`,
    `openingsCut: ${e.walls.openingsCut}`
  ), i.push("", "Runtime", `lastChanged: ${e.runtime.lastChangedSubsystem}`), typeof e.runtime.fps == "number" && i.push(`fps: ${e.runtime.fps.toFixed(0)}`), typeof e.runtime.frameMs == "number" && i.push(`frame: ${e.runtime.frameMs.toFixed(1)}ms`), i;
}
function x({ derived: e }) {
  const [i, t] = h(0), o = g([]), l = g(null);
  w(() => {
    let s = 0;
    const m = (u) => {
      const f = l.current;
      if (f !== null) {
        const r = u - f;
        o.current.push(r), o.current.length > 30 && o.current.shift();
        const n = o.current.reduce(($, b) => $ + b, 0) / o.current.length;
        R({
          frameMs: n,
          fps: n > 0 ? 1e3 / n : void 0
        });
      }
      l.current = u, t((r) => r + 1), s = requestAnimationFrame(m);
    };
    return s = requestAnimationFrame(m), () => cancelAnimationFrame(s);
  }, []);
  const a = p(
    () => v(e),
    [
      e,
      e.revisions.openings,
      e.revisions.roofs,
      e.revisions.slabs,
      e.revisions.walls,
      i
    ]
  ), d = p(() => F(a), [a]);
  return /* @__PURE__ */ c(M, { prepend: !0, children: /* @__PURE__ */ c(
    "div",
    {
      style: {
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        fontFamily: "monospace",
        pointerEvents: "none",
        whiteSpace: "pre"
      },
      children: d.join(`
`)
    }
  ) });
}
export {
  x as EngineDebugHUD,
  F as buildEngineDebugHudLines
};
