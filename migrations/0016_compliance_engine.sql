-- Corporate Compliance Engine (Phase 3): a general obligation-tracking
-- system for ANY company compliance duty — SECP, Tax, Corporate,
-- Employment, Contract, Licensing, Other — independent of whether a
-- document-generator matter exists for it (see compliance.ts /
-- compliance-requirements.ts for the earlier matter-linked SECP/FBR items,
-- which this is additive to, not a replacement of).
--
-- compliance_rule is the extensible, structured-configuration rule engine:
-- a rule only auto-generates obligations once BOTH `active` and
-- `deadline_ready` are true. `deadline_ready = false` is the deliberate
-- "not yet legally verified" state — see compliance-rules.ts — so the
-- system never presents an invented deadline as authoritative law.

create table if not exists compliance_rule (
  id text primary key,
  name text not null,
  authority text not null,
  category text not null
    check (category in ('secp', 'tax', 'corporate', 'employment', 'contract', 'licensing', 'other')),

  -- Structured AND-conditions checked against a company row, e.g.
  -- {"companyType":["private","smc"],"publicLinked":false}. Empty object
  -- (default) matches every company. No arbitrary code — see
  -- matchesApplicability() in compliance-rules.ts.
  applicability_conditions jsonb not null default '{}'::jsonb,

  -- {"frequency":"annual"|"monthly"|"quarterly"|"once","anchor":"financial_year_end"|"incorporation_date"|"agm_date"|"period_end",
  --  "offsetDays":30,"fixedMonth":9,"fixedDay":30}. Null means no computable
  -- recurrence yet (deadline_ready must then be false).
  recurrence jsonb,

  -- Human-readable description of how the due date is derived (e.g. "30
  -- days after the AGM"). deadline_ready gates whether it's trusted enough
  -- to auto-compute a due_date at all.
  deadline_logic text not null default '',
  deadline_ready boolean not null default false,

  required_documents jsonb not null default '[]'::jsonb,

  -- Only an active + deadline_ready rule auto-generates obligations with a
  -- computed due date. An active-but-not-ready rule still generates a
  -- single placeholder obligation per company, flagged "Configuration
  -- required" in the UI instead of a fabricated date.
  active boolean not null default false,

  -- Citation for deadline_logic (statute/regulation/notification). Mirrors
  -- the "Verification required" pattern already established in
  -- src/lib/legalpak/legal-sources.ts.
  source_reference text not null default '',
  source_verified_on date,

  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists compliance_obligation (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  company_id text not null references company(id) on delete cascade,
  rule_id text references compliance_rule(id) on delete set null,

  title text not null,
  description text not null default '',
  category text not null
    check (category in ('secp', 'tax', 'corporate', 'employment', 'contract', 'licensing', 'other')),
  authority text not null default '',

  due_date date,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'due_soon', 'overdue', 'in_progress', 'completed')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),

  recurring boolean not null default false,
  recurrence_rule text,
  -- Dedup key for rule-generated obligations, e.g. "2026", "2026-Q3",
  -- "2026-09", "once" — stops a recurring rule from double-generating the
  -- same period. Null for manually-created obligations.
  period_key text,

  required_documents jsonb not null default '[]'::jsonb,
  notes text not null default '',

  completed_at timestamptz,
  completed_by text,

  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_obligation_workspace_idx on compliance_obligation (workspace_id);
create index if not exists compliance_obligation_company_idx on compliance_obligation (company_id, created_at desc);
create index if not exists compliance_obligation_due_date_idx on compliance_obligation (due_date);
create unique index if not exists compliance_obligation_rule_period_idx
  on compliance_obligation (company_id, rule_id, period_key)
  where rule_id is not null and period_key is not null;

-- Free-form notes on an obligation — mirrors compliance_note
-- (0014_compliance_notes_reminders.sql), just scoped to an obligation
-- instead of a matter.
create table if not exists compliance_obligation_note (
  id text primary key,
  obligation_id text not null references compliance_obligation(id) on delete cascade,
  workspace_id text not null references workspace(id) on delete cascade,
  body text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists compliance_obligation_note_idx on compliance_obligation_note (obligation_id, created_at desc);

-- Let the existing document vault attach files to a compliance obligation,
-- the same optional-FK pattern as document.matter_id (0003_documents.sql).
alter table document add column if not exists obligation_id text references compliance_obligation(id) on delete set null;
create index if not exists document_obligation_idx on document (obligation_id);
