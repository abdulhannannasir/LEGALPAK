import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formAAdvice, type FormAInput } from "./form-a.ts";

const base: FormAInput = {
  companyName: "Test Co",
  kind: "private",
  paidUp: 1_000_000,
  changed: false,
  agmDate: "2026-10-01",
  fyEnd: "2026-06-30",
};

describe("formAAdvice", () => {
  it("needs no annual return for a small unchanged private company", () => {
    const a = formAAdvice({ ...base, kind: "private", paidUp: 1_000_000, changed: false });
    assert.equal(a.which, "No annual return");
  });

  it("still requires Form A once particulars changed, even for a small company", () => {
    const a = formAAdvice({ ...base, kind: "private", paidUp: 1_000_000, changed: true });
    assert.equal(a.which, "Form A");
  });

  it("routes a public company to Form 24", () => {
    const a = formAAdvice({ ...base, kind: "public", changed: false });
    assert.equal(a.which, "Form 24");
  });

  it("routes a listed company to Form 24", () => {
    const a = formAAdvice({ ...base, kind: "listed", changed: false });
    assert.equal(a.which, "Form 24");
  });

  it("routes a larger private company (paid-up > Rs 3m) to Form 24 when unchanged", () => {
    const a = formAAdvice({ ...base, kind: "private", paidUp: 5_000_000, changed: false });
    assert.equal(a.which, "Form 24");
  });

  it("always needs Form A for an inactive company", () => {
    const a = formAAdvice({ ...base, kind: "inactive", changed: false });
    assert.equal(a.which, "Form A");
  });

  it("computes the due date as 30 days after the AGM", () => {
    const a = formAAdvice({ ...base, agmDate: "2026-10-01" });
    assert.equal(a.due, "2026-10-31");
  });

  it("returns null due date when no AGM date is given", () => {
    const a = formAAdvice({ ...base, agmDate: "" });
    assert.equal(a.due, null);
  });

  it("flags that an officer change needs Form 9 as well", () => {
    const a = formAAdvice({ ...base, changed: true });
    assert.ok(a.flags.some((f) => f.title.includes("Officer change")));
  });
});
