import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { form9Advice, type Form9Input } from "./form9.ts";

const base: Form9Input = {
  companyName: "Test Co",
  cuin: "0071234",
  kind: "private",
  currentDirectors: 2,
  event: "induct",
  incomingName: "Ayesha Raza",
  incomingCnic: "3520212345671",
  outgoingName: "",
  outgoingCnic: "",
  modeIn: "Elected",
  modeOut: "Resigned",
  effectiveDate: "2026-05-01",
  designation: "Director",
};

describe("form9Advice", () => {
  it("computes the correct minimum director count per company kind", () => {
    assert.equal(form9Advice({ ...base, kind: "smc" }).min, 1);
    assert.equal(form9Advice({ ...base, kind: "private" }).min, 2);
    assert.equal(form9Advice({ ...base, kind: "public" }).min, 3);
  });

  it("flags a cessation that would drop the board below the statutory minimum", () => {
    const a = form9Advice({ ...base, kind: "private", currentDirectors: 2, event: "cease" });
    assert.equal(a.after, 1);
    assert.equal(a.belowMin, true);
    assert.ok(a.flags.some((f) => f.title.includes("below statutory minimum")));
  });

  it("does not flag an induction that keeps the board at or above minimum", () => {
    const a = form9Advice({ ...base, kind: "private", currentDirectors: 2, event: "induct" });
    assert.equal(a.after, 3);
    assert.equal(a.belowMin, false);
  });

  it("computes the filing deadline as 15 days after the effective date", () => {
    const a = form9Advice({ ...base, effectiveDate: "2026-05-01" });
    assert.equal(a.due, "2026-05-16");
  });

  it("flags a missing CNIC for an incoming director", () => {
    const a = form9Advice({ ...base, event: "induct", incomingCnic: "" });
    assert.ok(a.flags.some((f) => f.title.includes("CNIC")));
  });

  it("does not require incoming CNIC checks for a pure cessation", () => {
    const a = form9Advice({
      ...base,
      event: "cease",
      incomingCnic: "",
      outgoingName: "Bilal Ahmed",
      outgoingCnic: "3520276543213",
    });
    assert.ok(!a.flags.some((f) => f.title.includes("Incoming person")));
  });
});
