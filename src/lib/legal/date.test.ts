import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addMonthsISO } from "./date.ts";

describe("addMonthsISO", () => {
  it("clamps to the shorter target month instead of overflowing into the next one", () => {
    assert.equal(addMonthsISO("2026-01-31", 1), "2026-02-28");
  });

  it("clamps to Feb 29 in a leap year", () => {
    assert.equal(addMonthsISO("2028-01-31", 1), "2028-02-29");
  });

  it("does not clamp when the target month has enough days", () => {
    assert.equal(addMonthsISO("2026-01-31", 2), "2026-03-31");
  });

  it("carries the year across a December wrap", () => {
    assert.equal(addMonthsISO("2026-12-31", 2), "2027-02-28");
  });

  it("leaves a mid-month date unaffected by clamping", () => {
    assert.equal(addMonthsISO("2026-01-15", 1), "2026-02-15");
  });

  it("keeps the chosen day-of-month rather than snapping to month-end, even from a date that happens to be one", () => {
    // Feb 28, 2026 is Feb's own last day, but that's incidental — a one-time deadline 3 months out
    // must land on the 28th of May, not jump to the 31st just because the anchor date happened to
    // be a short month's end.
    assert.equal(addMonthsISO("2026-02-28", 3), "2026-05-28");
  });
});
