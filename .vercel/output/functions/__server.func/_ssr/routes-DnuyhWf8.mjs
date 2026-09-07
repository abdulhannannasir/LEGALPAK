import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as FileSpreadsheet, i as FileText, r as Scale, t as Users } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DnuyhWf8.js
var import_jsx_runtime = require_jsx_runtime();
var CARDS = [
	{
		to: "/accounts",
		title: "Financial statements",
		body: "Classify audit vs SECP filing, 15- vs 30-day clocks, board resolution and directors’ report skeleton.",
		icon: FileSpreadsheet
	},
	{
		to: "/form-a",
		title: "Form A annual return",
		body: "Form A vs Form 24 vs no filing. AGM + 30 days. Transfers, officers, inactive Part III.",
		icon: FileText
	},
	{
		to: "/form-9",
		title: "Form 9 director change",
		body: "Old Form 29. Induction / cessation on eZfile, 15-day clock, minimum board, consent pack.",
		icon: Users
	},
	{
		to: "/contracts",
		title: "Contracts",
		body: "Service, employment, rent, bayana, NDA, partnership, JV, loan, PoA, shareholders — Contract Act 1872.",
		icon: Scale
	}
];
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-widest text-muted",
				children: "Pakistan corporate desk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display mt-1 text-3xl text-fg md:text-4xl",
				children: "LegalPak"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-muted",
				children: "Prepare SECP eZfile packs and commercial contracts. There is no public SECP filing API — you draft here, then PIN-sign on leap.secp.gov.pk."
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 sm:grid-cols-2",
			children: CARDS.map((c) => {
				const Icon = c.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: c.to,
					className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "size-5 text-accent",
							strokeWidth: 1.75
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 font-display text-xl",
							children: c.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: c.body
						})
					]
				}, c.to);
			})
		})]
	});
}
//#endregion
export { Home as component };
