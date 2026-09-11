export const CITIZEN_DOCUMENT_TYPES = [
  { id: "affidavit", title: "Affidavit" },
  { id: "tenancy_deed", title: "Tenancy deed" },
  { id: "489f_notice", title: "489-F legal notice (dishonoured cheque)" },
  { id: "consumer_complaint", title: "Consumer complaint" },
] as const;

export type CitizenDocumentId = (typeof CITIZEN_DOCUMENT_TYPES)[number]["id"];

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export type AffidavitInput = {
  deponentName: string;
  cnic: string;
  address: string;
  city: string;
  statement: string;
};

export function generateAffidavit(i: AffidavitInput): string {
  return `AFFIDAVIT

I, ${i.deponentName || "[Deponent Name]"}, holder of CNIC No. ${i.cnic || "[CNIC]"}, resident of ${i.address || "[Address]"}, do hereby solemnly affirm and declare as under:

1. That I am the deponent of this affidavit and am fully competent to swear the same.
2. ${i.statement || "[Statement of facts]"}
3. That the contents of this affidavit are true and correct to the best of my knowledge and belief, and nothing has been concealed therefrom.

DEPONENT

Verification: Verified at ${i.city || "[City]"} on ${today()} that the contents of the above affidavit are true and correct to the best of my knowledge and belief.

_________________________
${i.deponentName || "Deponent"}

Attest before a Notary Public / Oath Commissioner.`;
}

export type TenancyDeedInput = {
  landlordName: string;
  tenantName: string;
  propertyAddress: string;
  city: string;
  monthlyRent: number;
  securityDeposit: number;
  leaseStartDate: string;
  leaseDurationMonths: number;
};

export function generateTenancyDeed(i: TenancyDeedInput): string {
  return `TENANCY DEED

This Tenancy Deed is made at ${i.city || "[City]"} on ${today()} between ${i.landlordName || "[Landlord]"} (the "Landlord") and ${i.tenantName || "[Tenant]"} (the "Tenant").

1. Premises: The Landlord lets and the Tenant takes on rent the premises situated at ${i.propertyAddress || "[Property address]"} (the "Premises").
2. Term: The tenancy shall commence from ${i.leaseStartDate || "[start date]"} for a period of ${i.leaseDurationMonths || "[N]"} months.
3. Rent: The Tenant shall pay a monthly rent of PKR ${i.monthlyRent ? i.monthlyRent.toLocaleString("en-PK") : "[amount]"}, payable in advance by the 5th of each month.
4. Security deposit: The Tenant has paid PKR ${i.securityDeposit ? i.securityDeposit.toLocaleString("en-PK") : "[amount]"} as a refundable security deposit, to be returned at the end of the tenancy subject to deductions for damage or unpaid dues.
5. Use: The Premises shall be used for residential purposes only, and shall not be sublet without the Landlord's prior written consent.
6. Maintenance: The Tenant shall maintain the Premises in good condition, ordinary wear and tear excepted.
7. Termination: Either party may terminate this tenancy by giving [30/60/90] days' written notice, or as required under the applicable provincial rent law.
8. Governing law: This deed is governed by the applicable provincial rent restriction/tenancy legislation and the general law of Pakistan.

IN WITNESS WHEREOF the parties have signed this deed at ${i.city || "[City]"} on ${today()}.

_________________________          _________________________
Landlord: ${i.landlordName || "[Landlord]"}          Tenant: ${i.tenantName || "[Tenant]"}

WITNESSES:
1. _________________________     2. _________________________`;
}

export type Notice489FInput = {
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  chequeNumber: string;
  chequeAmount: number;
  bankName: string;
  chequeDate: string;
  dishonorReason: string;
  city: string;
};

