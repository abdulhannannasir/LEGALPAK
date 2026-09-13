/**
 * EasyPaisa is a manual payment method here: no merchant API integration
 * exists (that requires a Telenor Microfinance Bank merchant account), so
 * customers transfer to this account directly and share proof over WhatsApp.
 * Nothing here touches the server or a database — nothing is persisted.
 */
export const EASYPAISA_ACCOUNT = {
  number: "0307 9670000",
  numberRaw: "03079670000",
  title: "LegalPak",
} as const;

// wa.me requires the number in international format with no leading zero.
const WHATSAPP_NUMBER = `92${EASYPAISA_ACCOUNT.numberRaw.slice(1)}`;

export interface PaymentProof {
  name: string;
  amount: string;
  transactionId: string;
  plan: string;
}

export function buildWhatsAppProofLink(proof: PaymentProof): string {
  const lines = [
    "EasyPaisa payment confirmation",
    `Plan: ${proof.plan}`,
    `Name: ${proof.name}`,
    `Amount: PKR ${proof.amount}`,
    `Transaction ID: ${proof.transactionId}`,
  ];
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
