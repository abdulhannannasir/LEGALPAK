/**
 * Data + pure logic for the Company Registration & SECP eZfile Pre-Flight
 * Suite (/incorporation). Same shape as citizen/help-desk.ts and
 * citizen/documents.ts: static reference data, pure validators, and
 * document-text generators — no server round-trip. The wizard only touches
 * the server once, at the very end, to save a Company profile via the
 * existing companies.ts server functions (see routes/incorporation.tsx).
 */

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function pkr(n: number): string {
  return `PKR ${Math.round(n).toLocaleString("en-PK")}`;
}

/* ---------------------------------------------------------------------- */
/* Entity classification matrix                                            */
/* ---------------------------------------------------------------------- */

export type EntityTypeId = "private" | "smc" | "llp" | "sole_prop";

export type EntityType = {
  id: EntityTypeId;
  title: string;
  regulator: string;
  governingLaw: string;
  minDirectors: number;
  minShareholders: number;
  liability: string;
  notes: string[];
  /** Sole prop / AOP isn't an SECP filing at all — the wizard redirects instead of continuing. */
  isSecpEntity: boolean;
};

export const ENTITY_TYPES: EntityType[] = [
  {
    id: "private",
    title: "Private Limited Company (Pvt Ltd)",
    regulator: "SECP",
    governingLaw: "Companies Act, 2017",
    minDirectors: 2,
    minShareholders: 2,
    liability: "Limited — shareholders' personal assets are shielded",
    notes: ["Most common vehicle for startups and SMEs.", "Minimum 2 directors and 2 shareholders (can be the same 2 people)."],
    isSecpEntity: true,
  },
  {
    id: "smc",
    title: "Single Member Company (SMC-Pvt)",
    regulator: "SECP",
    governingLaw: "Companies Act, 2017",
    minDirectors: 1,
    minShareholders: 1,
    liability: "Limited — the sole member's personal assets are shielded",
    notes: [
      "1 director (the sole member) plus 1 nominee director on file in case of death/incapacity.",
      "Converts to a full Pvt Ltd automatically if membership ever exceeds one person.",
    ],
    isSecpEntity: true,
  },
  {
    id: "llp",
    title: "Limited Liability Partnership (LLP)",
    regulator: "SECP",
    governingLaw: "LLP Act, 2017",
    minDirectors: 2,
    minShareholders: 2,
    liability: "Limited — partners are not personally liable for the LLP's debts",
    notes: [
      "Minimum 2 designated partners, governed by an LLP Agreement rather than a MOA/AOA.",
      "Better suited to professional services firms (consulting, law, accountancy) than to raising outside equity.",
    ],
    isSecpEntity: true,
  },
  {
    id: "sole_prop",
    title: "Sole Proprietorship / Association of Persons (AOP)",
    regulator: "FBR / Registrar of Firms",
    governingLaw: "Not the Companies Act, 2017",
    minDirectors: 0,
    minShareholders: 1,
    liability: "Unlimited — your personal assets are NOT separate from the business",
    notes: [
      "This is not an SECP entity — there is no MOA/AOA or eZfile filing.",
      "Register for an NTN with FBR directly, and a partnership deed with the Registrar of Firms if there's more than one owner.",
    ],
    isSecpEntity: false,
  },
];

export function getEntityType(id: EntityTypeId): EntityType {
  return ENTITY_TYPES.find((e) => e.id === id) ?? ENTITY_TYPES[0];
}

/** What to call an "officer" of the entity in the UI — Companies Act uses "director", LLP Act uses "designated partner". */
export function officerLabel(id: EntityTypeId): string {
  return id === "llp" ? "Designated Partner" : "Director";
}

/* ---------------------------------------------------------------------- */
/* Step 1 — Name reservation & Section 10                                  */
/* ---------------------------------------------------------------------- */

