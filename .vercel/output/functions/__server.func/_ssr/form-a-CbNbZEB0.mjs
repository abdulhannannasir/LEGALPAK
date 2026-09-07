import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Select, n as Field, r as Input, t as Button } from "./field-PJ8SyVr5.mjs";
import { t as Flags } from "./flags-C36xo3yg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/form-a-CbNbZEB0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formAAdvice(input) {
	const noChangeSmall = !input.changed && (input.kind === "smc" || input.kind === "private" && input.paidUp <= 3e6);
	const form24 = !input.changed && !noChangeSmall && input.kind !== "inactive" && (input.kind === "public" || input.kind === "listed" || input.paidUp > 3e6);
	let which = "Form A";
	if (noChangeSmall) which = "No annual return";
	else if (form24) which = "Form 24";
	if (input.kind === "inactive") which = "Form A";
	const due = input.agmDate ? (() => {
		const d = /* @__PURE__ */ new Date(input.agmDate + "T00:00:00");
		d.setDate(d.getDate() + 30);
		return d.toISOString().slice(0, 10);
	})() : null;
	const flags = [];
	if (input.changed && noChangeSmall) {}
	if (which === "No annual return") flags.push({
		level: "med",
		title: "No Form A this year only if nothing changed",
		detail: "SMC or private paid-up ≤ Rs 3 million. If officers or members changed, file Form A (and Form 9 for officers)."
	});
	if (input.changed) flags.push({
		level: "med",
		title: "Officer change is not covered by Form A alone",
		detail: "File Form 9 within 15 days of the AGM/appointment. Use Elected/Re-elected for directors chosen at the AGM."
	});
	flags.push({
		level: "low",
		title: "UBO / Form 19",
		detail: "File beneficial ownership with the annual filing journey, or within 30 days after calendar year-end if no return is due."
	});
	const pack = `FORM A / ANNUAL RETURN MEMORANDUM
s. 130 Companies Act 2017 · Companies Regulations 2024

Company: ${input.companyName || "[Company]"}
Type: ${input.kind}
Paid-up: PKR ${input.paidUp.toLocaleString("en-PK")}
Particulars changed since last return: ${input.changed ? "Yes" : "No"}

FILE: ${which}
Due: ${due || "30 days after AGM (or 30 January if no AGM — made up to 31 December)"}
AGM: ${input.agmDate || "[date]"}  |  FY end: ${input.fyEnd || "[date]"}

eZfile: Annual filing of company (Form A / Form 24 + UBO).

Part I — CUIN, name, active/inactive, challan
Part II (active) — AGM date, office, contacts (WhatsApp mobile), authorised & paid-up capital, officers, directors, members, transfers since last return, ≥25% holdings and holdings on behalf of others
Part III (inactive) — correspondence, directors/members, inactive confirmation

Form A is not the financial statements and not the FBR return.
`;
	return {
		which,
		due,
		flags,
		pack
	};
}
function FormAPage() {
	const [form, setForm] = (0, import_react.useState)({
		companyName: "",
		kind: "private",
		paidUp: 1e7,
		changed: true,
		agmDate: "",
		fyEnd: ""
	});
	const [show, setShow] = (0, import_react.useState)(false);
	const advice = (0, import_react.useMemo)(() => formAAdvice(form), [form]);
	function set(k, v) {
		setForm((f) => ({
			...f,
			[k]: v
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-widest text-muted",
					children: "s. 130 · Form A / Form 24"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "Annual return"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm text-muted",
					children: "Snapshot of officers, members and capital. Not the accounts. File within 30 days of the AGM."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Company",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.companyName,
								onChange: (e) => set("companyName", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Type",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.kind,
								onChange: (e) => set("kind", e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "smc",
										children: "SMC"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "private",
										children: "Private"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "public",
										children: "Public unlisted"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "listed",
										children: "Listed"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "inactive",
										children: "Inactive"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Paid-up (PKR)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: form.paidUp || "",
								onChange: (e) => set("paidUp", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "FY end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: form.fyEnd,
								onChange: (e) => set("fyEnd", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "AGM date",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: form.agmDate,
								onChange: (e) => set("agmDate", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex min-h-11 items-center gap-2 text-sm sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: form.changed,
								onChange: (e) => set("changed", e.target.checked)
							}), "Particulars changed since last return (officers, members, capital, address)"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => setShow(true),
						children: "Decide Form A / Form 24"
					})
				})]
			}),
			show && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-wide text-muted",
							children: "File"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl",
							children: advice.which
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: ["Due ", advice.due ?? "30 days after AGM"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flags, { flags: advice.flags }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] border border-border bg-surface p-5 font-mono text-xs",
					children: advice.pack
				})
			] })
		]
	});
}
//#endregion
export { FormAPage as component };
