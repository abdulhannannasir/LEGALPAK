/**
 * Modular, reusable clause library — toggled on/off per contract instead of
 * being baked into one template per type. Each clause is a pure function of
 * context (city/parties) so the same "Arbitration" clause reads correctly
 * whether it's added to an NDA or a loan agreement.
 *
 * Each clause also carries an `explanation` (plain-English, for the
 * questionnaire's "Clause explanations" panel) and a `riskIfOmitted` (fed
 * into the risk-flag engine in `contract-guidance.ts` when a clause the type
 * recommends hasn't been selected). Both are drafting guidance, not legal
 * advice, and neither invents a statute — where a clause touches a specific
 * law it names only the same well-established Acts already cited elsewhere
 * in this codebase (Contract Act 1872, etc.).
 */

import type { ContractTypeId } from "./contracts";

export type ClauseContext = { city: string; a: string; b: string };

export type ClauseModule = {
  id: string;
  label: string;
  /** Plain-English explanation of what the clause does — shown in the questionnaire. */
  explanation: string;
  /** What can go wrong if this clause is left out — feeds the risk-flag engine. */
  riskIfOmitted: string;
  /** Contract types this clause is suggested for by default (drives "recommended" nudges). */
  recommendedFor: ContractTypeId[];
  render: (ctx: ClauseContext) => string;
};

