import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deadlineReminderHtml, deadlineReminderSubject } from "./deadline-reminder.ts";

const base = {
  companyName: "Horizon Manufacturing (Pvt) Ltd",
  matterTitle: "Financial statements FY26",
  matterTypeLabel: "Financial statements",
  dueDate: "2026-11-04",
  daysBefore: 7,
  matterUrl: "https://legalpak.vercel.app/matters/m_123",
};

describe("deadlineReminderSubject", () => {
  it("says 'in N days' for multi-day thresholds", () => {
    assert.equal(
      deadlineReminderSubject(base),
      "Financial statements due in 7 days — Horizon Manufacturing (Pvt) Ltd",
    );
  });
  it("says 'tomorrow' for the 1-day threshold", () => {
    assert.match(deadlineReminderSubject({ ...base, daysBefore: 1 }), /due tomorrow/);
  });
});

describe("deadlineReminderHtml", () => {
  it("includes the company, matter title, due date, and a link to the matter", () => {
    const html = deadlineReminderHtml(base);
    assert.match(html, /Horizon Manufacturing \(Pvt\) Ltd/);
    assert.match(html, /Financial statements FY26/);
    assert.match(html, /2026-11-04/);
    assert.match(html, /href="https:\/\/legalpak\.vercel\.app\/matters\/m_123"/);
  });
  it("escapes HTML-significant characters in untrusted fields", () => {
    const html = deadlineReminderHtml({ ...base, companyName: "A & B <Ltd>" });
    assert.match(html, /A &amp; B &lt;Ltd&gt;/);
    assert.doesNotMatch(html, /A & B <Ltd>/);
  });
});
