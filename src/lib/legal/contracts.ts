import { renderAdditionalClauses } from "./clauses";

export const CONTRACT_TYPES = [
  { id: "service", title: "Service agreement", partyA: "Service Provider", partyB: "Client" },
  { id: "employment", title: "Employment contract", partyA: "Employer", partyB: "Employee" },
  { id: "rent", title: "Rent / lease", partyA: "Landlord", partyB: "Tenant" },
  { id: "sale", title: "Agreement to sell (bayana)", partyA: "Seller", partyB: "Buyer" },
  { id: "nda", title: "NDA", partyA: "Disclosing Party", partyB: "Receiving Party" },
  { id: "partnership", title: "Partnership deed", partyA: "Partner 1", partyB: "Partner 2" },
  { id: "jv", title: "Joint venture agreement", partyA: "First Party", partyB: "Second Party" },
  { id: "loan", title: "Loan agreement", partyA: "Lender", partyB: "Borrower" },
  { id: "poa", title: "Power of attorney", partyA: "Principal", partyB: "Attorney / Agent" },
  {
    id: "shareholders",
    title: "Shareholders' agreement",
    partyA: "Shareholder 1",
    partyB: "Shareholder 2",
  },
] as const;

export type ContractTypeId = (typeof CONTRACT_TYPES)[number]["id"];

export function contractPartyLabels(id: string): { a: string; b: string } {
  const t = CONTRACT_TYPES.find((c) => c.id === id);
  return { a: t?.partyA ?? "Party A", b: t?.partyB ?? "Party B" };
}

/**
 * Splices the selected additional clauses in before the witness/signature
 * block. Most templates share the exact `wit` string built below, so a
 * simple substring replace finds the right spot; the one template that
 * doesn't (Power of Attorney, which signs off differently) falls back to
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
  return `SERVICE AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Provider]"} (Service Provider) and ${b || "[Client]"} (Client).\n\n1. Services: ${extra || "[scope]"}\n2. Fees as agreed. Consideration is a condition of validity under the Contract Act, 1872.\n3. Confidentiality and IP as agreed.\n4. Either party may terminate on 30 days' written notice.\n5. ${law}\n\n${wit}\nExecute on non-judicial stamp paper of appropriate provincial value.`;
}
