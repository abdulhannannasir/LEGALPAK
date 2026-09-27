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

  it("stays anchored to month-end across a chain instead of drifting to the clamped day", () => {
    // A recurring monthly obligation due on the 31st, advanced one month at a time by completing
    // each occurrence in turn (spawnNextOccurrence's exact usage) — must land on each month's own
    // last day forever, not settle on the 28th once Feb clamps it.
    let due = "2026-01-31";
    const dues: string[] = [];
    for (let i = 0; i < 5; i++) {
      due = addMonthsISO(due, 1) as string;
      dues.push(due);
    }
    assert.deepEqual(dues, ["2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31", "2026-06-30"]);
  });

  it("does not treat an ordinary day as month-end just because a later clamp lands there", () => {
    // The 30th isn't Jan's own last day (Jan has 31), so this step is a plain clamp, not the
    // sticky rule — but the clamp happens to land on Feb 28, which IS Feb's actual last day, so
    // the *next* step is sticky from there.
    assert.equal(addMonthsISO("2026-01-30", 1), "2026-02-28");
    assert.equal(addMonthsISO("2026-02-28", 1), "2026-03-31");
  });
});