/** Representative, non-exhaustive — Section 10, Companies Act 2017 and the SECP name-availability guidelines. */
export const SECTION_10_PROHIBITED_WORDS = [
  "State",
  "Federal",
  "National",
  "Commission",
  "Trust",
  "University",
  "Bank",
  "Chartered",
  "Police",
  "Bureau",
  "Insurance",
  "Islamic",
  "Authority",
  "Council",
  "Regulatory",
  "Cooperative",
];

export type NameCheckResult = { name: string; flaggedWords: string[] };

export function checkProposedName(name: string): NameCheckResult {
  const flaggedWords = SECTION_10_PROHIBITED_WORDS.filter((w) =>
    new RegExp(`\\b${w}\\b`, "i").test(name),
  );
  return { name, flaggedWords };
}

export const PRINCIPAL_BUSINESS_LINES = [
  "Information Technology",
  "General Trading",
  "Real Estate",
  "Consulting",
  "Healthcare",
  "Manufacturing",
  "Construction",
  "Import / Export",
  "Education",
  "Logistics & Transport",
] as const;

export type PrincipalBusinessLine = (typeof PRINCIPAL_BUSINESS_LINES)[number];

/** Short object-clause seed per business line, dropped into the MOA's "objects" section. */
const OBJECT_CLAUSES: Record<PrincipalBusinessLine, string> = {
  "Information Technology":
    "To carry on the business of software development, IT consulting, systems integration, and provision of technology-enabled services, both within Pakistan and for export.",
  "General Trading":
    "To carry on the business of general trading, including import, export, buying, selling, and distribution of goods and merchandise of every description.",
  "Real Estate":
    "To carry on the business of real estate development, sale, purchase, letting, and management of immovable property, and to act as builders and developers.",
  Consulting:
    "To carry on the business of providing management, business, financial, technical, and strategic consulting and advisory services.",
  Healthcare:
    "To carry on the business of establishing and operating healthcare facilities, clinics, diagnostic centres, and to provide allied medical and healthcare services, subject to applicable regulatory licences.",
  Manufacturing:
    "To carry on the business of manufacturing, processing, and assembling of goods, and to buy, sell, and deal in raw materials, machinery, and finished products connected therewith.",
  Construction:
    "To carry on the business of civil, structural, and mechanical construction, engineering contracting, and allied works.",
  "Import / Export":
    "To carry on the business of import and export of goods and commodities of every description, subject to applicable licensing requirements.",
  Education:
    "To establish, operate, and manage educational institutions, training centres, and to provide allied educational services, subject to applicable regulatory approvals.",
  "Logistics & Transport":
    "To carry on the business of logistics, freight forwarding, warehousing, and transportation of goods.",
};

export function objectClauseFor(line: PrincipalBusinessLine): string {
  return OBJECT_CLAUSES[line];
}

/* ---------------------------------------------------------------------- */
/* Step 2 — Capitalization & fee estimator                                 */
/* ---------------------------------------------------------------------- */

export const DEFAULT_AUTHORIZED_CAPITAL = 100_000;
export const DEFAULT_SHARE_FACE_VALUE = 10;

const NAME_RESERVATION_FEE = 500;
const BASE_CAPITAL_FILING_FEE = 1_500; // for authorized capital up to PKR 100,000
const ADDITIONAL_FEE_PER_100K = 100; // indicative slab beyond the base bracket
const PER_ATTACHMENT_FEE = 600;

export type FeeEstimate = {
  nameReservationFee: number;
  capitalFilingFee: number;
  attachmentCount: number;
  attachmentFees: number;
  total: number;
};

/**
 * Indicative SECP challan estimate — actual amounts are set by SECP's fee
 * schedule at the time of filing and should be confirmed on eZfile before
 * payment.
 */
export function estimateFees(authorizedCapital: number, directorCount: number): FeeEstimate {
  const excess = Math.max(0, authorizedCapital - DEFAULT_AUTHORIZED_CAPITAL);
  const capitalFilingFee =
    BASE_CAPITAL_FILING_FEE + Math.ceil(excess / 100_000) * ADDITIONAL_FEE_PER_100K;
  // Form-1 (declaration of compliance) + MOA/AOA attachment set + one Form-28 per director/partner.
  const attachmentCount = 2 + Math.max(1, directorCount);
  const attachmentFees = attachmentCount * PER_ATTACHMENT_FEE;
  return {
    nameReservationFee: NAME_RESERVATION_FEE,
    capitalFilingFee,
    attachmentCount,
    attachmentFees,
    total: NAME_RESERVATION_FEE + capitalFilingFee + attachmentFees,
  };
}

