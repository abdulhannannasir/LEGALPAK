/**
 * Post-incorporation corporate filings: Form 21 (change of registered
 * office) and Form 45 (Ultimate Beneficial Ownership declaration, Section
 * 123A). Same pattern as secp-rules.ts — pure data + generators, no server
 * round-trip; these are execution-pack drafts for SECP's eZfile, not filed
 * documents.
 */

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------------------------------------------------------------------- */
/* Form 21 — Change of registered office (Section 42/registered office)    */
/* ---------------------------------------------------------------------- */

export type Form21Input = {
  companyName: string;
  cuin: string;
  oldAddress: string;
  newAddress: string;
  province: string;
  boardResolutionDate: string;
  effectiveDate: string;
};

export function generateForm21(i: Form21Input): string {
  return `FORM 21
NOTICE OF CHANGE OF SITUATION OF REGISTERED OFFICE

Company: ${i.companyName || "[Company Name]"}
CUIN: ${i.cuin || "[CUIN]"}

Date: ${today()}

Pursuant to a resolution of the Board of Directors dated ${i.boardResolutionDate || "[Board Resolution Date]"}, notice is hereby given that the registered office of the company has been changed as follows:

Previous registered office:
${i.oldAddress || "[Previous Address]"}

New registered office:
${i.newAddress || "[New Address]"}
${i.province || "[Province]"}

Effective date of change: ${i.effectiveDate || "[Effective Date]"}

This notice is filed in accordance with the requirements of the Companies Act, 2017 for change of the situation of the registered office. A certified copy of the Board resolution authorizing this change is attached.

_________________________
Authorized Signatory

Attach: certified copy of the Board resolution, and proof of the new address (utility bill / tenancy deed / title document).
File Form 21 on SECP eZfile within the statutory period following the resolution.`;
}

/* ---------------------------------------------------------------------- */
/* Form 45 — Ultimate Beneficial Ownership declaration (Section 123A)      */
/* ---------------------------------------------------------------------- */

export type BeneficialOwner = {
  id: string;
  fullName: string;
  cnicOrPassport: string;
  nationality: string;
  dateBecameUbo: string;
  percentShares: number;
  percentVotingRights: number;
  natureOfControl: string;
};

export function emptyBeneficialOwner(id: string): BeneficialOwner {
  return {
    id,
    fullName: "",
    cnicOrPassport: "",
    nationality: "Pakistani",
    dateBecameUbo: "",
    percentShares: 0,
    percentVotingRights: 0,
    natureOfControl: "Direct shareholding",
  };
}

export const NATURE_OF_CONTROL_OPTIONS = [
  "Direct shareholding",
  "Indirect shareholding (through another entity)",
  "Voting rights without shareholding",
  "Right to appoint/remove a majority of directors",
  "Significant influence or control",
] as const;

/** SECP/FATF guidance treats >25% shares or voting rights as the standard UBO threshold. */
export function isAboveUboThreshold(owner: BeneficialOwner): boolean {
  return owner.percentShares > 25 || owner.percentVotingRights > 25;
}

export type Form45Input = {
  companyName: string;
  cuin: string;
  ntn: string;
  owners: BeneficialOwner[];
};

export function generateForm45(i: Form45Input): string {
  const rows = i.owners.length
    ? i.owners
        .map(
          (o, idx) =>
            `${idx + 1}. ${o.fullName || "[Name]"}\n   CNIC/Passport: ${o.cnicOrPassport || "[CNIC/Passport]"} · Nationality: ${
              o.nationality || "[Nationality]"
            }\n   Shares held: ${o.percentShares || 0}% · Voting rights: ${o.percentVotingRights || 0}%\n   Nature of control: ${
              o.natureOfControl
            } · UBO since: ${o.dateBecameUbo || "[Date]"}${
              isAboveUboThreshold(o) ? "" : "  (below the 25% threshold — declare only if control is otherwise significant)"
            }`,
        )
        .join("\n\n")
    : "[No beneficial owners entered yet]";

  return `FORM 45
DECLARATION OF ULTIMATE BENEFICIAL OWNERSHIP
(Under Section 123A, Companies Act, 2017 and the SECP (Beneficial Ownership) Regulations, 2019)

Company: ${i.companyName || "[Company Name]"}
CUIN: ${i.cuin || "[CUIN]"}
NTN: ${i.ntn || "[NTN]"}

Date: ${today()}

The company declares the following natural persons as its Ultimate Beneficial Owner(s) — any individual who, directly or indirectly, holds not less than 25% of shares or voting rights, or otherwise exercises significant influence or control over the company:

${rows}

Where no individual meets the 25% threshold, the company must instead declare the natural person(s) exercising control through other means (senior managing official) — do not leave the UBO register blank.

Declared by:

_________________________
Authorized Signatory / Company Secretary

This declaration must be kept current — update it within the statutory period whenever beneficial ownership changes, and file on SECP eZfile accordingly.`;
}