export function generate489FNotice(i: Notice489FInput): string {
  return `LEGAL NOTICE
(Dishonour of Cheque — Section 489-F, Pakistan Penal Code, 1860)

To,
${i.recipientName || "[Recipient Name]"}
${i.recipientAddress || "[Recipient Address]"}

From,
${i.senderName || "[Sender Name]"}
${i.senderAddress || "[Sender Address]"}

Date: ${today()}

Subject: Legal Notice for Dishonour of Cheque bearing No. ${i.chequeNumber || "[Cheque No.]"}

Dear Sir/Madam,

Under instructions from and on behalf of ${i.senderName || "[Sender Name]"}, I serve upon you the following legal notice:

1. That you issued Cheque No. ${i.chequeNumber || "[Cheque No.]"} dated ${i.chequeDate || "[Date]"} drawn on ${i.bankName || "[Bank Name]"} for an amount of PKR ${i.chequeAmount ? i.chequeAmount.toLocaleString("en-PK") : "[Amount]"} in favour of my client, towards discharge of a legally enforceable debt/liability.
2. That upon presentation, the said cheque was dishonoured by the bank on the ground of "${i.dishonorReason || "[reason, e.g. insufficient funds]"}".
3. That the dishonour of the cheque constitutes an offence under Section 489-F of the Pakistan Penal Code, 1860, punishable with imprisonment which may extend to three years, or with fine, or with both.

You are hereby called upon to make payment of the above sum of PKR ${i.chequeAmount ? i.chequeAmount.toLocaleString("en-PK") : "[Amount]"} within thirty (30) days of receipt of this notice, failing which my client shall be constrained to initiate criminal proceedings against you under Section 489-F PPC, and/or civil proceedings for recovery, entirely at your risk, cost, and consequences.

This notice is issued without prejudice to any other right or remedy available to my client under the law.

Yours faithfully,

_________________________
${i.senderName || "[Sender Name]"}

Send by registered post with acknowledgement due (AD), and retain the postal receipt.`;
}

export type ConsumerComplaintInput = {
  complainantName: string;
  complainantAddress: string;
  respondentName: string;
  respondentAddress: string;
  productOrService: string;
  purchaseDate: string;
  amountPaid: number;
  issueDescription: string;
  reliefSought: string;
  city: string;
};

export function generateConsumerComplaint(i: ConsumerComplaintInput): string {
  return `CONSUMER COMPLAINT

Before the Consumer Court / Consumer Protection Council, ${i.city || "[City]"}

Complainant: ${i.complainantName || "[Complainant Name]"}
Address: ${i.complainantAddress || "[Complainant Address]"}

Versus

Respondent: ${i.respondentName || "[Respondent Name / Business]"}
Address: ${i.respondentAddress || "[Respondent Address]"}

COMPLAINT UNDER THE APPLICABLE PROVINCIAL CONSUMER PROTECTION LAW

Respectfully Sheweth:

1. That the Complainant purchased/availed ${i.productOrService || "[product/service]"} from the Respondent on ${i.purchaseDate || "[date]"} for a total amount of PKR ${i.amountPaid ? i.amountPaid.toLocaleString("en-PK") : "[amount]"}.
2. That the following defect/deficiency was found: ${i.issueDescription || "[describe the defect, deficiency in service, or unfair practice]"}.
3. That despite repeated requests to the Respondent to rectify the matter, no satisfactory resolution has been provided.
4. That the aforesaid act of the Respondent amounts to a deficiency in service/defective goods/unfair trade practice under the applicable consumer protection law of the province.

PRAYER

It is therefore most respectfully prayed that this Hon'ble Forum may kindly:
(a) Direct the Respondent to ${i.reliefSought || "[e.g. refund the amount paid / replace the product / compensate for the loss]"};
(b) Award compensation for mental agony and litigation costs; and
(c) Grant any other relief deemed fit in the circumstances of the case.

Dated: ${today()}

_________________________
${i.complainantName || "[Complainant Name]"}
Complainant

Attach: purchase receipt, warranty card, correspondence with the Respondent, and any photographs/evidence of the defect.`;
}
