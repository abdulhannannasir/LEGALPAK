import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CONTRACT_TYPES,
  contractPartyLabels,
  contractType,
  generateContract,
  searchContractTypes,
} from "./contracts.ts";

describe("CONTRACT_TYPES", () => {
  it("has 19 entries with unique ids", () => {
    assert.equal(CONTRACT_TYPES.length, 19);
    const ids = new Set(CONTRACT_TYPES.map((t) => t.id));
    assert.equal(ids.size, CONTRACT_TYPES.length);
  });

  it("gives every type a title, category and description", () => {
    for (const t of CONTRACT_TYPES) {
      assert.ok(t.title.length > 0, `${t.id} needs a title`);
      assert.ok(t.description.length > 0, `${t.id} needs a description`);
      assert.ok(t.category.length > 0, `${t.id} needs a category`);
    }
  });

  it("routes legal_notice and demand_notice out to the Legal Notices tool", () => {
    assert.equal(contractType("legal_notice")?.externalRoute, "/notices");
    assert.equal(contractType("demand_notice")?.externalRoute, "/notices");
  });
});

describe("contractPartyLabels", () => {
  it("returns the configured labels for a known type", () => {
    assert.deepEqual(contractPartyLabels("loan"), { a: "Lender", b: "Borrower" });
  });

  it("falls back to generic labels for an unknown type", () => {
    assert.deepEqual(contractPartyLabels("not-a-real-type"), { a: "Party A", b: "Party B" });
  });
});

describe("searchContractTypes", () => {
  it("returns everything for an empty query", () => {
    assert.equal(searchContractTypes("").length, CONTRACT_TYPES.length);
    assert.equal(searchContractTypes("   ").length, CONTRACT_TYPES.length);
  });

  it("matches an alias, not just the title", () => {
    const results = searchContractTypes("bayana");
    assert.ok(results.some((t) => t.id === "sale"));
  });

  it("matches by category label", () => {
    const results = searchContractTypes("property & real estate");
    assert.ok(results.some((t) => t.id === "rent"));
    assert.ok(results.some((t) => t.id === "tenancy"));
  });

  it("is case-insensitive", () => {
    assert.ok(searchContractTypes("SHAREHOLDER").some((t) => t.id === "shareholders"));
  });
});

describe("generateContract — new types", () => {
  const newTypes = [
    "vendor",
    "distribution",
    "agency",
    "independent_contractor",
    "tenancy",
    "undertaking",
    "affidavit",
  ];

  for (const id of newTypes) {
    it(`renders a non-empty ${id} draft naming both parties and the city`, () => {
      const text = generateContract(id, "Alpha Traders", "Beta Holdings", "Lahore", "some scope", []);
      assert.ok(text.length > 100);
      assert.ok(text.includes("Alpha Traders"));
      assert.ok(text.includes("Beta Holdings"));
      assert.ok(text.includes("Lahore"));
    });
  }

  it("appends additional clauses at the end for templates with a custom sign-off (poa/undertaking/affidavit)", () => {
    const text = generateContract("undertaking", "A", "B", "Karachi", "clear the dues", ["confidentiality"]);
    assert.ok(text.includes("ADDITIONAL CLAUSES"));
    assert.ok(text.indexOf("ADDITIONAL CLAUSES") > text.indexOf("IN WITNESS WHEREOF"));
  });

  it("inserts additional clauses before the shared witness block for standard templates", () => {
    const text = generateContract("vendor", "A", "B", "Karachi", "supply of goods", ["confidentiality"]);
    assert.ok(text.includes("ADDITIONAL CLAUSES"));
    assert.ok(text.indexOf("ADDITIONAL CLAUSES") < text.indexOf("IN WITNESS WHEREOF"));
  });
});

describe("generateContract — existing types are unchanged", () => {
  it("still renders the original NDA wording", () => {
    const text = generateContract("nda", "Disco Co", "Recv Co", "Islamabad", "due diligence", []);
    assert.ok(text.startsWith("NON-DISCLOSURE AGREEMENT"));
    assert.ok(text.includes("Between Disco Co and Recv Co."));
  });

  it("still cites the Registration Act for leases over one year", () => {
    const text = generateContract("rent", "L", "T", "Lahore", "shop", []);
    assert.ok(text.includes("Registration Act, 1908"));
  });
});
