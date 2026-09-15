/**
 * Registry of legal-basis metadata for claims LegalPak surfaces in the UI
 * (fees, deadlines, emergency numbers, offense classifications). This does
 * NOT compute or validate the claims themselves — those stay in
 * src/lib/incorporation, src/lib/citizen, src/lib/notices, etc. This is only
 * the citation layer shown alongside them via <LegalSourceNote>.
 *
 * `lastVerified` is intentionally omitted for every entry below: none of
 * these have been re-checked against a live, dated government source as
 * part of building this registry. Do not add a date here unless it was
 * actually confirmed against the primary source on that date — leaving it
 * unset renders "Source verification required" instead of a fabricated
 * date, per product policy.
 */

export type LegalSource = {
  /** Short label shown as the note's headline, e.g. "SECP filing fees". */
  label: string;
  /** The statute/regulation this claim is drawn from. */
  basis: string;
  /** Where to check the current, authoritative figure — a real, public URL. */
  sourceUrl?: string;
  /** ISO date this was last confirmed against the primary source, if ever. */
  lastVerified?: string;
};

export const LEGAL_SOURCE_KEYS = [
  "secp-name-restrictions",
  "secp-incorporation-fees",
  "secp-ubo",
  "citizen-emergency-contacts",
  "citizen-offense-classification",
  "notice-489f",
  "notice-debt-recovery",
  "compliance-financial-statements",
  "compliance-form-a",
  "compliance-form-9",
  "compliance-income-tax",
] as const;

export type LegalSourceKey = (typeof LEGAL_SOURCE_KEYS)[number];

export const LEGAL_SOURCES: Record<LegalSourceKey, LegalSource> = {
  "secp-name-restrictions": {
    label: "Restricted company names",
    basis: "Companies Act, 2017 — Section 10",
    sourceUrl: "https://www.secp.gov.pk/",
  },
  "secp-incorporation-fees": {
    label: "SECP incorporation fees",
    basis: "SECP fee schedule under the Companies (Incorporation) Regulations, 2017",
    sourceUrl: "https://www.secp.gov.pk/",
  },
  "secp-ubo": {
    label: "Beneficial ownership declaration (Form 45)",
    basis: "Companies Act, 2017 — Section 123A; SECP Beneficial Ownership Regulations, 2019",
    sourceUrl: "https://www.secp.gov.pk/",
  },
  "citizen-emergency-contacts": {
    label: "Emergency helpline numbers",
    basis: "Publicly listed government helpline numbers",
  },
  "citizen-offense-classification": {
    label: "Cognizable / bailable classification",
    basis: "Code of Criminal Procedure, 1898 — First Schedule",
  },
  "notice-489f": {
    label: "Dishonoured cheque notice period and penalty",
    basis: "Pakistan Penal Code, 1860 — Section 489-F",
  },
  "notice-debt-recovery": {
    label: "Commercial debt recovery notice period",
    basis: "Negotiable Instruments Act, 1881",
  },
  "compliance-financial-statements": {
    label: "Financial statements filing (SECP)",
    basis: "Companies Act, 2017 — ss. 223, 227, 232, 233",
    sourceUrl: "https://www.secp.gov.pk/",
  },
  "compliance-form-a": {
    label: "Form A / annual return (SECP)",
    basis: "Companies Act, 2017 — s. 130; Companies Regulations, 2024",
    sourceUrl: "https://www.secp.gov.pk/",
  },
  "compliance-form-9": {
    label: "Form 9 / director change (SECP)",
    basis:
      "Companies Regulations, 2024 — Induction, Cessation and change in particulars of directors and officers",
    sourceUrl: "https://www.secp.gov.pk/",
  },
  "compliance-income-tax": {
    label: "Income tax return (FBR)",
    basis: "Income Tax Ordinance, 2001",
    sourceUrl: "https://www.fbr.gov.pk/",
  },
};
