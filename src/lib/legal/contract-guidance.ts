import { CLAUSE_MODULES, clauseById, recommendedClauseIds } from "./clauses.ts";
import { contractType, type ContractTypeId } from "./contracts.ts";

export type ContractFlag = { level: "high" | "med" | "low"; title: string; detail: string };

export type ContractQuestionnaireInput = {
  a: string;
  b: string;
  city: string;
  extra: string;
  clauses: string[];
};

/**
 * Static, type-specific legal/practical guidance. Every line here restates —
 * in structured form, for the Risk Flags panel — a hedge or note that
 * `generateContract` (contracts.ts) already prints in that same type's draft
 * text. Nothing here introduces a statute, section number or claim that
 * isn't already in the corresponding template; this is the same accurate
 * content, surfaced as a scannable flag instead of only inline prose.
 */
const STATIC_GUIDANCE: Partial<Record<ContractTypeId, ContractFlag[]>> = {
  employment: [
    {
      level: "med",
      title: "Written contract & stamp paper",
      detail:
        "Written employment contracts are required for workers — execute this on non-judicial stamp paper of the appropriate value.",
    },
  ],
  rent: [
    {
      level: "med",
      title: "Registration above one year",
      detail: "Leases exceeding one year generally require registration under the Registration Act, 1908.",
    },
  ],
  tenancy: [
    {
      level: "med",
      title: "Registration above one year",
      detail:
        "A tenancy exceeding one year, or reserving a yearly rent, generally requires registration under the Registration Act, 1908.",
    },
    {
      level: "low",
      title: "Provincial rent law varies",
      detail:
        "Eviction and rent-increase procedure may be governed by the rent-restriction/rented-premises law of the province where the premises are located — confirm the specific statute and forum (Rent Controller) before relying on this draft.",
    },
  ],
  sale: [
    {
      level: "high",
      title: "Not a conveyance",
      detail:
        "A bayana agreement is not a conveyance — title only passes on execution and registration of the Sale Deed. Stamp duty and registration are mandatory for immovable property.",
    },
  ],
  partnership: [
    {
      level: "med",
      title: "Register the firm",
      detail:
        "Registration with the Registrar of Firms is recommended — an unregistered firm cannot sue a third party to enforce a contract (Partnership Act, 1932, s. 69).",
    },
  ],
  jv: [
    {
      level: "low",
      title: "Not a partnership by default",
      detail:
        "This structure does not create a partnership under the Partnership Act, 1932 unless the parties expressly elect to register as a firm.",
    },
  ],
  loan: [
    {
      level: "high",
      title: "Interest / Shariah compliance",
      detail:
        "If interest is charged, structure it to be Shariah-compliant / markup-based per the Lender's practice, or state clearly that the loan is interest-free.",
    },
    {
      level: "med",
      title: "Cheques given as security",
      detail: "A cheque given as security for repayment remains subject to Section 489-F PPC if dishonoured.",
    },
  ],
  poa: [
    {
      level: "high",
      title: "Registration for immovable property",
      detail:
        "A Power of Attorney covering immovable property should be attested and, where it authorises sale/transfer, registered under the Registration Act, 1908.",
    },
  ],
  shareholders: [
    {
      level: "med",
      title: "Doesn't override the Articles",
      detail:
        "This agreement is supplemental to, and does not override, the Companies Act, 2017 or the Company's Articles of Association — amend the Articles to bind third parties where needed.",
    },
  ],
  vendor: [
    {
      level: "low",
      title: "Sale of Goods Act implied terms",
      detail:
        "Where this agreement involves the sale of goods, the Sale of Goods Act, 1930 implies conditions and warranties (title, quality, fitness) unless expressly varied in writing.",
    },
  ],
  distribution: [
    {
      level: "low",
      title: "Sale of Goods Act implied terms",
      detail: "The underlying sale of goods between the parties is governed by the Sale of Goods Act, 1930 in addition to the terms agreed here.",
    },
  ],
  agency: [
    {
      level: "low",
      title: "Contract Act agency chapter",
      detail:
        "The Principal-Agent relationship is governed by Chapter X (ss. 182-238) of the Contract Act, 1872 — the Agent must not act beyond the authority granted.",
    },
  ],
  independent_contractor: [
    {
      level: "high",
      title: "Don't misclassify employment",
      detail:
        "Mischaracterizing a real employment relationship as a contractor engagement can expose the Company to labour-law liability — the working arrangement must genuinely reflect contractor status (control, tools, exclusivity).",
    },
  ],
  undertaking: [
    {
      level: "low",
      title: "Check the recipient's own format",
      detail: "Where this undertaking is to be filed with a court, SECP, or other regulator, check that body's own format/affidavit requirements before submission.",
    },
  ],
  affidavit: [
    {
      level: "high",
      title: "Must be attested",
      detail:
        "Sign before a Notary Public / Oath Commissioner, who administers the oath — an unattested affidavit is generally not admissible in judicial or regulatory proceedings.",
    },
  ],
};

/** Static guidance for a type, independent of what the user has typed. */
export function contractGuidance(typeId: string): ContractFlag[] {
  return STATIC_GUIDANCE[typeId as ContractTypeId] ?? [];
}

/**
 * Risk flags for the questionnaire's current answers: missing required
 * fields, recommended clauses the user hasn't selected, plus the static
 * per-type guidance above. Purely structural checks on what was typed/picked
 * — never an assessment of the deal's commercial merits, and never a
 * fabricated legal claim (see STATIC_GUIDANCE's doc comment).
 */
export function computeContractRiskFlags(
  typeId: string,
  input: ContractQuestionnaireInput,
): ContractFlag[] {
  const type = contractType(typeId);
  const flags: ContractFlag[] = [];

  if (!input.a.trim() || !input.b.trim()) {
    flags.push({
      level: "high",
      title: "Parties not named",
      detail: "Both party names must be filled in before this draft is ready to share or sign.",
    });
  }
  if (!input.city.trim()) {
    flags.push({
      level: "low",
      title: "City / jurisdiction not set",
      detail: "Set the city so the governing-law clause names a specific court for jurisdiction.",
    });
  }
  if (type && !type.externalRoute && !input.extra.trim()) {
    flags.push({
      level: "med",
      title: `${type.extraLabel || "Scope"} not described`,
      detail: "This section is still a placeholder in the draft — describe it before sharing this contract for review.",
    });
  }

  for (const clauseId of recommendedClauseIds(typeId)) {
    if (input.clauses.includes(clauseId)) continue;
    const clause = clauseById(clauseId);
    if (!clause) continue;
    flags.push({
      level: "med",
      title: `Consider adding: ${clause.label}`,
      detail: clause.riskIfOmitted,
    });
  }

  flags.push(...contractGuidance(typeId));

  return flags;
}

/** All clause modules, flagging which ones this type recommends — for the "Clause explanations" panel. */
export function clauseExplanationsFor(typeId: string) {
  const recommended = new Set(recommendedClauseIds(typeId));
  return CLAUSE_MODULES.map((m) => ({ ...m, recommended: recommended.has(m.id) }));
}
