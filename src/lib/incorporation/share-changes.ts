/**
 * SECP share-capital changes: Form 3 (Return of Allotment of Shares, Section
 * 73) for newly issued shares, and a Share Transfer Deed + Register of
 * Members update for a transfer between existing holders. Same pattern as
 * corporate-filings.ts — pure data + generators, no server round-trip; these
 * are execution-pack drafts for SECP's eZfile / the company's own register,
 * not filed documents.
 */

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------------------------------------------------------------------- */
/* Form 3 — Return of Allotment of Shares (Section 73)                     */
/* ---------------------------------------------------------------------- */

export type Allottee = {
  id: string;
  fullName: string;
  cnicOrPassport: string;
  address: string;
  numberOfShares: number;
  amountPaidPerShare: number;
};

export function emptyAllottee(id: string): Allottee {
  return { id, fullName: "", cnicOrPassport: "", address: "", numberOfShares: 0, amountPaidPerShare: 0 };
}

export type ShareAllotmentInput = {
  companyName: string;
  cuin: string;
  allotmentDate: string;
  boardResolutionDate: string;
  shareFaceValue: number;
  allottees: Allottee[];
};

export function totalAllottedShares(allottees: Allottee[]): number {
  return allottees.reduce((sum, a) => sum + (Number(a.numberOfShares) || 0), 0);
}

export function generateShareAllotment(i: ShareAllotmentInput): string {
  const total = totalAllottedShares(i.allottees);
  const rows = i.allottees.length
    ? i.allottees
        .map(
          (a, idx) =>
            `${idx + 1}. ${a.fullName || "[Name]"} — CNIC/Passport: ${a.cnicOrPassport || "[CNIC/Passport]"}\n   Address: ${
              a.address || "[Address]"
            }\n   Shares allotted: ${a.numberOfShares || 0} at PKR ${a.amountPaidPerShare || 0} paid per share`,
        )
        .join("\n\n")
    : "[No allottees entered yet]";

  return `FORM 3
RETURN OF ALLOTMENT OF SHARES
(Under Section 73, Companies Act, 2017)

Company: ${i.companyName || "[Company Name]"}
CUIN: ${i.cuin || "[CUIN]"}

Date of this return: ${today()}
Date of allotment: ${i.allotmentDate || "[Allotment Date]"}
Board resolution approving the allotment: ${i.boardResolutionDate || "[Board Resolution Date]"}
Nominal value per share: PKR ${i.shareFaceValue || 0}

Allottees:

${rows}

Total shares allotted in this return: ${total}
Total nominal value: PKR ${(total * (i.shareFaceValue || 0)).toLocaleString("en-PK")}

This return is filed in accordance with Section 73 of the Companies Act, 2017. Attach a certified
copy of the Board resolution authorizing the allotment.

_________________________
Authorized Signatory

File Form 3 on SECP eZfile within 30 days of allotment. Update the Register of Members to reflect
the new holdings.`;
}

/* ---------------------------------------------------------------------- */
/* Share Transfer Deed + Register of Members update                        */
/* ---------------------------------------------------------------------- */

export type ShareTransferInput = {
  companyName: string;
  cuin: string;
  transferorName: string;
  transferorCnic: string;
  transfereeName: string;
  transfereeCnic: string;
  numberOfShares: number;
  pricePerShare: number;
  transferDate: string;
  boardApprovalDate: string;
};

export function generateShareTransfer(i: ShareTransferInput): string {
  const total = (i.numberOfShares || 0) * (i.pricePerShare || 0);
  return `SHARE TRANSFER DEED
(Instrument of Transfer, Companies Act, 2017)

Company: ${i.companyName || "[Company Name]"}
CUIN: ${i.cuin || "[CUIN]"}

Date: ${today()}

I/We, ${i.transferorName || "[Transferor Name]"} (CNIC: ${
    i.transferorCnic || "[Transferor CNIC]"
  }), being the registered holder ("Transferor"), do hereby transfer to ${
    i.transfereeName || "[Transferee Name]"
  } (CNIC: ${i.transfereeCnic || "[Transferee CNIC]"}) ("Transferee") ${
    i.numberOfShares || 0
  } ordinary share(s) in the above company, subject to the conditions on which the Transferor held the same, for the consideration of PKR ${total.toLocaleString(
    "en-PK",
  )} (PKR ${i.pricePerShare || 0} per share) paid by the Transferee, receipt of which the Transferor hereby acknowledges.

Transfer date: ${i.transferDate || "[Transfer Date]"}
Board approval date: ${i.boardApprovalDate || "[Board Approval Date]"}

_________________________          _________________________
Transferor                          Transferee

Stamp duty must be paid on this instrument per the applicable provincial Stamp Act before
lodging it with the company. Update the Register of Members to record the Transferee as the
new holder of the shares described above, and issue a fresh share certificate.`;
}