export { pkr };

/* ---------------------------------------------------------------------- */
/* Step 3 — Subscribers & directors                                        */
/* ---------------------------------------------------------------------- */

export type Subscriber = {
  id: string;
  fullName: string;
  parentName: string; // father's / spouse's name
  cnic: string;
  address: string;
  mobile: string;
  email: string;
  sharePercent: number;
  isOfficer: boolean; // director / designated partner
  isNominee: boolean; // SMC nominee director only
};

export function emptySubscriber(id: string): Subscriber {
  return {
    id,
    fullName: "",
    parentName: "",
    cnic: "",
    address: "",
    mobile: "",
    email: "",
    sharePercent: 0,
    isOfficer: true,
    isNominee: false,
  };
}

export function totalSharePercent(subscribers: Subscriber[]): number {
  return subscribers.reduce((sum, s) => sum + (Number(s.sharePercent) || 0), 0);
}

export function officerCount(subscribers: Subscriber[]): number {
  return subscribers.filter((s) => s.isOfficer && !s.isNominee).length;
}

export type SubscriberValidation = { ok: boolean; issues: string[] };

export function validateSubscribers(
  entityType: EntityTypeId,
  subscribers: Subscriber[],
): SubscriberValidation {
  const issues: string[] = [];
  const entity = getEntityType(entityType);
  const total = totalSharePercent(subscribers);
  const officers = officerCount(subscribers);

  if (Math.round(total) !== 100) {
    issues.push(`Shareholding must total 100% — currently ${total}%.`);
  }
  if (subscribers.length < entity.minShareholders) {
    issues.push(`${entity.title} requires at least ${entity.minShareholders} subscriber(s).`);
  }
  if (officers < entity.minDirectors) {
    issues.push(
      `${entity.title} requires at least ${entity.minDirectors} ${officerLabel(entityType).toLowerCase()}(s).`,
    );
  }
  if (entityType === "smc") {
    if (officers > 1) {
      issues.push("An SMC-Pvt cannot have more than 1 director (the sole member).");
    }
    if (!subscribers.some((s) => s.isNominee)) {
      issues.push("An SMC-Pvt requires 1 nominee director on file.");
    }
  }
  return { ok: issues.length === 0, issues };
}

/* ---------------------------------------------------------------------- */
/* Step 5 — Document generators                                            */
/* ---------------------------------------------------------------------- */

export type IncorporationState = {
  entityType: EntityTypeId;
  proposedNames: [string, string, string];
  principalBusiness: PrincipalBusinessLine;
  authorizedCapital: number;
  shareFaceValue: number;
  paidUpCapital: number;
  subscribers: Subscriber[];
  registeredAddress: string;
  province: string;
  section153Confirmed: boolean;
};

export function generateMoa(state: IncorporationState): string {
  const name = state.proposedNames[0] || "[Proposed Company Name]";
  const entity = getEntityType(state.entityType);
  return `MEMORANDUM OF ASSOCIATION
${name.toUpperCase()} (${entity.title.toUpperCase()})

Under the Companies Act, 2017

I. NAME
The name of the company is "${name}" ${
    entity.id === "smc" ? "(SMC-Private) Limited" : "(Private) Limited"
  }.

II. REGISTERED OFFICE
The registered office of the company will be situated in ${state.province || "[Province]"}, Pakistan, at ${
    state.registeredAddress || "[Registered Office Address]"
  }.

III. OBJECTS
${objectClauseFor(state.principalBusiness)}

And to do all such other things as may be considered incidental or conducive to the attainment of the above objects.

IV. LIABILITY
The liability of the members is limited.

V. CAPITAL
The authorized share capital of the company is ${pkr(state.authorizedCapital)} divided into ${Math.floor(
    state.authorizedCapital / (state.shareFaceValue || 1),
  ).toLocaleString("en-PK")} ordinary shares of ${pkr(state.shareFaceValue)} each, with power to increase or reduce such capital and to divide the shares into several classes.

VI. SUBSCRIPTION
We, the several persons whose names, addresses, and CNIC numbers are subscribed below, are desirous of being formed into a company in pursuance of this Memorandum of Association, and agree to take the number of shares shown against our respective names.

${subscriberTable(state.subscribers)}

Dated: ${today()}`;
}

