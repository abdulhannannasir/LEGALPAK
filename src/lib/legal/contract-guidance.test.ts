import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeContractRiskFlags, contractGuidance } from "./contract-guidance.ts";

const filled = { a: "Alpha", b: "Beta", city: "Lahore", extra: "some scope", clauses: [] as string[] };

describe("computeContractRiskFlags", () => {
  it("flags missing party names as high severity", () => {
    const flags = computeContractRiskFlags("service", { ...filled, a: "", b: "" });
    assert.ok(flags.some((f) => f.level === "high" && f.title === "Parties not named"));
  });

  it("does not flag named parties", () => {
    const flags = computeContractRiskFlags("service", filled);
    assert.ok(!flags.some((f) => f.title === "Parties not named"));
  });

  it("flags an empty scope field using the type's own field label", () => {
    const flags = computeContractRiskFlags("loan", { ...filled, extra: "" });
    assert.ok(flags.some((f) => f.title.includes("not described")));
  });

  it("suggests a recommended clause that hasn't been selected, with its risk note", () => {
    const flags = computeContractRiskFlags("service", { ...filled, clauses: [] });
    const suggestion = flags.find((f) => f.title.includes("Confidentiality"));
    assert.ok(suggestion);
    assert.equal(suggestion?.level, "med");
  });

  it("stops suggesting a clause once it has been selected", () => {
    const flags = computeContractRiskFlags("service", { ...filled, clauses: ["confidentiality"] });
    assert.ok(!flags.some((f) => f.title.includes("Confidentiality")));
  });

  it("includes the static guidance for the type (e.g. loan interest/Shariah note)", () => {
    const flags = computeContractRiskFlags("loan", filled);
    assert.ok(flags.some((f) => f.title === "Interest / Shariah compliance"));
    assert.ok(flags.some((f) => f.title === "Cheques given as security"));
  });

  it("never invents a flag for a type with no static guidance", () => {
    assert.deepEqual(contractGuidance("nda"), []);
  });
});