export const CLAUSE_MODULES: ClauseModule[] = [
  {
    id: "arbitration",
    label: "Arbitration instead of court litigation",
    explanation:
      "Sends disputes to a private arbitrator instead of the civil courts — usually faster and confidential, but the parties give up the right to appeal on the merits.",
    riskIfOmitted:
      "Without this, any dispute defaults to ordinary civil litigation, which in Pakistan can run for years before final judgment.",
    recommendedFor: ["jv", "shareholders", "distribution", "agency", "vendor"],
    render: ({ city }) =>
      `Arbitration: Any dispute arising out of or in connection with this agreement shall be referred to and finally resolved by arbitration in ${city || "[City]"}, conducted by a sole arbitrator appointed by mutual agreement of the parties, under the Arbitration Act, 1940 (or its successor legislation). The arbitrator's award shall be final and binding.`,
  },
  {
    id: "confidentiality",
    label: "Confidentiality",
    explanation:
      "Obliges both sides to keep non-public information they exchange secret, and not to use it outside this agreement's purpose.",
    riskIfOmitted:
      "Without this, information shared while performing the agreement has no contractual protection and can be freely disclosed or reused by the other party.",
    recommendedFor: ["service", "employment", "partnership", "jv", "vendor", "distribution", "agency", "independent_contractor", "shareholders"],
    render: () =>
      "Confidentiality: Each party shall keep confidential all non-public information received from the other party in connection with this agreement, using at least the same degree of care it uses for its own confidential information, and shall not disclose it to any third party without the other party's prior written consent, except as required by law or a competent authority.",
  },
  {
    id: "force_majeure",
    label: "Force majeure",
    explanation:
      "Excuses a party from liability for delay or non-performance caused by events genuinely outside its control (natural disaster, war, government action), provided it gives notice and mitigates.",
    riskIfOmitted:
      "Without this, a party can in principle remain liable for breach even when performance was made impossible by a genuine external event.",
    recommendedFor: ["service", "vendor", "distribution", "jv", "loan", "rent", "tenancy"],
    render: () =>
      "Force Majeure: Neither party shall be liable for any failure or delay in performing its obligations under this agreement to the extent caused by circumstances beyond its reasonable control, including acts of God, war, civil unrest, government action, epidemic, or natural disaster, provided the affected party gives prompt notice and uses reasonable efforts to mitigate.",
  },
  {
    id: "non_compete",
    label: "Non-compete",
    explanation:
      "Stops the other party from competing in the same business, for a set period, while and shortly after this agreement is in force.",
    riskIfOmitted:
      "Without this, a counterparty (e.g. a former partner, distributor or key employee) is free to compete against you immediately after the relationship ends.",
    recommendedFor: ["partnership", "jv", "shareholders", "distribution", "agency", "employment"],
    render: () =>
      "Non-Compete: During the term of this agreement and for twelve (12) months thereafter, neither party shall, without the other's prior written consent, engage or invest in any business directly competing with the business contemplated by this agreement within Pakistan.",
  },
  {
    id: "indemnity",
    label: "Indemnity",
    explanation:
      "Makes the breaching or negligent party responsible for reimbursing the other party's losses, damages and reasonable legal costs.",
    riskIfOmitted:
      "Without this, recovering losses caused by the other party's breach or negligence relies on general contract-damages principles, which can be harder and slower to establish.",
    recommendedFor: ["service", "vendor", "distribution", "loan", "jv", "independent_contractor"],
    render: () =>
      "Indemnity: Each party shall indemnify and hold harmless the other party, its officers and employees, from and against any claims, losses, damages, or expenses (including reasonable legal costs) arising out of a breach of this agreement or a negligent or wrongful act by the indemnifying party or its personnel.",
  },
  {
    id: "assignment",
    label: "No assignment without consent",
    explanation:
      "Prevents either party from handing its rights/obligations to a third party without the other side agreeing first (a normal merger/restructuring carve-out is kept).",
    riskIfOmitted:
      "Without this, a party may in some circumstances be able to transfer its side of the deal to an unknown third party without your consent.",
    recommendedFor: ["service", "vendor", "distribution", "agency", "loan"],
    render: () =>
      "Assignment: Neither party may assign or transfer its rights or obligations under this agreement without the prior written consent of the other party, except to a successor entity in a merger, acquisition, or corporate restructuring.",
  },
  {
    id: "severability",
    label: "Severability",
    explanation:
      "If a court strikes down one clause as unenforceable, the rest of the agreement survives instead of the whole document failing.",
    riskIfOmitted:
      "Without this, one invalid clause can, in the worst case, put the enforceability of the entire agreement in doubt.",
    recommendedFor: ["service", "nda", "vendor", "distribution", "agency", "shareholders"],
    render: () =>
      "Severability: If any provision of this agreement is held invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect, and the parties shall negotiate in good faith to replace the invalid provision with one that most closely reflects its original intent.",
  },
  {
    id: "limitation_of_liability",
    label: "Limitation of liability",
    explanation:
      "Caps each party's financial exposure (typically to fees paid) and excludes indirect/consequential losses, so a small mistake can't create unlimited liability.",
    riskIfOmitted:
      "Without a cap, a party's liability for a breach is, in principle, unlimited and can include indirect or consequential losses.",
    recommendedFor: ["service", "vendor", "distribution", "agency", "independent_contractor"],
    render: () =>
      "Limitation of Liability: Except for breaches of confidentiality or indemnity obligations, or for wilful misconduct, each party's aggregate liability under this agreement shall not exceed the total fees paid or payable under this agreement in the twelve (12) months preceding the claim, and neither party shall be liable for indirect, incidental or consequential loss.",
  },
  {
    id: "ip_ownership",
    label: "IP ownership",
    explanation:
      "Makes clear who owns work product, designs, code or other intellectual property created while performing the agreement.",
    riskIfOmitted:
      "Without this, ownership of IP created during the engagement can be genuinely unclear, especially with contractors and vendors.",
    recommendedFor: ["service", "independent_contractor", "vendor", "jv"],
    render: ({ a }) =>
      `Intellectual Property: All work product, deliverables and materials created in the course of performing this agreement shall, upon full payment, vest in and belong exclusively to ${a || "[Party A]"}, save for any pre-existing intellectual property of either party, which each party retains.`,
  },
  {
    id: "termination_for_convenience",
    label: "Termination for convenience",
    explanation:
      "Lets either party end the agreement on notice, without needing to prove a breach — useful where the relationship may need to end cleanly.",
    riskIfOmitted:
      "Without this, exiting the agreement before its natural end may require proving the other party's breach, which can be contested.",
    recommendedFor: ["service", "vendor", "distribution", "agency", "independent_contractor"],
    render: () =>
      "Termination for Convenience: Either party may terminate this agreement without cause by giving the other party thirty (30) days' prior written notice, without prejudice to any obligations or liabilities accrued before the effective date of termination.",
  },
  {
    id: "notices_clause",
    label: "Formal notices clause",
    explanation:
      "Fixes how legally significant communications (default notices, termination notices) must be sent and when they count as received — avoiding arguments over informal WhatsApp/email messages.",
    riskIfOmitted:
      "Without this, whether an informal message (a call, a text) validly served notice under the agreement can itself become a dispute.",
    recommendedFor: ["loan", "distribution", "agency", "shareholders", "jv", "vendor"],
    render: () =>
      "Notices: Any notice under this agreement shall be in writing and delivered by hand, registered post, or email with delivery confirmation, to the address/email last notified by the receiving party, and shall be deemed received on the date of delivery (or, if sent by post, five (5) days after posting).",
  },
  {
    id: "entire_agreement",
    label: "Entire agreement",
    explanation:
      "States that this document is the whole deal, superseding earlier drafts, emails and verbal promises — so only what's written here (and signed amendments) counts.",
    riskIfOmitted:
      "Without this, a party may try to rely on an earlier draft, email exchange or verbal assurance as part of the bargain.",
    recommendedFor: ["service", "vendor", "distribution", "agency", "shareholders", "jv", "independent_contractor"],
    render: () =>
      "Entire Agreement: This agreement constitutes the entire understanding between the parties in relation to its subject matter and supersedes all prior discussions, negotiations and agreements, whether written or oral. It may only be amended by an instrument in writing signed by both parties.",
  },
];

export function clauseLabel(id: string): string {
  return CLAUSE_MODULES.find((c) => c.id === id)?.label ?? id;
}

export function clauseById(id: string): ClauseModule | undefined {
  return CLAUSE_MODULES.find((c) => c.id === id);
}

/** Clauses this contract type recommends by default — used to pre-suggest and to drive risk flags for gaps. */
export function recommendedClauseIds(typeId: string): string[] {
  return CLAUSE_MODULES.filter((m) => m.recommendedFor.includes(typeId as ContractTypeId)).map((m) => m.id);
}

/** Renders the selected clauses as a numbered "ADDITIONAL CLAUSES" block, or "" if none selected. */
export function renderAdditionalClauses(ids: string[], ctx: ClauseContext): string {
  const selected = CLAUSE_MODULES.filter((m) => ids.includes(m.id));
  if (selected.length === 0) return "";
  const body = selected.map((m, i) => `${i + 1}. ${m.render(ctx)}`).join("\n\n");
  return `ADDITIONAL CLAUSES\n\n${body}\n`;
}