export function generateAoa(state: IncorporationState): string {
  const name = state.proposedNames[0] || "[Proposed Company Name]";
  return `ARTICLES OF ASSOCIATION
${name.toUpperCase()}

Under the Companies Act, 2017 — adopting Table A regulations with the following modifications

1. PRELIMINARY
These Articles are subject to the regulations contained in Table A of the First Schedule to the Companies Act, 2017, except insofar as they are excluded or modified below.

2. SHARE CAPITAL
The authorized share capital of the company is ${pkr(state.authorizedCapital)} divided into shares of ${pkr(
    state.shareFaceValue,
  )} each, as set out in the Memorandum of Association.

3. DIRECTORS
The number of directors shall not be less than ${getEntityType(state.entityType).minDirectors} nor more than as the members may from time to time determine by ordinary resolution.

4. TRANSFER OF SHARES
No share shall be transferred to a person who is not a member so long as any member is willing to purchase the same at a fair value, to be determined by the directors.

5. GENERAL MEETINGS
An Annual General Meeting shall be held once in every calendar year, in accordance with Section 132 of the Companies Act, 2017.

6. BORROWING POWERS
The directors may exercise all the powers of the company to borrow money and to mortgage or charge its undertaking, property, and uncalled capital.

7. INDEMNITY
Every director, officer, or agent of the company shall be indemnified out of the assets of the company against liability incurred in defending proceedings, whether civil or criminal, in relation to their duties, to the extent permitted by law.

SUBSCRIBERS

${subscriberTable(state.subscribers)}

Dated: ${today()}`;
}

function subscriberTable(subscribers: Subscriber[]): string {
  if (subscribers.length === 0) return "[No subscribers entered yet]";
  return subscribers
    .map(
      (s, i) =>
        `${i + 1}. ${s.fullName || "[Name]"} S/O, D/O, W/O ${s.parentName || "[Father's/Spouse's Name]"}\n   CNIC: ${
          s.cnic || "[CNIC]"
        } · Address: ${s.address || "[Address]"}\n   Shares: ${s.sharePercent || 0}%${
          s.isNominee ? " (Nominee Director)" : s.isOfficer ? " (Director)" : ""
        }`,
    )
    .join("\n\n");
}

export function generateForm28(state: IncorporationState, subscriber: Subscriber): string {
  const name = state.proposedNames[0] || "[Proposed Company Name]";
  return `FORM 28
CONSENT TO ACT AS DIRECTOR
(Under Section 167, Companies Act, 2017)

Company: ${name}

I, ${subscriber.fullName || "[Director's Full Name]"}, S/O, D/O, W/O ${
    subscriber.parentName || "[Father's/Spouse's Name]"
  }, holder of CNIC No. ${subscriber.cnic || "[CNIC]"}, resident of ${
    subscriber.address || "[Address]"
  }, do hereby consent to act as a ${subscriber.isNominee ? "Nominee Director" : "Director"} of ${name}.

I confirm that I am not disqualified from acting as a director under Section 153 of the Companies Act, 2017, including that I am not an undischarged insolvent and have not been convicted of an offence involving fraud or a moral turpitude.

Mobile: ${subscriber.mobile || "[Mobile — must be registered against this CNIC with biometric verification]"}
Email: ${subscriber.email || "[Email]"}

Signature: _________________________
${subscriber.fullName || "[Director's Name]"}

Dated: ${today()}

Note: SECP sends a 4-digit digital PIN via OTP to the mobile number on file — it must be biometrically registered against this CNIC with your mobile network operator.`;
}

