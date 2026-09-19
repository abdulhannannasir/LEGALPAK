import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MATTER_TYPES } from "../legalpak/workflow.ts";
import {
  balanceColumns,
  bandForScore,
  breakdownByCategory,
  buildNextActions,
  classifyItem,
  findUntrackedRequirements,
  STANDING_REQUIREMENTS,
  stripCompanySuffix,
  summarizeCompliance,
  type HealthItem,
} from "./compliance-health.ts";

const TODAY = "2026-09-20";

function item(over: Partial<HealthItem> & { id: string }): HealthItem {
  return {
    kind: "obligation",
    title: over.id,
    category: "secp",
    dueDate: null,
    status: "upcoming",
    priority: "medium",
    href: `/compliance/${over.id}`,
    ...over,
  };
}

describe("classifyItem", () => {
  it("recomputes health from the due date, not the stored status", () => {
    assert.equal(classifyItem(item({ id: "a", dueDate: "2026-09-19" }), TODAY).health, "overdue");
    assert.equal(classifyItem(item({ id: "a", dueDate: "2026-09-20" }), TODAY).health, "due_soon");
    assert.equal(classifyItem(item({ id: "a", dueDate: "2026-09-27" }), TODAY).health, "due_soon");
    assert.equal(classifyItem(item({ id: "a", dueDate: "2026-09-28" }), TODAY).health, "upcoming");
  });

  it("treats a sticky in_progress obligation that is past its deadline as overdue", () => {
    assert.equal(classifyItem(item({ id: "a", status: "in_progress", dueDate: "2026-09-01" }), TODAY).health, "overdue");
  });

  it("marks an item with no deadline as needs_setup and never counts it", () => {
    const s = classifyItem(item({ id: "a", dueDate: null }), TODAY);
    assert.equal(s.health, "needs_setup");
    assert.equal(s.counted, false);
  });

  it("stops counting a completed item once its deadline is over a year old", () => {
    assert.equal(classifyItem(item({ id: "a", status: "completed", dueDate: "2026-01-01" }), TODAY).counted, true);
    assert.equal(classifyItem(item({ id: "a", status: "completed", dueDate: "2024-01-01" }), TODAY).counted, false);
  });
});

describe("summarizeCompliance", () => {
  it("has no score — not a flattering 100 — when nothing can be scored", () => {
    assert.equal(summarizeCompliance([], TODAY).score, null);
    const onlySetup = summarizeCompliance([item({ id: "a", dueDate: null })], TODAY);
    assert.equal(onlySetup.score, null);
    assert.equal(onlySetup.band, "not_scored");
    assert.equal(onlySetup.counts.needs_setup, 1);
  });

  it("scores 100 when everything is on track or completed", () => {
    const s = summarizeCompliance(
      [item({ id: "a", dueDate: "2026-12-01" }), item({ id: "b", status: "completed", dueDate: "2026-08-01" })],
      TODAY,
    );
    assert.equal(s.score, 100);
    assert.equal(s.band, "excellent");
    assert.equal(s.capped, false);
  });

  it("gives due-soon a medium penalty and overdue a heavy one", () => {
    const dueSoon = summarizeCompliance([item({ id: "a", dueDate: "2026-09-22" })], TODAY);
    assert.equal(dueSoon.score, 60);
    const overdue = summarizeCompliance([item({ id: "a", dueDate: "2026-09-01" })], TODAY);
    assert.equal(overdue.score, 0);
    assert.equal(overdue.band, "at_risk");
  });

  it("weights by priority", () => {
    const criticalLate = summarizeCompliance(
      [item({ id: "a", dueDate: "2026-09-01", priority: "critical" }), item({ id: "b", dueDate: "2026-12-01", priority: "low" })],
      TODAY,
    );
    const lowLate = summarizeCompliance(
      [item({ id: "a", dueDate: "2026-09-01", priority: "low" }), item({ id: "b", dueDate: "2026-12-01", priority: "critical" })],
      TODAY,
    );
    assert.ok(criticalLate.score! < lowLate.score!);
  });

  it("caps the score below Good whenever anything is overdue", () => {
    const items = [
      item({ id: "late", dueDate: "2026-09-01" }),
      ...Array.from({ length: 9 }, (_, i) => item({ id: `ok${i}`, dueDate: "2026-12-01" })),
    ];
    const s = summarizeCompliance(items, TODAY);
    // Uncapped this would be 90 ("Excellent").
    assert.equal(s.score, 74);
    assert.equal(s.capped, true);
    assert.equal(s.band, "attention");
  });

  it("completing an overdue item raises the score", () => {
    const before = summarizeCompliance(
      [item({ id: "a", dueDate: "2026-09-01" }), item({ id: "b", dueDate: "2026-09-22" })],
      TODAY,
    );
    const after = summarizeCompliance(
      [item({ id: "a", dueDate: "2026-09-01", status: "completed" }), item({ id: "b", dueDate: "2026-09-22" })],
      TODAY,
    );
    assert.ok(after.score! > before.score!);
  });

  it("ignores year-old completed filings so they can't dilute this year", () => {
    const s = summarizeCompliance(
      [
        item({ id: "late", dueDate: "2026-09-01" }),
        ...Array.from({ length: 5 }, (_, i) => item({ id: `old${i}`, status: "completed", dueDate: "2024-01-01" })),
      ],
      TODAY,
    );
    assert.equal(s.score, 0);
    assert.equal(s.scoredCount, 1);
  });
});

