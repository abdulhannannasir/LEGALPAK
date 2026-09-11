export const MATTER_STATUSES = ["draft", "review", "approved", "signed", "filed", "closed"] as const;
export type MatterStatus = (typeof MATTER_STATUSES)[number];

export const MATTER_TYPES = [
  "FINANCIAL_STATEMENTS",
  "FORM_A",
  "FORM_9",
  "CONTRACT",
  "INCOME_TAX_RETURN",
] as const;
export type MatterType = (typeof MATTER_TYPES)[number];

export const MATTER_TYPE_LABEL: Record<MatterType, string> = {
  FINANCIAL_STATEMENTS: "Financial statements",
  FORM_A: "Form A / annual return",
  FORM_9: "Form 9 / director change",
  CONTRACT: "Contract",
  INCOME_TAX_RETURN: "Income tax return (FBR)",
};

export const STATUS_LABEL: Record<MatterStatus, string> = {
  draft: "Draft",
  review: "In review",
  approved: "Approved",
  signed: "Signed",
  filed: "Filed",
  closed: "Closed",
};

/** Legal next steps from each status — a matter can only move forward one step, or back to draft from review. */
const TRANSITIONS: Record<MatterStatus, MatterStatus[]> = {
  draft: ["review"],
  review: ["draft", "approved"],
  approved: ["signed"],
  signed: ["filed"],
  filed: ["closed"],
  closed: [],
};

export function canTransition(from: MatterStatus, to: MatterStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: MatterStatus): MatterStatus[] {
  return TRANSITIONS[from] ?? [];
}
