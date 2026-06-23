import { jsx as o } from "react/jsx-runtime";
function s({ isOpen: e, onClick: t }) {
  return /* @__PURE__ */ o(
    "button",
    {
      type: "button",
      onClick: t,
      "aria-label": "Toggle debug dashboard",
      title: "Debug dashboard",
      style: {
        position: "absolute",
        top: 20,
        right: 20,
        width: 58,
        height: 58,
        borderRadius: "50%",
        border: `1px solid ${e ? "rgba(191, 219, 254, 0.85)" : "rgba(191, 219, 254, 0.35)"}`,
        background: e ? "rgba(30, 58, 138, 0.95)" : "rgba(17, 24, 39, 0.9)",
        color: "#f9fafb",
        fontSize: 24,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35)",
        zIndex: 2e3,
        transition: "transform 150ms ease, filter 150ms ease, border-color 150ms ease"
      },
      onMouseEnter: (r) => {
        r.currentTarget.style.transform = "scale(1.07)", r.currentTarget.style.filter = "brightness(1.12)";
      },
      onMouseLeave: (r) => {
        r.currentTarget.style.transform = "scale(1)", r.currentTarget.style.filter = "brightness(1)";
      },
      children: "🛠"
    }
  );
}
export {
  s as DebugButton
};