export function generateComplianceChecklist(state: IncorporationState): string {
  const name = state.proposedNames[0] || "[Proposed Company Name]";
  return `DAY 1–30 POST-INCORPORATION COMPLIANCE CHECKLIST
${name}

Day 1–7:
[ ] Download the Certificate of Incorporation and CUIN from eZfile.
[ ] Collect the auto-provisioned Corporate NTN from FBR (issued via the National Single Window).
[ ] Open a corporate bank account using the Certificate of Incorporation, MOA/AOA, and directors' CNICs.

Day 7–15:
[ ] Confirm EOBI employer registration (auto-provisioned via NSW) if the company will have employees.
[ ] Confirm provincial social security registration — ${
    state.province === "Sindh" ? "SESSI (Sindh)" : state.province === "Punjab" ? "PESSI (Punjab)" : "the relevant provincial social security institution"
  }.
[ ] Issue share certificates to all subscribers per the shareholding table in the MOA.

Day 15–30:
[ ] Hold the first board meeting and record minutes (appointment of officers, bank signatories, auditor if applicable).
[ ] Register for sales tax with FBR/provincial revenue authority if the business will supply taxable goods/services.

Within 90 days:
[ ] Appoint the company's first auditor (mandatory for most Pvt Ltd companies) — see LegalPak's Financial Statements desk.

Ongoing:
[ ] File the Ultimate Beneficial Owner declaration (Form 45) with SECP.
[ ] Track the Form A annual return and AGM deadlines on LegalPak's compliance calendar.

This checklist is indicative, not exhaustive — confirm applicability with the company's auditor/company secretary.`;
}

/* ---------------------------------------------------------------------- */
/* eZfile visual field-mapping guide                                       */
/* ---------------------------------------------------------------------- */

export type EzfileMapping = { tab: string; field: string; value: string };

export function buildEzfileMapping(state: IncorporationState): EzfileMapping[] {
  const entity = getEntityType(state.entityType);
  return [
    { tab: "Tab 1: Company Info", field: "Proposed Name (Priority 1)", value: state.proposedNames[0] || "[Name 1]" },
    { tab: "Tab 1: Company Info", field: "Proposed Name (Priority 2)", value: state.proposedNames[1] || "[Name 2]" },
    { tab: "Tab 1: Company Info", field: "Proposed Name (Priority 3)", value: state.proposedNames[2] || "[Name 3]" },
    { tab: "Tab 1: Company Info", field: "Company Type", value: entity.title },
    { tab: "Tab 1: Company Info", field: "Principal Line of Business", value: state.principalBusiness },
    { tab: "Tab 2: Registered Office", field: "Address", value: state.registeredAddress || "[Address]" },
    { tab: "Tab 2: Registered Office", field: "Province", value: state.province || "[Province]" },
    { tab: "Tab 3: Capital", field: "Authorized Capital", value: pkr(state.authorizedCapital) },
    { tab: "Tab 3: Capital", field: "Share Face Value", value: pkr(state.shareFaceValue) },
    { tab: "Tab 3: Capital", field: "Paid-Up Capital", value: pkr(state.paidUpCapital) },
    {
      tab: "Tab 4: Officers",
      field: `${officerLabel(state.entityType)} CNICs`,
      value: state.subscribers.filter((s) => s.isOfficer).map((s) => s.cnic || "[CNIC]").join(", ") || "[none entered]",
    },
    {
      tab: "Tab 5: Subscribers",
      field: "Shareholding table",
      value: `${state.subscribers.length} subscriber(s), ${totalSharePercent(state.subscribers)}% allocated`,
    },
    { tab: "Tab 6: Attachments", field: "Upload", value: "MOA, AOA, Form-28 (per director), CNIC copies" },
    { tab: "Tab 7: Payment", field: "Challan", value: pkr(estimateFees(state.authorizedCapital, officerCount(state.subscribers)).total) },
  ];
}
