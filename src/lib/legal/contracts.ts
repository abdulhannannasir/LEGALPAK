export const CONTRACT_TYPES = [
  { id: "service", title: "Service agreement" },
  { id: "employment", title: "Employment contract" },
  { id: "rent", title: "Rent / lease" },
  { id: "sale", title: "Agreement to sell (bayana)" },
  { id: "nda", title: "NDA" },
] as const;

export function generateContract(id: string, a: string, b: string, city: string, extra: string): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const parties = `${a || "[Party A]"} and ${b || "[Party B]"}`;
  const law = `This agreement is governed by the laws of the Islamic Republic of Pakistan. Courts at ${city || "[City]"} shall have jurisdiction.`;
  const wit = `IN WITNESS WHEREOF the parties have signed at ${city || "[City]"} on ${date}.\n\n_________________          _________________\n${a || "Party A"}                         ${b || "Party B"}\n\nWITNESSES:\n1. _________________     2. _________________\n`;
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
  return `SERVICE AGREEMENT\n\nThis agreement is made at ${city || "[City]"} on ${date} between ${a || "[Provider]"} (Service Provider) and ${b || "[Client]"} (Client).\n\n1. Services: ${extra || "[scope]"}\n2. Fees as agreed. Consideration is a condition of validity under the Contract Act, 1872.\n3. Confidentiality and IP as agreed.\n4. Either party may terminate on 30 days' written notice.\n5. ${law}\n\n${wit}\nExecute on non-judicial stamp paper of appropriate provincial value.`;
}
