/**
 * Pre-Litigation Legal Notice Builder (/notices) — commercial-context
 * notices (a business pursuing a debtor), distinct from the citizen
 * versions in lib/citizen/documents.ts which are written for an individual.
 * Both generate the same underlying legal instrument but this one carries
 * company/CUIN fields and postal registration tracking.
 */

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function pkr(n: number): string {
  return n ? `PKR ${n.toLocaleString("en-PK")}` : "[amount]";
}

export const NOTICE_TYPES = [
  { id: "489f", title: "Section 489-F PPC (dishonoured cheque)" },
  { id: "debt_recovery", title: "Commercial debt recovery notice" },
] as const;

export type NoticeTypeId = (typeof NOTICE_TYPES)[number]["id"];

export type PostalTracking = {
  dispatchMethod: "Registered Post (AD)" | "Courier" | "Email + Registered Post";
  trackingNumber: string;
  dispatchDate: string;
  deliveryStatus: "Not yet dispatched" | "Dispatched" | "Delivered" | "Returned / undelivered";
};

export function emptyPostalTracking(): PostalTracking {
  return {
    dispatchMethod: "Registered Post (AD)",
    trackingNumber: "",
    dispatchDate: "",
    deliveryStatus: "Not yet dispatched",
  };
}

function trackingFooter(tracking: PostalTracking): string {
  return `POSTAL DISPATCH RECORD
Method: ${tracking.dispatchMethod}
Tracking / receipt number: ${tracking.trackingNumber || "[to be filled after dispatch]"}
Dispatch date: ${tracking.dispatchDate || "[to be filled after dispatch]"}
Status: ${tracking.deliveryStatus}

Retain the postal receipt and, once available, the delivery acknowledgement — both are evidence of service if this matter proceeds to court.`;
}

/* ---------------------------------------------------------------------- */
/* Section 489-F PPC — commercial dishonoured cheque                       */
/* ---------------------------------------------------------------------- */

export type Notice489FCommercialInput = {
  creditorCompanyName: string;
  creditorAddress: string;
  debtorName: string;
  debtorAddress: string;
  chequeNumber: string;
  chequeAmount: number;
  bankName: string;
  chequeDate: string;
  dishonorReason: string;
  underlyingTransaction: string;
  city: string;
  tracking: PostalTracking;
};

export function generate489FCommercialNotice(i: Notice489FCommercialInput): string {
  return `LEGAL NOTICE
(Dishonour of Cheque — Section 489-F, Pakistan Penal Code, 1860)

To,
${i.debtorName || "[Debtor Name]"}
${i.debtorAddress || "[Debtor Address]"}

From,
${i.creditorCompanyName || "[Creditor Company Name]"}
${i.creditorAddress || "[Creditor Address]"}

Date: ${today()}

Subject: Legal notice for dishonour of cheque bearing No. ${i.chequeNumber || "[Cheque No.]"}

Dear Sir/Madam,

Under instructions from and on behalf of ${i.creditorCompanyName || "[Creditor Company Name]"}, I serve upon you the following legal notice:

1. That the underlying transaction was: ${i.underlyingTransaction || "[describe the supply of goods/services or loan giving rise to the debt]"}.
2. That you issued Cheque No. ${i.chequeNumber || "[Cheque No.]"} dated ${i.chequeDate || "[Date]"} drawn on ${
    i.bankName || "[Bank Name]"
  } for an amount of ${pkr(i.chequeAmount)} towards discharge of the above legally enforceable debt.
3. That upon presentation, the said cheque was dishonoured by the bank on the ground of "${
    i.dishonorReason || "[reason, e.g. insufficient funds]"
  }".
4. That the dishonour of the cheque constitutes an offence under Section 489-F of the Pakistan Penal Code, 1860, punishable with imprisonment which may extend to three years, or with fine, or with both.

You are hereby called upon to make payment of the above sum of ${pkr(i.chequeAmount)} within thirty (30) days of receipt of this notice, failing which criminal proceedings shall be initiated against you under Section 489-F PPC, and/or civil proceedings for recovery, entirely at your risk, cost, and consequences.

This notice is issued without prejudice to any other right or remedy available under the law.

Yours faithfully,

_________________________
For ${i.creditorCompanyName || "[Creditor Company Name]"}

Dated: ${today()} at ${i.city || "[City]"}

${trackingFooter(i.tracking)}`;
}

/* ---------------------------------------------------------------------- */
/* Commercial debt recovery notice                                         */
/* ---------------------------------------------------------------------- */

export type DebtRecoveryInput = {
  creditorCompanyName: string;
  creditorAddress: string;
  debtorName: string;
  debtorAddress: string;
  invoiceOrContractRef: string;
  principalAmount: number;
  interestOrLateFee: number;
  dueDate: string;
  natureOfDebt: string;
  city: string;
  tracking: PostalTracking;
};

export function generateDebtRecoveryNotice(i: DebtRecoveryInput): string {
  const total = (Number(i.principalAmount) || 0) + (Number(i.interestOrLateFee) || 0);
  return `LEGAL NOTICE FOR RECOVERY OF OUTSTANDING DUES

To,
${i.debtorName || "[Debtor Name]"}
${i.debtorAddress || "[Debtor Address]"}

From,
${i.creditorCompanyName || "[Creditor Company Name]"}
${i.creditorAddress || "[Creditor Address]"}

Date: ${today()}

Subject: Legal notice for recovery of outstanding dues under Invoice/Contract Ref. ${
    i.invoiceOrContractRef || "[Reference]"
  }

Dear Sir/Madam,

Under instructions from and on behalf of ${i.creditorCompanyName || "[Creditor Company Name]"}, I serve upon you the following legal notice:

1. That pursuant to ${i.natureOfDebt || "[describe the goods supplied / services rendered / loan advanced]"}, an amount of ${pkr(
    i.principalAmount,
  )} became due and payable by you to my client, with payment falling due on ${i.dueDate || "[Due Date]"}.
2. That despite the amount having fallen due, you have failed and neglected to make payment, and an amount of ${pkr(
    i.interestOrLateFee,
  )} has additionally accrued as interest/late payment charges as per the agreed terms, bringing the total outstanding to ${pkr(
    total,
  )}.
3. That despite repeated requests and reminders, you have failed to clear the outstanding amount.

You are hereby called upon to pay the total outstanding sum of ${pkr(
    total,
  )} within fourteen (14) days of receipt of this notice, failing which my client shall be constrained to initiate civil recovery proceedings against you for the recovery of the said amount together with costs, entirely at your risk, cost, and consequences, and without any further notice.

This notice is issued without prejudice to any other right or remedy available to my client under the law, including under the Negotiable Instruments Act, 1881 where applicable.

Yours faithfully,

_________________________
For ${i.creditorCompanyName || "[Creditor Company Name]"}

Dated: ${today()} at ${i.city || "[City]"}

${trackingFooter(i.tracking)}`;
}

/* ---------------------------------------------------------------------- */
/* Local dispatch log                                                      */
/* ---------------------------------------------------------------------- */

export type NoticeLogEntry = {
  id: string;
  noticeType: NoticeTypeId;
  debtorName: string;
  amount: number;
  tracking: PostalTracking;
  createdAt: string;
};
