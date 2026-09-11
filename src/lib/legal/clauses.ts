/**
 * Modular, reusable clause library — toggled on/off per contract instead of
 * being baked into one template per type. Each clause is a pure function of
 * context (city/parties) so the same "Arbitration" clause reads correctly
 * whether it's added to an NDA or a loan agreement.
 */

export type ClauseContext = { city: string; a: string; b: string };

export type ClauseModule = {
  id: string;
  label: string;
  render: (ctx: ClauseContext) => string;
};

export const CLAUSE_MODULES: ClauseModule[] = [
  {
    id: "arbitration",
    label: "Arbitration instead of court litigation",
    render: ({ city }) =>
      `Arbitration: Any dispute arising out of or in connection with this agreement shall be referred to and finally resolved by arbitration in ${city || "[City]"}, conducted by a sole arbitrator appointed by mutual agreement of the parties, under the Arbitration Act, 1940 (or its successor legislation). The arbitrator's award shall be final and binding.`,
  },
  {
    id: "confidentiality",
    label: "Confidentiality",
    render: () =>
      "Confidentiality: Each party shall keep confidential all non-public information received from the other party in connection with this agreement, using at least the same degree of care it uses for its own confidential information, and shall not disclose it to any third party without the other party's prior written consent, except as required by law or a competent authority.",
  },
  {
    id: "force_majeure",
    label: "Force majeure",
    render: () =>
      "Force Majeure: Neither party shall be liable for any failure or delay in performing its obligations under this agreement to the extent caused by circumstances beyond its reasonable control, including acts of God, war, civil unrest, government action, epidemic, or natural disaster, provided the affected party gives prompt notice and uses reasonable efforts to mitigate.",
  },
  {
    id: "non_compete",
    label: "Non-compete",
    render: () =>
      "Non-Compete: During the term of this agreement and for twelve (12) months thereafter, neither party shall, without the other's prior written consent, engage or invest in any business directly competing with the business contemplated by this agreement within Pakistan.",
  },
  {
    id: "indemnity",
    label: "Indemnity",
    render: () =>
      "Indemnity: Each party shall indemnify and hold harmless the other party, its officers and employees, from and against any claims, losses, damages, or expenses (including reasonable legal costs) arising out of a breach of this agreement or a negligent or wrongful act by the indemnifying party or its personnel.",
  },
  {
    id: "assignment",
    label: "No assignment without consent",
    render: () =>
      "Assignment: Neither party may assign or transfer its rights or obligations under this agreement without the prior written consent of the other party, except to a successor entity in a merger, acquisition, or corporate restructuring.",
  },
  {
    id: "severability",
    label: "Severability",
    render: () =>
      "Severability: If any provision of this agreement is held invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect, and the parties shall negotiate in good faith to replace the invalid provision with one that most closely reflects its original intent.",
  },
];

export function clauseLabel(id: string): string {
  return CLAUSE_MODULES.find((c) => c.id === id)?.label ?? id;
}

/** Renders the selected clauses as a numbered "ADDITIONAL CLAUSES" block, or "" if none selected. */
export function renderAdditionalClauses(ids: string[], ctx: ClauseContext): string {
  const selected = CLAUSE_MODULES.filter((m) => ids.includes(m.id));
  if (selected.length === 0) return "";
  const body = selected.map((m, i) => `${i + 1}. ${m.render(ctx)}`).join("\n\n");
  return `ADDITIONAL CLAUSES\n\n${body}\n`;
}
