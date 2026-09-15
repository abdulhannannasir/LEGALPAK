import { renderAdditionalClauses } from "./clauses.ts";

export const CONTRACT_CATEGORIES = [
  "commercial",
  "employment",
  "corporate",
  "property",
  "finance",
  "authority",
  "notices",
] as const;
export type ContractCategory = (typeof CONTRACT_CATEGORIES)[number];

export const CONTRACT_CATEGORY_LABEL: Record<ContractCategory, string> = {
  commercial: "Commercial agreements",
  employment: "Employment & engagement",
  corporate: "Corporate & investment",
  property: "Property & real estate",
  finance: "Finance",
  authority: "Authority & compliance",
  notices: "Notices & instruments",
};

export type ContractTypeMeta = {
  id: string;
  title: string;
  category: ContractCategory;
  partyA: string;
  partyB: string;
  /** One-line description for the library card and search results. */
  description: string;
  /** Label for the questionnaire's main scope/subject-matter field. */
  extraLabel: string;
  extraPlaceholder: string;
  /** Extra search terms beyond the title (common names, abbreviations). */
  aliases: string[];
  /**
   * When set, this "type" has no questionnaire of its own here — the library
   * links out to the already-built, purpose-specific generator instead of
   * duplicating it (see `src/lib/notices/notices.ts`).
   */
  externalRoute?: string;
};

