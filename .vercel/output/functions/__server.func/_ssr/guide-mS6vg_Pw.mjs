import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/guide-mS6vg_Pw.js
var import_jsx_runtime = require_jsx_runtime();
function GuidePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "When and where"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-2xl text-sm text-muted",
				children: "eZfile (leap.secp.gov.pk) is the live channel for incorporation and most returns. Legacy eServices remains for charges, foreign companies, easy exit and winding-up. There is no public filing API."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[640px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "border-b border-border text-xs uppercase tracking-wide text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3",
								children: "Event"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3",
								children: "Instrument"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3",
								children: "Deadline"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3",
								children: "Portal"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: [
						[
							"Director / officer change",
							"Form 9 (old 29)",
							"15 days",
							"eZfile"
						],
						[
							"Annual return",
							"Form A or Form 24",
							"30 days after AGM",
							"eZfile"
						],
						[
							"Audited FS (s. 233 filers)",
							"Signed PDF pack",
							"15 days after AGM (listed: 30)",
							"eZfile"
						],
						[
							"AGM",
							"s. 132",
							"120 days from FY end; first AGM 16 months",
							"—"
						],
						[
							"UBO",
							"Form 19",
							"With annual return / 30 days after year-end",
							"eZfile"
						],
						[
							"Share allotment",
							"Form 3",
							"45 days",
							"eZfile"
						],
						[
							"Registered office",
							"Form 21",
							"15 days",
							"eZfile"
						],
						[
							"Charge on assets",
							"Form 10",
							"30 days",
							"eServices"
						]
					].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "border-b border-border last:border-0",
						children: row.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-3",
							children: c
						}, c))
					}, row[0])) })]
				})
			})
		]
	});
}
//#endregion
export { GuidePage as component };
