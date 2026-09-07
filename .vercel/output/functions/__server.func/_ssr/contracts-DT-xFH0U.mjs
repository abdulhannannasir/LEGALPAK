import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Textarea, i as Select, n as Field, r as Input, t as Button } from "./field-PJ8SyVr5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contracts-DT-xFH0U.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CONTRACT_TYPES = [
	{
		id: "service",
		title: "Service agreement"
	},
	{
		id: "employment",
		title: "Employment contract"
	},
	{
		id: "rent",
		title: "Rent / lease"
	},
	{
		id: "sale",
		title: "Agreement to sell (bayana)"
	},
	{
		id: "nda",
		title: "NDA"
	}
];
function generateContract(id, a, b, city, extra) {
	const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric"
	});
	const parties = `${a || "[Party A]"} and ${b || "[Party B]"}`;
	const law = `This agreement is governed by the laws of the Islamic Republic of Pakistan. Courts at ${city || "[City]"} shall have jurisdiction.`;
	const wit = `IN WITNESS WHEREOF the parties have signed at ${city || "[City]"} on ${date}.\n\n_________________          _________________\n${a || "Party A"}                         ${b || "Party B"}\n\nWITNESSES:\n1. _________________     2. _________________\n`;
	if (id === "employment") return `EMPLOYMENT CONTRACT\n\nThis contract is made at ${city || "[City]"} on ${date} between ${a || "[Employer]"} (Employer) and ${b || "[Employee]"} (Employee).\n\n1. Position and duties: ${extra || "[role]"}\n2. Remuneration as agreed in writing.\n3. Probation and notice as required by applicable provincial labour law.\n4. Confidentiality of Employer information.\n5. ${law}\n\n${wit}\nNOTE: Written contracts are required for workers. Stamp paper recommended.`;
	if (id === "rent") return `RENT AGREEMENT\n\nLandlord ${a || "[Landlord]"} lets to Tenant ${b || "[Tenant]"} the premises: ${extra || "[property]"}.\n\nTerm, rent and deposit as agreed. Tenant shall not sub-let without consent.\nLeases exceeding one year generally require registration under the Registration Act, 1908.\n${law}\n\n${wit}`;
	if (id === "sale") return `AGREEMENT TO SELL (BAYANA)\n\nSeller ${a || "[Seller]"} agrees to sell and Buyer ${b || "[Buyer]"} agrees to purchase:\n${extra || "[property description]"}\n\nThis is not a conveyance. Title passes only on execution and registration of the Sale Deed. Stamp duty and registration of the deed are mandatory for immovable property.\n${law}\n\n${wit}`;
	if (id === "nda") return `NON-DISCLOSURE AGREEMENT\n\nBetween ${parties}.\nPurpose: ${extra || "[purpose]"}.\nThe Receiving Party shall use confidential information solely for the Purpose and protect it with reasonable care.\n${law}\n\n${wit}`;
	return `SERVICE AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Provider]"} (Service Provider) and ${b || "[Client]"} (Client).\n\n1. Services: ${extra || "[scope]"}\n2. Fees as agreed. Consideration is a condition of validity under the Contract Act, 1872.\n3. Confidentiality and IP as agreed.\n4. Either party may terminate on 30 days' written notice.\n5. ${law}\n\n${wit}\nExecute on non-judicial stamp paper of appropriate provincial value.`;
}
function ContractsPage() {
	const [id, setId] = (0, import_react.useState)("service");
	const [a, setA] = (0, import_react.useState)("");
	const [b, setB] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("Islamabad");
	const [extra, setExtra] = (0, import_react.useState)("");
	const [out, setOut] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-widest text-muted",
					children: "Contract Act 1872"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: "Agreements"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm text-muted",
					children: "Formal English drafts with governing law of Pakistan, jurisdiction and witnesses. Have an advocate stamp and review before execution."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Type",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
								value: id,
								onChange: (e) => setId(e.target.value),
								children: CONTRACT_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: t.id,
									children: t.title
								}, t.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "City / jurisdiction",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: city,
								onChange: (e) => setCity(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Party A",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: a,
								onChange: (e) => setA(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Party B",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: b,
								onChange: (e) => setB(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Scope / property / role",
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: extra,
								onChange: (e) => setExtra(e.target.value)
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => setOut(generateContract(id, a, b, city, extra)),
						children: "Generate"
					})
				})]
			}),
			out && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] border border-border bg-surface p-5 font-mono text-xs",
				children: out
			})
		]
	});
}
//#endregion
export { ContractsPage as component };
