-- Idempotency key for spawnNextOccurrence, independent of rule_id/period_key: records which
-- obligation a successor was spawned FROM, with at most one successor per predecessor. The
-- existing compliance_obligation_rule_period_idx (0016) only protects rule-generated obligations
-- (rule_id is not null); a manually-created recurring obligation has no rule to dedupe against.
-- This lets changeObligationStatusFn safely retry spawnNextOccurrence on every completion call
-- for a recurring obligation — including a retry after a PRIOR completion's own spawn attempt
-- failed post-commit — without ever creating two successors for the same predecessor.
alter table compliance_obligation add column if not exists spawned_from_id text
  references compliance_obligation(id) on delete set null;

create unique index if not exists compliance_obligation_spawned_from_idx
  on compliance_obligation (spawned_from_id)
  where spawned_from_id is not null;
