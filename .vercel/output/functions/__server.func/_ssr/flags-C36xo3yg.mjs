import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/flags-C36xo3yg.js
var import_jsx_runtime = require_jsx_runtime();
function Flags({ flags }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2",
		children: flags.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: f.level === "high" ? "rounded-[var(--radius-md)] border-l-4 border-danger bg-flag-high p-3" : f.level === "med" ? "rounded-[var(--radius-md)] border-l-4 border-warn bg-flag-med p-3" : "rounded-[var(--radius-md)] border-l-4 border-success bg-flag-low p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: f.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: f.detail
			})]
		}, f.title))
	});
}
//#endregion
export { Flags as t };
