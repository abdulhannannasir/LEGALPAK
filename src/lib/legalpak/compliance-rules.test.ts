import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeRuleDueDate, type RecurrenceConfig } from "./compliance-rule-logic.ts";
import type { Company } from "./types.ts";

function company(overrides: Partial<Company>): Company {
  return {
    id: "co_1",
    workspace_id: "ws_1",
    name: "Test Co",
    cuin: null,
    ntn: null,
    company_type: null,
    paid_up_capital: null,
    turnover: null,
    employees: null,
    incorporation_date: null,
    financial_year_end: null,
    agm_date: null,
    public_linked: false,
    has_subsidiary: false,
    status: "active",
    registered_address: null,
    business_activity: null,
    province: null,
    city: null,
    archived_at: null,
    ...overrides,
  };
}

describe("computeRuleDueDate — annual, anchored", () => {
  it("keys the period by the reference cycle year, not the due date's own year, when a positive offset pushes the due date into the next year", () => {
    const recurrence: RecurrenceConfig = { frequency: "annual", anchor: "financial_year_end", offsetDays: 35 };
    const c = company({ financial_year_end: "2020-12-31" });
    const result = computeRuleDueDate(recurrence, c, "2026-06-15");
    assert.equal(result.dueDate, "2027-02-04");
    assert.equal(result.periodKey, "2026");
  });

  it("advances the period key by exactly one year per cycle, so spawnNextOccurrence's periodEndExclusive(periodKey) + 1yr never skips a fiscal year-end", () => {
    const recurrence: RecurrenceConfig = { frequency: "annual", anchor: "financial_year_end", offsetDays: 35 };
    const c = company({ financial_year_end: "2020-12-31" });
    // Simulates spawnNextOccurrence: after completing the 2026-period obligation, it recomputes
    // from periodEndExclusive("2026") = "2027-01-01" — the very next calendar year, unconditionally.
    const cycle2026 = computeRuleDueDate(recurrence, c, "2026-06-15");
    const cycle2027 = computeRuleDueDate(recurrence, c, "2027-01-01");
    assert.equal(cycle2026.periodKey, "2026");
    assert.equal(cycle2027.periodKey, "2027");
    assert.equal(cycle2027.dueDate, "2028-02-04");
  });

  it("keys the period by the reference cycle year, not the due date's own (earlier) year, when a negative offset pulls the due date into the previous year", () => {
    const recurrence: RecurrenceConfig = { frequency: "annual", anchor: "agm_date", offsetDays: -10 };
    const c = company({ agm_date: "2020-01-05" });
    const result = computeRuleDueDate(recurrence, c, "2026-03-01");
    assert.equal(result.dueDate, "2025-12-26");
    assert.equal(result.periodKey, "2026");
  });

  it("still advances one cycle forward with a negative offset, instead of recomputing the same due date forever", () => {
    const recurrence: RecurrenceConfig = { frequency: "annual", anchor: "agm_date", offsetDays: -10 };
    const c = company({ agm_date: "2020-01-05" });
    const cycle2026 = computeRuleDueDate(recurrence, c, "2026-03-01");
    const cycle2027 = computeRuleDueDate(recurrence, c, "2027-01-01");
    assert.notEqual(cycle2026.periodKey, cycle2027.periodKey);
    assert.notEqual(cycle2026.dueDate, cycle2027.dueDate);
  });
});
