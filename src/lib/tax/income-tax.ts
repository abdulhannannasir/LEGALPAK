/**
 * Structured data collection for an income tax return — deliberately NOT a
 * tax computation engine. It organizes what the taxpayer declares into the
 * same categories FBR's return uses (salary, business, property, capital
 * gains, other/foreign, withholding already paid) and produces a plain
 * summary memo for a tax consultant to work from. Actual tax liability
 * depends on the current Finance Act's slabs, credits and exemptions, which
 * change annually — this app does not state a rate or a payable amount.
 */

export type IncomeTaxInput = {
  taxYear: string;
  salaryIncome: number;
  businessRevenue: number;
  businessExpenses: number;
  propertyIncome: number;
  capitalGains: number;
  otherIncome: number;
  foreignIncome: number;
  taxDeductedAtSource: number;
  notes: string;
};

export type IncomeTaxSummary = {
  businessNetIncome: number;
  totalDeclaredIncome: number;
};

export function summarizeIncomeTax(input: IncomeTaxInput): IncomeTaxSummary {
  const businessNetIncome = (input.businessRevenue || 0) - (input.businessExpenses || 0);
  const totalDeclaredIncome =
    (input.salaryIncome || 0) +
    businessNetIncome +
    (input.propertyIncome || 0) +
    (input.capitalGains || 0) +
    (input.otherIncome || 0) +
    (input.foreignIncome || 0);
  return { businessNetIncome, totalDeclaredIncome };
}

function pkr(n: number): string {
  return "PKR " + Math.round(n || 0).toLocaleString("en-PK");
}

export function generateIncomeTaxMemo(
  company: { name: string; ntn: string | null },
  input: IncomeTaxInput,
): string {
  const s = summarizeIncomeTax(input);
  return `INCOME TAX RETURN — DRAFTING MEMO
Tax Year ${input.taxYear || "[year]"}

Taxpayer: ${company.name}
NTN: ${company.ntn || "[NTN]"}

INCOME SOURCES DECLARED

Salary income:              ${pkr(input.salaryIncome)}
Business revenue:           ${pkr(input.businessRevenue)}
Business expenses:          ${pkr(input.businessExpenses)}
  Business net income:      ${pkr(s.businessNetIncome)}
Property (rent) income:     ${pkr(input.propertyIncome)}
Capital gains:               ${pkr(input.capitalGains)}
Other income:                ${pkr(input.otherIncome)}
Foreign-source income:       ${pkr(input.foreignIncome)}

TOTAL DECLARED INCOME:      ${pkr(s.totalDeclaredIncome)}

Tax already deducted/collected at source (withholding): ${pkr(input.taxDeductedAtSource)}

NOTES
${input.notes || "[none]"}

WHAT THIS MEMO IS NOT
This is a data-organization aid only. It does NOT compute tax payable —
applicable slabs, rates, credits and exemptions depend on the Finance Act in
force for this tax year and on taxpayer category (individual / AOP /
company), and change annually. Complete the actual computation and filing on
FBR IRIS (iris.fbr.gov.pk) with a licensed tax consultant.
`;
}