export const CONTRACT_TYPES: ContractTypeMeta[] = [
  {
    id: "service",
    title: "Service Agreement",
    category: "commercial",
    partyA: "Service Provider",
    partyB: "Client",
    description: "Ongoing or project-based services delivered for a fee.",
    extraLabel: "Scope of services",
    extraPlaceholder: "e.g. monthly bookkeeping and tax-filing support",
    aliases: ["consulting", "freelance", "statement of work", "sow"],
  },
  {
    id: "vendor",
    title: "Vendor Agreement",
    category: "commercial",
    partyA: "Company",
    partyB: "Vendor",
    description: "Buying goods or services from a supplier on agreed commercial terms.",
    extraLabel: "Goods/services supplied, price & delivery",
    extraPlaceholder: "e.g. supply of 500 office chairs, delivered in two batches",
    aliases: ["supplier agreement", "procurement", "purchase order"],
  },
  {
    id: "distribution",
    title: "Distribution Agreement",
    category: "commercial",
    partyA: "Principal / Supplier",
    partyB: "Distributor",
    description: "Appoints a distributor to market and resell your products in a territory.",
    extraLabel: "Products, territory & exclusivity",
    extraPlaceholder: "e.g. exclusive distribution of [product line] across Punjab",
    aliases: ["distributor agreement", "reseller", "dealer"],
  },
  {
    id: "agency",
    title: "Agency Agreement",
    category: "commercial",
    partyA: "Principal",
    partyB: "Agent",
    description: "Appoints an agent to act, negotiate or contract on your behalf.",
    extraLabel: "Scope of the agent's authority",
    extraPlaceholder: "e.g. sourcing and negotiating supplier contracts in Karachi",
    aliases: ["sales agent", "representative", "commission agent"],
  },
  {
    id: "nda",
    title: "Non-Disclosure Agreement (NDA)",
    category: "commercial",
    partyA: "Disclosing Party",
    partyB: "Receiving Party",
    description: "Protects confidential information shared between two parties.",
    extraLabel: "Purpose of the disclosure",
    extraPlaceholder: "e.g. evaluating a potential investment in the Company",
    aliases: ["confidentiality agreement", "non-disclosure"],
  },
  {
    id: "employment",
    title: "Employment Agreement",
    category: "employment",
    partyA: "Employer",
    partyB: "Employee",
    description: "Hires an employee on agreed pay, role, probation and notice terms.",
    extraLabel: "Position & duties",
    extraPlaceholder: "e.g. Senior Accountant, reporting to the CFO",
    aliases: ["employee contract", "offer letter", "job contract"],
  },
  {
    id: "independent_contractor",
    title: "Independent Contractor Agreement",
    category: "employment",
    partyA: "Company",
    partyB: "Contractor",
    description: "Engages a contractor or freelancer for defined deliverables — not an employee.",
    extraLabel: "Services & deliverables",
    extraPlaceholder: "e.g. design and delivery of the Q3 marketing campaign",
    aliases: ["freelancer agreement", "consultant agreement", "gig"],
  },
  {
    id: "partnership",
    title: "Partnership Agreement",
    category: "corporate",
    partyA: "Partner 1",
    partyB: "Partner 2",
    description: "Forms a partnership firm and sets out capital and profit/loss sharing.",
    extraLabel: "Nature of business",
    extraPlaceholder: "e.g. retail trading of imported electronics",
    aliases: ["partnership deed", "firm"],
  },
  {
    id: "jv",
    title: "Joint Venture (JV) Agreement",
    category: "corporate",
    partyA: "First Party",
    partyB: "Second Party",
    description: "A contractual collaboration on a specific project, short of a full partnership.",
    extraLabel: "Project / purpose of the venture",
    extraPlaceholder: "e.g. joint bid and execution of a construction contract",
    aliases: ["joint venture", "collaboration agreement"],
  },
  {
    id: "shareholders",
    title: "Shareholders' Agreement",
    category: "corporate",
    partyA: "Shareholder 1",
    partyB: "Shareholder 2",
    description: "Governs how co-shareholders run, fund and exit a company together.",
    extraLabel: "Company name / CUIN",
    extraPlaceholder: "e.g. Horizon Ventures (Pvt) Ltd — CUIN 0123456",
    aliases: ["sha", "investor agreement", "co-founder agreement"],
  },
  {
    id: "loan",
    title: "Loan Agreement",
    category: "finance",
    partyA: "Lender",
    partyB: "Borrower",
    description: "Documents a loan's principal, terms, security and repayment schedule.",
    extraLabel: "Principal, markup/interest, tenure & repayment",
    extraPlaceholder: "e.g. PKR 2,000,000, interest-free, repayable over 12 months",
    aliases: ["lending agreement", "loan note", "borrowing"],
  },
  {
    id: "rent",
    title: "Lease Agreement",
    category: "property",
    partyA: "Landlord",
    partyB: "Tenant",
    description: "Longer-term lease of a commercial or residential property.",
    extraLabel: "Property address & description",
    extraPlaceholder: "e.g. Shop No. 4, Ground Floor, Blue Area, Islamabad",
    aliases: ["rent agreement", "lease", "landlord tenant"],
  },
  {
    id: "tenancy",
    title: "Tenancy Agreement",
    category: "property",
    partyA: "Landlord",
    partyB: "Tenant",
    description: "Shorter-term residential or commercial tenancy arrangement.",
    extraLabel: "Property address & permitted use",
    extraPlaceholder: "e.g. Flat 12-B, DHA Phase 6, Karachi — residential use only",
    aliases: ["rental agreement", "short-term tenancy"],
  },
  {
    id: "sale",
    title: "Bayana Agreement (Agreement to Sell)",
    category: "property",
    partyA: "Seller",
    partyB: "Buyer",
    description: "Earnest-money agreement to sell immovable property, ahead of the registered sale deed.",
    extraLabel: "Property description & sale price",
    extraPlaceholder: "e.g. Plot No. 45, Sector G-11, Islamabad — total price PKR 25,000,000",
    aliases: ["bayana", "earnest money", "property sale agreement"],
  },
  {
    id: "poa",
    title: "Power of Attorney",
    category: "authority",
    partyA: "Principal",
    partyB: "Attorney / Agent",
    description: "Authorises someone to act on your behalf for specific or general acts.",
    extraLabel: "Powers granted",
    extraPlaceholder: "e.g. to sell, transfer and register Plot No. 45, Sector G-11, Islamabad",
    aliases: ["mukhtarnama", "general power of attorney", "gpa", "spa"],
  },
  {
    id: "undertaking",
    title: "Undertaking",
    category: "authority",
    partyA: "Undertaking given by",
    partyB: "Undertaking given in favour of",
    description: "A formal written promise to do (or refrain from doing) something.",
    extraLabel: "What is being undertaken",
    extraPlaceholder: "e.g. to clear the outstanding dues within 60 days",
    aliases: ["affirmation letter", "guarantee letter", "written promise"],
  },
  {
    id: "affidavit",
    title: "Affidavit",
    category: "authority",
    partyA: "Deponent",
    partyB: "To be used before / concerning",
    description: "A sworn written statement of facts, to be attested before a Notary/Oath Commissioner.",
    extraLabel: "Statement of facts (numbered)",
    extraPlaceholder: "e.g. that I am the lawful owner of CNIC No. ... and have not remarried",
    aliases: ["sworn statement", "declaration", "oath"],
  },
  {
    id: "legal_notice",
    title: "Legal Notice",
    category: "notices",
    partyA: "Party A",
    partyB: "Party B",
    description: "Pre-litigation legal notice — e.g. for a dishonoured cheque under s. 489-F PPC.",
    extraLabel: "",
    extraPlaceholder: "",
    aliases: ["cheque bounce", "489-f", "ppc notice"],
    externalRoute: "/notices",
  },
  {
    id: "demand_notice",
    title: "Demand Notice",
    category: "notices",
    partyA: "Party A",
    partyB: "Party B",
    description: "Pre-litigation demand for recovery of outstanding dues.",
    extraLabel: "",
    extraPlaceholder: "",
    aliases: ["recovery notice", "dues", "payment demand"],
    externalRoute: "/notices",
  },
];

