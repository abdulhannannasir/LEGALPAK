-- A manually-recurring obligation (no rule_id, so no rule to recompute the next due date
-- from) advances by chaining addMonthsISO off the PREVIOUS occurrence's own due date. Once a
-- short month clamps that date (Jan 31 -> Feb 28), the day-of-month the obligation was
-- actually meant to recur on is gone from the row — the next step then chains off the
-- clamped Feb 28 and produces Mar 28 instead of Mar 31. This column keeps the ORIGINAL
-- intended day-of-month, set once from the obligation's first due date and carried forward
-- unchanged by every spawned successor (see spawnNextOccurrence in compliance-obligations.ts),
-- so recurrence math always clamps from the true anchor day instead of an already-clamped one.
alter table compliance_obligation add column if not exists recurrence_anchor_day smallint
  check (recurrence_anchor_day is null or (recurrence_anchor_day between 1 and 31));
