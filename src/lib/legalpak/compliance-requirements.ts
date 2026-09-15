import type { MatterType } from "./workflow";
import type { LegalSourceKey } from "./legal-sources";

export type ComplianceAuthority = "SECP" | "FBR";

export type ComplianceRequirementDef = {
  authority: ComplianceAuthority;
  /** Key into LEGAL_SOURCES for the statutory basis, source link and last-verified date. */
  sourceKey: LegalSourceKey;
  /** Shown as the requirement when a matter has no more specific title. */
  defaultRequirement: string;
};

/**
 * One entry per matter type that represents a real, statutory compliance
 * obligation. CONTRACT is deliberately absent — see computeMatterDueDate in
 * due-date.ts ("CONTRACT has no statutory filing deadline").
 *
 * This is the single place a new compliance rule plugs in: add a matter
 * type here (plus, if it needs one, a key in legal-sources.ts) and the whole
 * Compliance Center — health tiles, list view, calendar view, task detail —
 * picks it up automatically via deriveCompliance() in ./compliance.ts. No UI
 * component needs to change.
 */
export const COMPLIANCE_REQUIREMENTS: Partial<Record<MatterType, ComplianceRequirementDef>> = {
  FINANCIAL_STATEMENTS: {
    authority: "SECP",
    sourceKey: "compliance-financial-statements",
    defaultRequirement: "File audited financial statements with the registrar",
  },
  FORM_A: {
    authority: "SECP",
    sourceKey: "compliance-form-a",
    defaultRequirement: "File Form A / annual return",
  },
  FORM_9: {
    authority: "SECP",
    sourceKey: "compliance-form-9",
    defaultRequirement: "File Form 9 for a director/officer change",
  },
  INCOME_TAX_RETURN: {
    authority: "FBR",
    sourceKey: "compliance-income-tax",
    defaultRequirement: "File the annual income tax return",
  },
};

/** Whether this matter type is tracked as a statutory compliance requirement. */
export function isComplianceMatterType(type: MatterType): boolean {
  return type in COMPLIANCE_REQUIREMENTS;
}
