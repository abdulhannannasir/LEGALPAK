import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyAccounts, type AccountsInput } from "./accounts.ts";

const base: AccountsInput = {
  companyName: "Test Co",
  cuin: "0071234",
  kind: "private",
  paidUp: 0,
  publicLinked: false,
  fyEnd: "2026-06-30",
  agmDate: "2026-09-15",
  incorporationDate: "2020-01-01",
  turnover: 0,
  employees: 0,
  hasSubsidiary: false,
};

describe("classifyAccounts", () => {
  it("exempts a small private company from audit and SECP filing", () => {
    const a = classifyAccounts({ ...base, paidUp: 500_000 });
    assert.equal(a.auditRequired, false);
    assert.equal(a.fileWithSecp, false);
    assert.equal(a.filingDaysAfterAgm, null);
  });

  it("requires audit above the Rs 1 million threshold but not SECP filing below Rs 10 million", () => {
    const a = classifyAccounts({ ...base, paidUp: 5_000_000 });
    assert.equal(a.auditRequired, true);
    assert.equal(a.fileWithSecp, false);
  });

  it("requires SECP filing within 15 days above Rs 10 million paid-up", () => {
    const a = classifyAccounts({ ...base, paidUp: 15_000_000 });
    assert.equal(a.fileWithSecp, true);
    assert.equal(a.filingDaysAfterAgm, 15);
  });

  it("gives listed companies 30 days instead of 15", () => {
    const a = classifyAccounts({ ...base, kind: "listed", paidUp: 15_000_000 });
    assert.equal(a.filingDaysAfterAgm, 30);
  });

  it("treats a public-linked small company as audit-required regardless of capital", () => {
    const a = classifyAccounts({ ...base, paidUp: 100_000, publicLinked: true });
    assert.equal(a.auditRequired, true);
    assert.equal(a.fileWithSecp, true);
    assert.ok(a.flags.some((f) => f.title.includes("public-linked")));
  });

  it("flags an AGM held more than 120 days after the financial year end", () => {
    const a = classifyAccounts({ ...base, fyEnd: "2026-06-30", agmDate: "2026-11-15" });
    assert.ok(a.flags.some((f) => f.title.includes("120 days")));
  });

  it("does not flag an AGM within 120 days of the financial year end", () => {
    const a = classifyAccounts({ ...base, fyEnd: "2026-06-30", agmDate: "2026-09-20" });
    assert.ok(!a.flags.some((f) => f.title.includes("120 days")));
  });

  it("computes the first AGM as 16 calendar months after incorporation, not 480 days", () => {
    const a = classifyAccounts({ ...base, incorporationDate: "2024-01-31" });
    // 16 months after 31 Jan 2024 is 31 May 2025, not the ~480-day mark.
    assert.equal(a.firstAgmDue, "2025-05-31");
  });

  it("requires a QCR-rated firm once large-company thresholds are met", () => {
    const a = classifyAccounts({ ...base, paidUp: 250_000_000 });
    assert.equal(a.qcr, true);
  });

  it("returns a low-severity fallback flag when nothing else triggers", () => {
    const a = classifyAccounts({ ...base, paidUp: 500_000, fyEnd: "", agmDate: "" });
    assert.ok(a.flags.length >= 1);
  });
});
