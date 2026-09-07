import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Select, n as Field, r as Input, t as Button } from "./field-PJ8SyVr5.mjs";
import { t as Flags } from "./flags-C36xo3yg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/accounts-4mc8BxE6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function addDays(iso, days) {
	if (!iso) return null;
	const d = /* @__PURE__ */ new Date(iso + "T00:00:00");
	if (Number.isNaN(d.getTime())) return null;
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}
function fmt(iso) {
	if (!iso) return "—";
	return (/* @__PURE__ */ new Date(iso + "T00:00:00")).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
}
function classifyAccounts(input) {
	const paid = Number(input.paidUp) || 0;
	const publicLike = input.publicLinked || input.kind === "public" || input.kind === "listed" || input.kind === "s42";
	const auditRequired = publicLike || paid > 1e6;
	const fileWithSecp = publicLike || paid > 1e7;
	const filingDaysAfterAgm = !fileWithSecp ? null : input.kind === "listed" ? 30 : 15;
	const directorsReport = publicLike || paid > 3e6;
	const caFirm = publicLike || paid > 1e7;
	const qcr = paid >= 2e8 || input.turnover >= 1e9 || input.employees >= 750;
	let bucket = "Small private — books only";
	if (fileWithSecp && input.kind === "listed") bucket = "Listed — audit + file in 30 days of AGM";
	else if (fileWithSecp) bucket = "Must file audited pack with SECP (15 days of AGM)";
	else if (auditRequired) bucket = "Audit and lay at AGM — SECP upload usually not required";
	else bucket = "Audit and SECP accounts filing generally not required";
	const notes = [];
	if (!auditRequired) notes.push("s. 223: private/SMC with paid-up ≤ Rs 1 million (and not public-linked) is exempt from statutory audit.");
	else notes.push("Statutory audit is required. Appoint a practising auditor; confirm at the AGM.");
	if (fileWithSecp) notes.push(`s. 233: file the signed FS + directors’ report + auditor’s report with the registrar within ${filingDaysAfterAgm} days of the AGM.`);
	else if (auditRequired) notes.push("s. 233 exemption: private company with paid-up ≤ Rs 10 million (not public-linked) generally does not file the audited pack with SECP — still prepare, audit, authenticate and lay at the AGM.");
	else notes.push("2020 amendments removed the old s. 234 unaudited filing for this band. Keep books (s. 220) and signed management accounts at the registered office.");
	if (directorsReport) notes.push("s. 227 directors’ report is required.");
	else notes.push("Directors’ report exempt (private, not a public subsidiary, paid-up ≤ Rs 3 million).");
	if (caFirm) notes.push("Auditor should be a practising chartered accountant / CA firm (paid-up > Rs 10 million or public-like).");
	if (qcr) notes.push("Large-sized company tests met — use a QCR-rated audit firm.");
	if (input.hasSubsidiary) notes.push("Prepare consolidated financial statements if you have a subsidiary or the framework requires it.");
	notes.push("Form A is a separate filing (30 days after AGM). FBR tax return is a third clock.");
	notes.push("File on eZfile (leap.secp.gov.pk) — Annual filing of company. Do not use legacy eServices for this.");
	const flags = [];
	if (input.kind === "listed" && !input.fyEnd) flags.push({
		level: "med",
		title: "Set financial year-end",
		detail: "Listed quarterly (s. 237) and annual clocks both hang off FY end."
	});
	if (auditRequired && paid <= 1e6 && publicLike) flags.push({
		level: "high",
		title: "Small capital but public-linked — audit still required",
		detail: "The Rs 1 million audit exemption does not apply to a public-interest company, a subsidiary of a public company, or a holding company of a public company."
	});
	if (auditRequired && !fileWithSecp) flags.push({
		level: "med",
		title: "Do not skip the audit just because SECP filing is exempt",
		detail: "Paid-up above Rs 1 million means audit + AGM even when the registrar does not take the PDF."
	});
	if (fileWithSecp && filingDaysAfterAgm === 15) flags.push({
		level: "high",
		title: "Accounts due in 15 days — Form A is 30",
		detail: "Unlisted s. 233 filers miss the accounts deadline while still thinking they have a month for Form A."
	});
	if (input.agmDate && input.fyEnd) {
		const fy = /* @__PURE__ */ new Date(input.fyEnd + "T00:00:00");
		const agm = /* @__PURE__ */ new Date(input.agmDate + "T00:00:00");
		const max = new Date(fy);
		max.setDate(max.getDate() + 120);
		if (agm > max) flags.push({
			level: "high",
			title: "AGM later than 120 days from FY end",
			detail: `s. 132: AGM must be held within 120 days of year-end (for 30 June that is 28 October, not 31 October). Your AGM is ${fmt(input.agmDate)}.`
		});
	}
	if (input.incorporationDate) {
		const inc = /* @__PURE__ */ new Date(input.incorporationDate + "T00:00:00");
		const first = new Date(inc);
		first.setMonth(first.getMonth() + 16);
		if (input.agmDate) {
			if (/* @__PURE__ */ new Date(input.agmDate + "T00:00:00") > first) flags.push({
				level: "high",
				title: "First AGM beyond 16 months of incorporation",
				detail: `First AGM due by ${fmt(first.toISOString().slice(0, 10))}.`
			});
		}
	}
	const agmDue = input.fyEnd ? addDays(input.fyEnd, 120) : null;
	const firstAgmDue = input.incorporationDate ? addDays(input.incorporationDate, 480) : null;
	let firstAgm = null;
	if (input.incorporationDate) {
		const d = /* @__PURE__ */ new Date(input.incorporationDate + "T00:00:00");
		d.setMonth(d.getMonth() + 16);
		firstAgm = d.toISOString().slice(0, 10);
	}
	const accountsDue = fileWithSecp && input.agmDate && filingDaysAfterAgm ? addDays(input.agmDate, filingDaysAfterAgm) : null;
	const formADue = input.agmDate ? addDays(input.agmDate, 30) : null;
	if (flags.length === 0) flags.push({
		level: "low",
		title: "Classifier complete",
		detail: "Have a Pakistani advocate or company secretary confirm the live eZfile process and any SECP notification changing the Rs 1m / Rs 10m bands."
	});
	return {
		auditRequired,
		fileWithSecp,
		filingDaysAfterAgm,
		directorsReport,
		caFirm,
		qcr,
		bucket,
		notes,
		flags,
		agmDue,
		accountsDue,
		formADue,
		firstAgmDue: firstAgm ?? firstAgmDue
	};
}
function formatDateLong(iso) {
	if (!iso) return "____________";
	const d = /* @__PURE__ */ new Date(iso + "T00:00:00");
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric"
	});
}
function pkr(n) {
	return "PKR " + Math.round(n).toLocaleString("en-PK");
}
function generateAccountsPack(input, advice) {
	const name = input.companyName || "[Company Name]";
	return `FINANCIAL STATEMENT FILING MEMORANDUM
(Companies Act, 2017 — ss. 223, 227, 232, 233 / 234)

Company: ${name}
CUIN: ${input.cuin || "[CUIN]"}
Type: ${input.kind.toUpperCase()}${input.publicLinked ? " (public-linked: PIC / public subsidiary / public holding)" : ""}
Paid-up capital: ${pkr(input.paidUp)}
Financial year ended: ${formatDateLong(input.fyEnd)}
AGM date: ${formatDateLong(input.agmDate)}
Incorporation: ${formatDateLong(input.incorporationDate)}

CLASSIFICATION
${advice.bucket}

- Statutory audit: ${advice.auditRequired ? "REQUIRED" : "Not required (s. 223 exemption — confirm public-linked status)"}
- File pack with SECP: ${advice.fileWithSecp ? `YES — within ${advice.filingDaysAfterAgm} days of AGM (s. 233)` : "Generally no (keep signed set at registered office)"}
- Directors’ report (s. 227): ${advice.directorsReport ? "REQUIRED" : "Exempt"}
- CA firm: ${advice.caFirm ? "Yes" : "Not mandated solely by the Rs 10 million test"}
- QCR-rated firm: ${advice.qcr ? "Yes (large-sized tests)" : "No"}
- Consolidated statements: ${input.hasSubsidiary ? "Consider / prepare" : "Not indicated"}

DEADLINES
- AGM (s. 132): within 120 days of FY end → ${formatDateLong(advice.agmDue || "")}
- First AGM: within 16 months of incorporation → ${formatDateLong(advice.firstAgmDue || "")}
- Accounts to registrar: ${advice.accountsDue ? formatDateLong(advice.accountsDue) : "Not a registrar filing for this bucket"}
- Form A (separate): ${advice.formADue ? formatDateLong(advice.formADue) : "30 days after AGM if Form A is due"}

AUTHENTICATION (s. 232)
The financial statements must be approved by the Board and signed by the Chief Executive and at least one Director${input.kind === "listed" ? ", and authenticated by the CFO" : ""}${input.kind === "smc" ? " (SMC: the sole director / CEO signs)" : ""}.
The auditor’s report must be dated on or after the board approval date.

PACK TO UPLOAD ON eZfile (if filing)
1. Statement of financial position
2. Statement of profit or loss (and OCI if applicable)
3. Statement of changes in equity
4. Statement of cash flows
5. Notes including accounting policies and comparatives
${advice.directorsReport ? "6. Directors’ report (s. 227)\n" : ""}${advice.auditRequired ? "7. Auditor’s report\n" : ""}8. Pattern of shareholding (public companies and private subsidiaries of public companies)

BOARD RESOLUTION (draft)

Resolved that the financial statements of ${name} for the year ended ${formatDateLong(input.fyEnd)}, together with ${advice.directorsReport ? "the directors’ report and " : ""}${advice.auditRequired ? "the auditor’s report, " : ""}be and are hereby approved, and that the Chief Executive and any one Director be authorised to sign the same for and on behalf of the Board, and that the same be laid before the members at the annual general meeting to be held on ${formatDateLong(input.agmDate)}.

${advice.fileWithSecp ? `Further resolved that the Company Secretary / authorised officer be directed to file the authenticated financial statements with the registrar through eZfile (leap.secp.gov.pk) within ${advice.filingDaysAfterAgm} days of the AGM.` : "Further resolved that the authenticated financial statements be kept at the registered office and circulated to members as required, noting that a registrar filing under s. 233 is not indicated for this company on the facts stated."}

DIRECTORS’ REPORT — SKELETON (s. 227)
${advice.directorsReport ? `The Directors present their report together with the audited financial statements of ${name} for the year ended ${formatDateLong(input.fyEnd)}.

1. Principal activities
2. Financial results (turnover, profit/(loss) after tax, EPS if applicable)
3. Dividend (or reasons for not declaring a dividend despite profits — listed)
4. Principal risks and uncertainties
5. Changes in the board during the year
6. Auditors — retiring auditors, being eligible, offer themselves for reappointment
7. Pattern of shareholding (if applicable)
8. Acknowledgement

On behalf of the Board
________________________
Chief Executive
Dated: ${formatDateLong(input.agmDate)}
` : "[Exempt — private company, not a public subsidiary, paid-up ≤ Rs 3 million.]"}

eZfile PATH
leap.secp.gov.pk → company dashboard → Annual filing of company → upload a single signed PDF.

This memorandum is a drafting aid only. It is not legal, audit or tax advice. Confirm live SECP fee, framework (IFRS / IFRS for SMEs / AFRS for SSEs) and any notification changing capital thresholds with a licensed Pakistani professional.
`;
}
var empty = {
	companyName: "",
	cuin: "",
	kind: "private",
	paidUp: 0,
	publicLinked: false,
	fyEnd: "",
	agmDate: "",
	incorporationDate: "",
	turnover: 0,
	employees: 0,
	hasSubsidiary: false
};
function AccountsPage() {
	const [form, setForm] = (0, import_react.useState)(empty);
	const [show, setShow] = (0, import_react.useState)(false);
	const advice = (0, import_react.useMemo)(() => classifyAccounts(form), [form]);
	const pack = (0, import_react.useMemo)(() => generateAccountsPack(form, advice), [form, advice]);
	function set(key, value) {
		setForm((f) => ({
			...f,
			[key]: value
		}));
	}
	function sample() {
		setForm({
			companyName: "Horizon Manufacturing (Pvt) Ltd",
			cuin: "0071234",
			kind: "private",
			paidUp: 15e6,
			publicLinked: false,
			fyEnd: "2026-06-30",
			agmDate: "2026-10-20",
			incorporationDate: "2022-04-12",
			turnover: 8e7,
			employees: 42,
			hasSubsidiary: false
		});
		setShow(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-widest text-muted",
					children: "s. 223 · 232 · 233"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "Financial statement filing"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm text-muted",
					children: "Classifies audit, directors’ report and whether the pack must go to the registrar. Generates a board resolution and eZfile memo. Does not submit to SECP."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Company name",
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
							label: "Company type",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.kind,
								onChange: (e) => set("kind", e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "smc",
										children: "Single member company"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "private",
										children: "Private limited"
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
										value: "s42",
										children: "Section 42 / NPO"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Paid-up capital (PKR)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								value: form.paidUp || "",
								onChange: (e) => set("paidUp", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Financial year end",
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Incorporation date",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: form.incorporationDate,
								onChange: (e) => set("incorporationDate", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Turnover (PKR, last year)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								value: form.turnover || "",
								onChange: (e) => set("turnover", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Employees (average)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								value: form.employees || "",
								onChange: (e) => set("employees", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex min-h-11 items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: form.publicLinked,
								onChange: (e) => set("publicLinked", e.target.checked)
							}), "Public-linked (PIC, public subsidiary, or holding of a public company)"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex min-h-11 items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: form.hasSubsidiary,
								onChange: (e) => set("hasSubsidiary", e.target.checked)
							}), "Has a subsidiary (consolidation)"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => setShow(true),
						children: "Classify and generate pack"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						onClick: sample,
						children: "Load sample (Rs 15m Pvt Ltd)"
					})]
				})]
			}),
			show && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: advice.bucket
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 grid gap-3 sm:grid-cols-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Audit"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: advice.auditRequired ? "Required" : "Exempt"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "File with SECP"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: advice.fileWithSecp ? `Yes — ${advice.filingDaysAfterAgm} days after AGM` : "Generally no"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Directors’ report"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: advice.directorsReport ? "Required" : "Exempt"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "AGM due (120 days)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: advice.agmDue ?? "—"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Accounts due"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: advice.accountsDue ?? "Not a registrar filing"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Form A due"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: advice.formADue ?? "—"
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 list-disc space-y-1 pl-5 text-sm text-muted",
							children: advice.notes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: n }, n))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "mt-4 inline-flex min-h-11 items-center text-sm font-medium text-accent underline",
							href: "https://leap.secp.gov.pk/",
							target: "_blank",
							rel: "noreferrer",
							children: "Open eZfile"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flags, { flags: advice.flags }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => navigator.clipboard.writeText(pack),
							children: "Copy memorandum"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							onClick: () => {
								const blob = new Blob([pack], { type: "text/plain" });
								const a = document.createElement("a");
								a.href = URL.createObjectURL(blob);
								a.download = "secp-financial-statements-memo.txt";
								a.click();
							},
							children: "Download .txt"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "max-h-[70vh] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed",
						children: pack
					})]
				})
			] })
		]
	});
}
//#endregion
export { AccountsPage as component };
