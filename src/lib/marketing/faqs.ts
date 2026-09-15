/**
 * Shared FAQ content — rendered as the accordion in FaqSection.tsx and as
 * FAQPage structured data on the homepage (see routes/index.tsx), so the
 * two never drift out of sync.
 */

export type FaqItem = { question: string; answer: string };

export const FAQS: FaqItem[] = [
  {
    question: "Is LegalPak a law firm, or a substitute for a lawyer?",
    answer:
      "Neither. LegalPak is a drafting and preparation desk — it generates execution-ready packs (MOA, AOA, Form 28, legal notices, and more) and walks you through the rules, but every filing is still submitted and PIN-signed by an authorized officer on SECP's own eZfile portal. For anything contested, or a matter that needs judgment rather than a form, use the Consult Counsel desk to reach a verified advocate.",
  },
  {
    question: "Does LegalPak file my documents with SECP or FBR directly?",
    answer:
      "No — LegalPak has no filing integration with government portals. It prepares the pack (names checked against Section 10, capital and fees calculated, MOA/AOA/Form 28 drafted) and gives you a field-by-field map of exactly what to paste into eZfile. You review, sign in with your own SECP credentials, and submit it yourself.",
  },
  {
    question: "What company types can I register through the Incorporation desk?",
    answer:
      "Private Limited (Pvt Ltd), Single Member Company (SMC-Pvt), and Limited Liability Partnership (LLP) all go through the full wizard and generate a real SECP execution pack. Sole Proprietorship / AOP isn't an SECP entity at all, so the wizard redirects you straight to FBR NTN registration and a partnership-deed template instead of pretending to file one.",
  },
  {
    question: "Do I need an account to use the tools?",
    answer:
      "Citizen document drafts and the Help Desk wizards don't need an account — use them anonymously, and your in-progress drafts are kept in your browser. The Corporate Suite (Contracts, Financial Statements, Incorporation, Form 21/45, Legal Notices, and the rest) requires signing in and an active subscription on the workspace you're using, since that's also what unlocks saving a permanent Company Profile.",
  },
  {
    question: "What happens to my company data after I finish the Incorporation wizard?",
    answer:
      "If you sign in and click \"Create company profile,\" your details are saved as a real Company Profile and you land on its page, from which every other corporate tool (Financial Statements, Form A, Form 9, Contracts) can start a matter for that company. You can also export a portable company-profile .json file at any point — the \"vault\" — and re-import it into Form 21, Form 45, or a future filing to skip re-typing the same details.",
  },
  {
    question: "Is the Citizen Legal Help chat actually AI, and is it reliable?",
    answer:
      "Yes — it's powered by Google's Gemini model, answering in English, Roman Urdu, or Urdu. It gives preliminary guidance under Pakistani law, not legal representation, and it says so. For anything serious, it points you to the verified lawyer directory or, for genuine emergencies, the helpline ribbon on the Help Desk pages.",
  },
  {
    question: "What's the difference between Citizen Legal Help and the Help Desk & Rights Navigator?",
    answer:
      "Citizen Legal Help is an open-ended chat plus a handful of general document drafts (affidavit, tenancy deed, 489-F notice, consumer complaint). The Help Desk & Rights Navigator is five specific, guided wizards — utility overbilling, cyber harassment, eviction, police encounters, and inheritance — each ending in a ready-to-print notice or checklist and, for utility/cyber/inheritance/tenancy, a live emergency-helpline ribbon.",
  },
  {
    question: "How accurate are the SECP fees and Section 10 name checks?",
    answer:
      "The name checker flags a representative (not exhaustive) list of restricted words under Section 10 of the Companies Act, 2017, and the fee estimator gives an indicative government challan based on SECP's published fee structure. Both are clearly labelled as estimates — confirm the exact figures on eZfile's own calculator before you pay.",
  },
  {
    question: "Can I use LegalPak for an existing company, not just a new one?",
    answer:
      "Yes. Financial Statements, Form A, Form 9, Compliance Calendar, Form 21 (change of registered office), Form 45 (beneficial ownership), and Legal Notices are all built for companies that are already incorporated — you don't need to have used the Incorporation wizard first.",
  },
  {
    question: "Does LegalPak cost anything?",
    answer:
      "Citizen Legal Help and the Help Desk & Rights Navigator are free, no account needed. The Corporate Suite — Financial Statements, Form A, Form 9, Contracts, Incorporation, Form 21/45, Legal Notices, the Tax Assistant, and the Compliance Calendar — is PKR 3,000/month per workspace, paid via EasyPaisa (see /billing). Where LegalPak connects you to a person — a verified advocate via Consult Counsel or the lawyer directory — that advocate's own consultation fee applies separately, shown upfront before you book (starting around PKR 2,000).",
  },
  {
    question: "How does the EasyPaisa payment actually work?",
    answer:
      "It's a manual transfer, not an automated checkout — we don't have a payment-gateway integration with EasyPaisa (that requires a registered merchant account, which we don't have set up yet). You send PKR 3,000 to the EasyPaisa number shown on the billing page from your own EasyPaisa app, then submit the transaction id there. We verify the transfer landed and activate your subscription, usually within a business day. We never ask for your EasyPaisa PIN or card details.",
  },
  {
    question: "How is my company data stored?",
    answer:
      "Company, matter, and compliance records you save while signed in live in our Postgres database, scoped strictly to your workspace — no other workspace can query or see them. Uploaded files (CNIC scans, resolutions, PDFs) are stored as private objects in Vercel Blob storage, referenced by your workspace's records only. Browser-only drafts (the Incorporation wizard before you sign in, Citizen document drafts) stay in your own browser and are never sent to our servers until you choose to save them. Citizen Legal Help chat messages are stored against a session token so your conversation can continue, not tied to a public profile.",
  },
  {
    question: "How do I delete my data?",
    answer:
      "There's no self-serve \"delete my account\" button yet. To have your workspace, company records, documents, or citizen chat history deleted, contact us and we'll remove them manually. We'll add self-serve deletion as the product matures.",
  },
];
