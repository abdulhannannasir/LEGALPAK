import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn } from "./router-ChlilqZM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/field-PJ8SyVr5.js
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150 disabled:opacity-50 min-h-11 px-4", {
	variants: { variant: {
		primary: "bg-primary text-primary-fg hover:bg-accent",
		secondary: "border border-primary text-primary bg-surface hover:bg-bg",
		ghost: "border border-border text-muted bg-transparent hover:bg-bg"
	} },
	defaultVariants: { variant: "primary" }
});
function Button({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({ variant }), className),
		...props
	});
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: cn("flex flex-col gap-1.5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-medium uppercase tracking-wide text-muted",
			children: label
		}), children]
	});
}
var control = "w-full min-h-11 rounded-[var(--radius-sm)] border border-border bg-bg px-3 text-sm text-fg outline-none focus:border-accent";
function Input(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn(control, props.className),
		...props
	});
}
function Select(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: cn(control, props.className),
		...props
	});
}
function Textarea(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn(control, "min-h-28 py-2", props.className),
		...props
	});
}
//#endregion
export { Textarea as a, Select as i, Field as n, Input as r, Button as t };
