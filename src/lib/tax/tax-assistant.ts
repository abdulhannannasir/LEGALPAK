/**
 * Deterministic "what do I need to file" decision tree for FBR obligations —
 * mirrors the pattern already used for SECP classification in
 * `src/lib/legal/accounts.ts`: a rules-based recommendation, never an LLM
 * guess, with an explicit disclaimer. Tax slabs, thresholds and exemptions
 * change every Finance Act, so this deliberately never states a rate or
 * amount — only WHICH filings are typically relevant, always framed as
 * "commonly required" and pointing back to a licensed tax consultant / FBR
 * for the current numbers.
 */

export type TaxpayerKind = "individual" | "company" | "aop" | "sole_proprietor" | "other";

export type IncomeSource =
  | "salary"
  | "business"
  | "property"
  | "investments"
  | "freelancing"
  | "foreign_clients"
  | "agriculture"
  | "capital_gains"
  | "other";

export type TaxAssistantInput = {
  taxpayerKind: TaxpayerKind;
  hasNtn: boolean | null; // null = "not sure"
  incomeSources: IncomeSource[];
  salesTaxRegistered: boolean | null;
};

export type TaxRecommendation = {
  required: string[];
  consider: string[];
  notes: string[];
};

export function recommendFilings(input: TaxAssistantInput): TaxRecommendation {
  const required: string[] = [];
  const consider: string[] = [];
  const notes: string[] = [];

  if (input.hasNtn === false) {
    required.push("NTN registration (before anything else can be filed)");
  } else if (input.hasNtn === null) {
    notes.push("Check your NTN status on the FBR IRIS portal before proceeding.");
  }

  const hasAnyIncome = input.incomeSources.length > 0 && !(input.incomeSources.length === 1 && input.incomeSources[0] === "other");

  if (hasAnyIncome || input.hasNtn) {
    required.push("Income Tax Return (annual)");
  }

  if (input.incomeSources.includes("property")) {
    notes.push("Property income has its own schedule in the return, and rent above certain thresholds may carry withholding.");
  }
  if (input.incomeSources.includes("business") || input.incomeSources.includes("freelancing")) {
    notes.push("Business/freelance income needs a revenue-and-expense schedule and usually supports a Wealth Statement filing.");
  }
  if (input.incomeSources.includes("foreign_clients")) {
    notes.push("Foreign-source income has its own declaration section — check applicable tax credits for tax already paid abroad.");
  }
  if (input.incomeSources.includes("capital_gains")) {
    notes.push("Capital gains (securities, property) are computed on a separate schedule with holding-period-dependent rates.");
  }
  if (input.incomeSources.includes("agriculture")) {
    notes.push("Agricultural income is generally a provincial subject, not federal — verify with a tax consultant whether it needs separate provincial filing.");
  }

  if (input.taxpayerKind === "individual" || input.taxpayerKind === "aop") {
    consider.push("Wealth Statement (commonly required alongside the return for individuals/AOPs above the filing threshold)");
  }

  if (input.salesTaxRegistered === true) {
    required.push("Sales Tax Return (periodic — usually monthly)");
  } else if (input.salesTaxRegistered === null) {
    notes.push("If you sell taxable goods/services above the registration threshold, you may need Sales Tax registration — verify with a consultant.");
  }

  if (input.taxpayerKind === "company") {
    notes.push("Companies also generally require audited financial statements — see LegalPak's Financial Statements tool for the SECP side of that.");
  }

  if (required.length === 0 && consider.length === 0) {
    notes.push("Based on your answers, no federal filing looks immediately required — but confirm with a tax consultant, especially if your NTN status is unclear.");
  }

  return { required, consider, notes };
}
