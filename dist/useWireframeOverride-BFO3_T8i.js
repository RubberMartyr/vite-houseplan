import { useRef as n, useEffect as u } from "react";
import { u as o, M as s } from "./index-BfNhbY69.js";
function f({ enabled: t }) {
  const { scene: r } = o(), e = n(null);
  return u(() => {
    if (!t)
      return;
    e.current = r.overrideMaterial;
    const i = new s({ wireframe: !0, color: 16777215 });
    return r.overrideMaterial = i, () => {
      i.dispose(), r.overrideMaterial = e.current, e.current = null;
    };
  }, [t, r]), u(() => {
    t || (r.overrideMaterial = e.current, e.current = null);
  }, [t, r]), null;
}
export {
  f as WireframeOverride
};