export type ContractTypeId = (typeof CONTRACT_TYPES)[number]["id"];

export function contractType(id: string): ContractTypeMeta | undefined {
  return CONTRACT_TYPES.find((c) => c.id === id);
}

export function contractPartyLabels(id: string): { a: string; b: string } {
  const t = contractType(id);
  return { a: t?.partyA ?? "Party A", b: t?.partyB ?? "Party B" };
}

/** Simple, dependency-free search across title/description/category/aliases. */
export function searchContractTypes(query: string): ContractTypeMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return CONTRACT_TYPES;
  return CONTRACT_TYPES.filter((t) => {
    const haystack = [t.title, t.description, CONTRACT_CATEGORY_LABEL[t.category], ...t.aliases]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * Splices the selected additional clauses in before the witness/signature
 * block. Most templates share the exact `wit` string built below, so a
 * simple substring replace finds the right spot; templates that sign off
 * differently (Power of Attorney, Undertaking, Affidavit) fall back to
 * appending at the end instead of guessing at a mid-document insertion point.
 */
function insertAdditionalClauses(
  text: string,
  witBlock: string,
  additionalClauses: string,
): string {
  if (!additionalClauses) return text;
  if (text.includes(witBlock)) {
    return text.replace(witBlock, `${additionalClauses}\n${witBlock}`);
  }
  return `${text}\n\n${additionalClauses}`;
}

export function generateContract(
  id: string,
  a: string,
  b: string,
  city: string,
  extra: string,
  clauseIds: string[] = [],
): string {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const parties = `${a || "[Party A]"} and ${b || "[Party B]"}`;
  const law = `This agreement is governed by the laws of the Islamic Republic of Pakistan. Courts at ${city || "[City]"} shall have jurisdiction.`;
  const wit = `IN WITNESS WHEREOF the parties have signed at ${city || "[City]"} on ${date}.\n\n_________________          _________________\n${a || "Party A"}                         ${b || "Party B"}\n\nWITNESSES:\n1. _________________     2. _________________\n`;
  const additionalClauses = renderAdditionalClauses(clauseIds, { city, a, b });
  const result = generateBaseContract(id, a, b, city, extra, date, parties, law, wit);
  return insertAdditionalClauses(result, wit, additionalClauses);
}

function generateBaseContract(
  id: string,
  a: string,
  b: string,
  city: string,
  extra: string,
  date: string,
  parties: string,
  law: string,
  wit: string,
): string {
  if (id === "employment") {
    return `EMPLOYMENT CONTRACT\n\nThis contract is made at ${city || "[City]"} on ${date} between ${a || "[Employer]"} (Employer) and ${b || "[Employee]"} (Employee).\n\n1. Position and duties: ${extra || "[role]"}\n2. Remuneration as agreed in writing.\n3. Probation and notice as required by applicable provincial labour law.\n4. Confidentiality of Employer information.\n5. ${law}\n\n${wit}\nNOTE: Written contracts are required for workers. Stamp paper recommended.`;
  }
  if (id === "rent") {
    return `RENT AGREEMENT\n\nLandlord ${a || "[Landlord]"} lets to Tenant ${b || "[Tenant]"} the premises: ${extra || "[property]"}.\n\nTerm, rent and deposit as agreed. Tenant shall not sub-let without consent.\nLeases exceeding one year generally require registration under the Registration Act, 1908.\n${law}\n\n${wit}`;
  }
  if (id === "sale") {
    return `AGREEMENT TO SELL (BAYANA)\n\nSeller ${a || "[Seller]"} agrees to sell and Buyer ${b || "[Buyer]"} agrees to purchase:\n${extra || "[property description]"}\n\nThis is not a conveyance. Title passes only on execution and registration of the Sale Deed. Stamp duty and registration of the deed are mandatory for immovable property.\n${law}\n\n${wit}`;
  }
  if (id === "nda") {
    return `NON-DISCLOSURE AGREEMENT\n\nBetween ${parties}.\nPurpose: ${extra || "[purpose]"}.\nThe Receiving Party shall use confidential information solely for the Purpose and protect it with reasonable care.\n${law}\n\n${wit}`;
  }
  if (id === "partnership") {
    return `PARTNERSHIP DEED\n\nThis deed of partnership is made at ${city || "[City]"} on ${date} between ${a || "[Partner 1]"} and ${b || "[Partner 2]"} (the Partners).\n\n1. Business: ${extra || "[nature of business]"}.\n2. Capital contribution, profit and loss sharing ratio as agreed and recorded in Schedule A.\n3. Bank account operation, admission/retirement of partners and dissolution as agreed.\n4. Governed by the Partnership Act, 1932. Registration with the Registrar of Firms is recommended for the right to sue third parties (s. 69).\n5. ${law}\n\n${wit}\nExecute on non-judicial stamp paper; register the firm with the provincial Registrar of Firms.`;
  }
  if (id === "jv") {
    return `JOINT VENTURE AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[First Party]"} and ${b || "[Second Party]"} (the Parties) to jointly undertake:\n${extra || "[project / purpose]"}.\n\n1. Structure: unincorporated JV / contractual collaboration (not a partnership unless expressly agreed).\n2. Contribution, revenue/cost sharing, management committee and decision-making as agreed in Schedule A.\n3. IP created during the JV, confidentiality, exclusivity (if any) and exit/termination mechanics as agreed.\n4. Nothing herein creates a partnership under the Partnership Act, 1932 unless the Parties expressly elect to register as a firm.\n5. ${law}\n\n${wit}`;
  }
  if (id === "loan") {
    return `LOAN AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Lender]"} (Lender) and ${b || "[Borrower]"} (Borrower).\n\n1. Terms (principal, interest/markup if any, tenure, repayment schedule): ${extra || "[terms]"}.\n2. Interest, if charged, should be structured to be Shariah-compliant / markup-based per the Lender's practice; state clearly if interest-free.\n3. Security, if any, and default/acceleration clause as agreed.\n4. Repayment by cash-equivalent instrument is advisable; a cheque given as security remains subject to s. 489-F PPC if dishonoured.\n5. ${law}\n\n${wit}\nExecute on non-judicial stamp paper appropriate to the loan value.`;
  }
  if (id === "poa") {
    return `POWER OF ATTORNEY\n\nI, ${a || "[Principal]"}, do hereby nominate, constitute and appoint ${b || "[Attorney / Agent]"} as my true and lawful attorney to do the following acts on my behalf:\n${extra || "[specific / general powers — list each act clearly for a special PoA]"}.\n\n1. All acts done by the Attorney under this Power shall be binding on the Principal as if done by the Principal personally.\n2. This Power of Attorney shall remain in force until revoked in writing.\n3. A PoA relating to immovable property should be attested and, where it authorises sale/transfer, registered under the Registration Act, 1908.\n4. ${law}\n\nIN WITNESS WHEREOF the Principal has executed this Power of Attorney at ${city || "[City]"} on ${date}.\n\n_________________\n${a || "Principal"}\n\nWITNESSES:\n1. _________________     2. _________________\n\nNOTE: Attest before a Notary Public / Oath Commissioner; register if it covers immovable property.`;
  }
  if (id === "shareholders") {
    return `SHAREHOLDERS' AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Shareholder 1]"} and ${b || "[Shareholder 2]"} (the Shareholders) in relation to their shareholding in:\n${extra || "[Company Name / CUIN]"}.\n\n1. Board composition, reserved matters and quorum requirements.\n2. Transfer restrictions: right of first refusal, tag-along and drag-along rights.\n3. Dividend policy, deadlock resolution and non-compete / confidentiality undertakings.\n4. This agreement is supplemental to and does not override the Companies Act, 2017 or the Company's Articles of Association; amend the Articles to bind third parties where needed.\n5. ${law}\n\n${wit}`;
  }
  if (id === "vendor") {
    return `VENDOR AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Company]"} ("Company") and ${b || "[Vendor]"} ("Vendor").\n\n1. Supply: The Vendor shall supply the goods/services described as: ${extra || "[goods/services, price and delivery terms]"}.\n2. Price, payment terms and delivery schedule as agreed in Schedule A.\n3. Where this agreement involves the sale of goods, the Sale of Goods Act, 1930 governs implied conditions and warranties (including as to title, quality and fitness for purpose) unless expressly varied in writing.\n4. Inspection, rejection rights and remedies for defective or late supply as agreed.\n5. Either party may terminate on written notice for material, uncured breach.\n6. ${law}\n\n${wit}\nExecute on non-judicial stamp paper of appropriate provincial value.`;
  }
  if (id === "distribution") {
    return `DISTRIBUTION AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Principal / Supplier]"} ("Principal") and ${b || "[Distributor]"} ("Distributor").\n\n1. Appointment: The Principal appoints the Distributor to market, sell and distribute the products described as: ${extra || "[products, territory and exclusivity]"}, within the agreed territory, on an exclusive/non-exclusive basis as specified in Schedule A.\n2. Pricing, minimum purchase/sales targets, payment terms and stock/inventory obligations as agreed.\n3. The sale of goods between the parties is governed by the Sale of Goods Act, 1930 in addition to the terms agreed here.\n4. Trademark and brand usage by the Distributor is licensed solely for the purpose of this agreement and does not transfer ownership of any intellectual property.\n5. Term, renewal, and consequences of termination (stock buy-back, wind-down period) as agreed.\n6. ${law}\n\n${wit}`;
  }
  if (id === "agency") {
    return `AGENCY AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Principal]"} ("Principal") and ${b || "[Agent]"} ("Agent").\n\n1. Appointment: The Principal appoints the Agent to act on its behalf for: ${extra || "[scope of the agent's authority]"}, within the scope and territory agreed in Schedule A.\n2. The relationship of Principal and Agent is governed by Chapter X (Sections 182-238) of the Contract Act, 1872. The Agent shall act within the authority conferred and owes the Principal the duties of good faith, diligence and proper accounts under that Chapter.\n3. Commission/remuneration, expenses and reporting obligations as agreed.\n4. The Agent shall not bind the Principal beyond the authority granted, and any act in excess of authority is not binding on the Principal unless ratified.\n5. Termination and its effect on accrued commission as agreed.\n6. ${law}\n\n${wit}`;
  }
  if (id === "independent_contractor") {
    return `INDEPENDENT CONTRACTOR AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Company]"} ("Company") and ${b || "[Contractor]"} ("Contractor").\n\n1. Engagement: The Contractor shall provide the services described as: ${extra || "[services and deliverables]"}, as an independent contractor and not as an employee.\n2. Nothing in this agreement creates an employer-employee relationship; the Contractor is responsible for its own taxes, and provincial labour-law entitlements (leave, provident fund, gratuity, statutory termination notice) do not apply to this engagement.\n3. Fees, invoicing and payment terms as agreed.\n4. Ownership of work product/IP created under this engagement, and confidentiality, as agreed.\n5. Either party may terminate on written notice as agreed.\n6. ${law}\n\n${wit}\nNOTE: Mischaracterizing an employment relationship as a contractor engagement can expose the Company to labour-law liability — ensure the working arrangement genuinely reflects contractor status (control, tools, exclusivity) and not employment in substance.`;
  }
  if (id === "tenancy") {
    return `TENANCY AGREEMENT\n\nLandlord ${a || "[Landlord]"} lets to Tenant ${b || "[Tenant]"} the premises: ${extra || "[property address and permitted use]"}, for the use agreed.\n\n1. Tenancy period, rent, advance/security deposit and renewal terms as agreed in Schedule A.\n2. This tenancy is a lease of immovable property within the meaning of Section 105 of the Transfer of Property Act, 1882; rights and obligations not expressly varied here follow that Act.\n3. A tenancy exceeding one year, or reserving a yearly rent, generally requires registration under the Registration Act, 1908.\n4. Eviction, rent increase and dispute-resolution procedures may additionally be governed by the rent-restriction/rented-premises law applicable in the province or territory where the premises are located — confirm the specific statute and forum (Rent Controller) that applies at that location.\n5. Tenant shall not sub-let without the Landlord's prior written consent.\n6. ${law}\n\n${wit}`;
  }
  if (id === "undertaking") {
    return `UNDERTAKING\n\nI/We, ${a || "[Name]"}, of ${city || "[City]"}, do hereby solemnly undertake and affirm as follows, in favour of ${b || "[Party in whose favour this is given]"}:\n\n1. ${extra || "[what is being undertaken]"}\n2. This undertaking is given voluntarily and is intended to be legally binding as a promise enforceable under the Contract Act, 1872.\n3. I/We understand that a breach of this undertaking may result in the legal consequences agreed or available under the law, including where this undertaking is filed before a court, regulator or other authority.\n4. ${law}\n\nIN WITNESS WHEREOF this undertaking is executed at ${city || "[City]"} on ${date}.\n\n_________________\n${a || "[Name]"}\n\nWITNESSES:\n1. _________________     2. _________________\n\nNOTE: Where this undertaking is to be filed with a court, SECP, or other regulator, check that body's own format/affidavit requirements before submission.`;
  }
  if (id === "affidavit") {
    return `AFFIDAVIT\n\nI, ${a || "[Deponent's full name]"}, son/daughter/wife of ___________, holder of CNIC No. ___________, resident of ${city || "[City]"}, do hereby solemnly affirm and declare on oath as follows:\n\n1. ${extra || "[statement of facts, numbered]"}\n2. That the contents of this affidavit are true and correct to the best of my knowledge and belief, and nothing material has been concealed herein.\n3. This affidavit is made under the Qanun-e-Shahadat Order, 1984 and, where filed in judicial proceedings, in accordance with Order XIX of the Code of Civil Procedure, 1908.\n4. Concerning: ${b || "[to be used before / concerning]"}.\n\nDEPONENT\n\n_________________\n${a || "[Deponent]"}\n\nVERIFICATION\nVerified at ${city || "[City]"} on ${date} that the contents of the above affidavit are true and correct to the best of my knowledge and belief.\n\n_________________\nDeponent\n\nNOTE: Sign before a Notary Public / Oath Commissioner, who administers the oath and attests the affidavit — an unattested affidavit is generally not admissible in judicial or regulatory proceedings.`;
  }
  return `SERVICE AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Provider]"} (Service Provider) and ${b || "[Client]"} (Client).\n\n1. Services: ${extra || "[scope]"}\n2. Fees as agreed. Consideration is a condition of validity under the Contract Act, 1872.\n3. Confidentiality and IP as agreed.\n4. Either party may terminate on 30 days' written notice.\n5. ${law}\n\n${wit}\nExecute on non-judicial stamp paper of appropriate provincial value.`;
}
