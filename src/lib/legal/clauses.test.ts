import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLAUSE_MODULES, clauseById, recommendedClauseIds, renderAdditionalClauses } from "./clauses.ts";

describe("CLAUSE_MODULES", () => {
  it("gives every clause an explanation and a risk-if-omitted note", () => {
    for (const m of CLAUSE_MODULES) {
      assert.ok(m.explanation.length > 0, `${m.id} needs an explanation`);
      assert.ok(m.riskIfOmitted.length > 0, `${m.id} needs a riskIfOmitted note`);
    }
  });

  it("has unique ids", () => {
    const ids = new Set(CLAUSE_MODULES.map((m) => m.id));
    assert.equal(ids.size, CLAUSE_MODULES.length);
  });
});

describe("recommendedClauseIds", () => {
  it("recommends confidentiality for an NDA-adjacent service agreement", () => {
    assert.ok(recommendedClauseIds("service").includes("confidentiality"));
  });

  it("recommends arbitration for a shareholders' agreement", () => {
    assert.ok(recommendedClauseIds("shareholders").includes("arbitration"));
  });

  it("returns an empty list for an unknown type", () => {
    assert.deepEqual(recommendedClauseIds("not-a-real-type"), []);
  });
});

describe("clauseById", () => {
  it("finds a clause by id", () => {
    assert.equal(clauseById("indemnity")?.label, "Indemnity");
  });

  it("returns undefined for an unknown id", () => {
    assert.equal(clauseById("nope"), undefined);
  });
});

describe("renderAdditionalClauses", () => {
  it("returns an empty string when nothing is selected", () => {
    assert.equal(renderAdditionalClauses([], { city: "Lahore", a: "A", b: "B" }), "");
  });

  it("numbers the selected clauses in order", () => {
    const out = renderAdditionalClauses(["confidentiality", "force_majeure"], { city: "Lahore", a: "A", b: "B" });
    assert.ok(out.includes("1. Confidentiality:"));
    assert.ok(out.includes("2. Force Majeure:"));
  });
});
