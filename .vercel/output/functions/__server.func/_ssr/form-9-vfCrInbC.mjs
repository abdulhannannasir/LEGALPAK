import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Select, n as Field, r as Input, t as Button } from "./field-PJ8SyVr5.mjs";
import { t as Flags } from "./flags-C36xo3yg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/form-9-vfCrInbC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function form9Advice(input) {
	const min = input.kind === "smc" ? 1 : input.kind === "public" ? 3 : 2;
	let after = input.currentDirectors;
	if (input.event === "induct") after += 1;
	if (input.event === "cease") after -= 1;
	const belowMin = after < min;
	const due = input.effectiveDate ? (() => {
		const d = /* @__PURE__ */ new Date(input.effectiveDate + "T00:00:00");
		d.setDate(d.getDate() + 15);
		return d.toISOString().slice(0, 10);
	})() : null;
	const flags = [];
	if (belowMin) flags.push({
		level: "high",
		title: "Board would fall below statutory minimum",
		detail: `Minimum directors: ${min}. File cessation and induction in the same eZfile process.`
	});
	if (input.modeIn === "Appointed" && (input.event === "induct" || input.event === "replace")) flags.push({
		level: "med",
		title: "Check mode of appointment",
		detail: "Use Elected / Re-elected for AGM elections. “Appointed” is for casual vacancy / additional director."
	});
	if (!input.incomingCnic && (input.event === "induct" || input.event === "replace")) flags.push({
		level: "high",
		title: "Incoming person needs CNIC and an eZfile account",
		detail: "eZfile notifies them when they are added. Consent (old Form 28) is still required in substance."
	});
	if (flags.length === 0) flags.push({
		level: "low",
		title: "Pack looks structurally complete",
		detail: "File on eZfile: Induction, Cessation and change in particulars of directors and officers (Form 9). Market still says Form 29."
	});
	const pack = `FORM 9 / DIRECTOR CHANGE PACK
(Companies Regulations 2024 — replaces Form 29 + Form 28)
eZfile process: Induction, Cessation and change in particulars of directors and officers

Company: ${input.companyName || "[Company]"}
CUIN: ${input.cuin || "[CUIN]"}
Event: ${input.event}
Effective date: ${input.effectiveDate || "[date]"}  → file by ${due || "[date + 15 days]"}
Current board: ${input.currentDirectors}  |  Minimum: ${min}  |  After this event: ${after}

${input.event !== "cease" && input.event !== "particulars" ? `INCOMING
Name: ${input.incomingName}
CNIC: ${input.incomingCnic}
Designation: ${input.designation}
Mode: ${input.modeIn}
Attachments: consent to act, CNIC, board/members resolution
` : ""}${input.event === "cease" || input.event === "replace" ? `OUTGOING
Name: ${input.outgoingName}
CNIC: ${input.outgoingCnic}
Mode: ${input.modeOut}
Attachments: resignation letter or members’ removal resolution
` : ""}
BOARD RESOLUTION (draft)
Resolved that ${input.event === "cease" || input.event === "replace" ? `the resignation/cessation of ${input.outgoingName || "[outgoing]"} as ${input.designation} be accepted with effect from ${input.effectiveDate || "[date]"}` : ""}${input.event === "replace" ? ", and that " : ""}${input.event === "induct" || input.event === "replace" ? `${input.incomingName || "[incoming]"} be appointed/elected as ${input.designation} with effect from ${input.effectiveDate || "[date]"}, having consented to act and confirmed they are not disqualified under ss. 153–156 of the Companies Act, 2017` : ""}.

Further resolved that Form 9 be filed on eZfile within 15 days.

CONSENT TO ACT (draft)
I, ${input.incomingName || "[name]"}, CNIC ${input.incomingCnic || "[CNIC]"}, hereby consent to act as ${input.designation} of ${input.companyName || "[Company]"} and confirm that I am not ineligible under the Companies Act, 2017.

Open: https://leap.secp.gov.pk/
`;
	return {
		min,
		after,
		belowMin,
		due,
		flags,
		pack
	};
}
function Form9Page() {
	const [form, setForm] = (0, import_react.useState)({
		companyName: "",
		cuin: "",
		kind: "private",
		currentDirectors: 2,
		event: "replace",
		incomingName: "",
		incomingCnic: "",
		outgoingName: "",
		outgoingCnic: "",
		modeIn: "Appointed",
		modeOut: "Resigned",
		effectiveDate: "",
		designation: "Director"
	});
	const [show, setShow] = (0, import_react.useState)(false);
	const advice = (0, import_react.useMemo)(() => form9Advice(form), [form]);
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
					children: "Form 9 · old Form 29"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "Director and officer change"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm text-muted",
					children: "15 days from the effective date. eZfile process: Induction, Cessation and change in particulars. Consent is still required even though Form 28 was merged."
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
							label: "CUIN",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.cuin,
								onChange: (e) => set("cuin", e.target.value)
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
										children: "SMC (min 1)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "private",
										children: "Private (min 2)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "public",
										children: "Public (min 3)"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Directors now",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								value: form.currentDirectors,
								onChange: (e) => set("currentDirectors", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Event",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.event,
								onChange: (e) => set("event", e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "induct",
										children: "Induct"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "cease",
										children: "Cease"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "replace",
										children: "Replace (same process)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "particulars",
										children: "Change particulars only"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Designation",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.designation,
								onChange: (e) => set("designation", e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Director" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Chief Executive" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "CFO" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Company Secretary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Auditor" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Legal Adviser" })
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Effective date",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: form.effectiveDate,
								onChange: (e) => set("effectiveDate", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "File by (auto)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								readOnly: true,
								value: advice.due ?? ""
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Incoming name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.incomingName,
								onChange: (e) => set("incomingName", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Incoming CNIC",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.incomingCnic,
								onChange: (e) => set("incomingCnic", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Mode in",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.modeIn,
								onChange: (e) => set("modeIn", e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Appointed" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Elected" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Re-elected" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Re-appointed" })
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Outgoing name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.outgoingName,
								onChange: (e) => set("outgoingName", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Outgoing CNIC",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.outgoingCnic,
								onChange: (e) => set("outgoingCnic", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Mode out",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.modeOut,
								onChange: (e) => set("modeOut", e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Resigned" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Retired" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Removed" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Died" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Disqualified" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Ceased" })
								]
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => setShow(true),
						children: "Generate Form 9 pack"
					})
				})]
			}),
			show && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flags, { flags: advice.flags }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] border border-border bg-surface p-5 font-mono text-xs",
				children: advice.pack
			})] })
		]
	});
}
//#endregion
export { Form9Page as component };