describe("bandForScore", () => {
  it("draws the band edges", () => {
    assert.equal(bandForScore(100), "excellent");
    assert.equal(bandForScore(90), "excellent");
    assert.equal(bandForScore(89), "good");
    assert.equal(bandForScore(75), "good");
    assert.equal(bandForScore(74), "attention");
    assert.equal(bandForScore(50), "attention");
    assert.equal(bandForScore(49), "at_risk");
    assert.equal(bandForScore(null), "not_scored");
  });
});

describe("breakdownByCategory", () => {
  it("keeps requested categories even when empty, and orders SECP before Tax before the rest", () => {
    const s = summarizeCompliance(
      [item({ id: "t", category: "tax", dueDate: "2026-12-01" }), item({ id: "z", category: "licensing", dueDate: "2026-12-01" })],
      TODAY,
    );
    const rows = breakdownByCategory(s.items, ["secp", "tax"]);
    assert.deepEqual(
      rows.map((r) => r.category),
      ["secp", "tax", "licensing"],
    );
    assert.equal(rows[0].items.length, 0);
  });

  it("sorts each category most-urgent-first and counts what needs attention", () => {
    const s = summarizeCompliance(
      [
        item({ id: "ok", dueDate: "2026-12-01" }),
        item({ id: "late", dueDate: "2026-09-01" }),
        item({ id: "soon", dueDate: "2026-09-22" }),
        item({ id: "setup", dueDate: null }),
      ],
      TODAY,
    );
    const [secp] = breakdownByCategory(s.items);
    assert.deepEqual(
      secp.items.map((r) => r.item.id),
      ["late", "soon", "setup", "ok"],
    );
    assert.equal(secp.attention, 3);
  });
});

describe("balanceColumns", () => {
  const w = (card: { h: number }) => card.h;

  it("puts the first cards side by side, then fills under whichever column is shorter", () => {
    const cards = [{ id: "secp", h: 5 }, { id: "tax", h: 3 }, { id: "emp", h: 2 }, { id: "corp", h: 4 }];
    const [left, right] = balanceColumns(cards, 2, w);
    assert.deepEqual(left.map((c) => c.id), ["secp", "corp"]);
    assert.deepEqual(right.map((c) => c.id), ["tax", "emp"]);
  });

  it("keeps card order within each column and loses no cards", () => {
    const cards = Array.from({ length: 7 }, (_, i) => ({ id: String(i), h: 1 + (i % 3) }));
    const cols = balanceColumns(cards, 2, w);
    assert.equal(cols.flat().length, 7);
    for (const col of cols) assert.deepEqual(col.map((c) => Number(c.id)), [...col.map((c) => Number(c.id))].sort((a, b) => a - b));
  });

  it("returns a single column in original order, and copes with fewer cards than columns", () => {
    const cards = [{ id: "a", h: 1 }, { id: "b", h: 9 }];
    assert.deepEqual(balanceColumns(cards, 1, w), [cards]);
    assert.deepEqual(balanceColumns([cards[0]], 2, w), [[cards[0]], []]);
    assert.deepEqual(balanceColumns(cards, 0, w), [cards]);
  });
});

describe("findUntrackedRequirements", () => {
  it("lists standing filings with no matter, counts a filed matter as tracked, and never asks for Form 9", () => {
    const untracked = findUntrackedRequirements([
      item({ id: "m1", kind: "matter", matterType: "FORM_A", status: "completed" }),
      item({ id: "o1", kind: "obligation", title: "Form A / annual return" }),
    ]);
    assert.deepEqual(
      untracked.map((r) => r.matterType),
      ["FINANCIAL_STATEMENTS", "INCOME_TAX_RETURN"],
    );
  });
});

describe("STANDING_REQUIREMENTS", () => {
  it("only names real matter types — the dashboard creates a matter of that type on click", () => {
    for (const r of STANDING_REQUIREMENTS) assert.ok((MATTER_TYPES as readonly string[]).includes(r.matterType), r.matterType);
  });
});

describe("buildNextActions", () => {
  it("ranks overdue, then due soon, then needs-setup, then upcoming, and caps at three", () => {
    const s = summarizeCompliance(
      [
        item({ id: "upcoming", dueDate: "2026-11-01" }),
        item({ id: "setup", dueDate: null }),
        item({ id: "soon", dueDate: "2026-09-25" }),
        item({ id: "late", dueDate: "2026-09-10" }),
        item({ id: "done", status: "completed", dueDate: "2026-09-01" }),
      ],
      TODAY,
    );
    const actions = buildNextActions(s.items, [], "Acme");
    assert.deepEqual(
      actions.map((a) => a.key),
      ["obligation:late", "obligation:soon", "obligation:setup"],
    );
    assert.equal(actions[0].detail, "10 days overdue");
    assert.equal(actions[1].detail, "Due in 5 days");
    assert.equal(actions[2].cta, "Review requirements");
  });

  it("labels the call to action by matter type and stage", () => {
    const s = summarizeCompliance(
      [
        item({ id: "m1", kind: "matter", matterType: "FORM_A", matterStatus: "draft", dueDate: "2026-09-30", href: "/matters/m1" }),
        item({ id: "m2", kind: "matter", matterType: "FORM_9", matterStatus: "review", dueDate: "2026-10-01", href: "/matters/m2" }),
        item({ id: "m3", kind: "matter", matterType: "INCOME_TAX_RETURN", matterStatus: "approved", dueDate: "2026-10-02", href: "/matters/m3" }),
      ],
      TODAY,
    );
    assert.deepEqual(
      buildNextActions(s.items, [], "Acme").map((a) => a.cta),
      ["Continue Form A", "Review Form 9", "File income tax return"],
    );
  });

  it("only offers 'start' rows when there is room, with no href — the UI creates the matter", () => {
    const s = summarizeCompliance([item({ id: "late", dueDate: "2026-09-10" })], TODAY);
    const untracked = findUntrackedRequirements([]);
    const actions = buildNextActions(s.items, untracked, "Acme");
    assert.equal(actions.length, 3);
    assert.equal(actions[0].key, "obligation:late");
    assert.equal(actions[1].startMatterType, "FINANCIAL_STATEMENTS");
    assert.equal(actions[1].href, undefined);
    assert.equal(actions[1].cta, "Start financial statements");
  });

  it("returns nothing when everything is completed and every standing filing is tracked", () => {
    const s = summarizeCompliance([item({ id: "a", status: "completed", dueDate: "2026-09-01" })], TODAY);
    assert.deepEqual(buildNextActions(s.items, [], "Acme"), []);
  });

  it("drops the redundant company suffix from matter titles", () => {
    assert.equal(stripCompanySuffix("Form A / annual return — Acme (Pvt) Ltd", "Acme (Pvt) Ltd"), "Form A / annual return");
    assert.equal(stripCompanySuffix("Annual return", "Acme"), "Annual return");
  });
});
