-- Compliance Center: free-form notes and user-set reminders attached to a
-- compliance matter (any matter type tracked in
-- src/lib/legalpak/compliance-requirements.ts). Additive to the existing
-- matter/workflow_data/document/audit foundation — mirrors the
-- document_version / contract_version pattern of a small, purpose-specific
-- table hanging off `matter` rather than a parallel domain model.

create table if not exists compliance_note (
  id text primary key,
  matter_id text not null references matter(id) on delete cascade,
  workspace_id text not null references workspace(id) on delete cascade,

  body text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists compliance_note_matter_idx on compliance_note (matter_id, created_at desc);

-- A user-set "remind me on this date" entry — distinct from the automatic
-- 14/7/3/1-days-before email checkpoints in deadline_reminder_log
-- (see src/lib/legalpak/reminders.ts, migrations/0009_deadline_reminders.sql).
-- This is a manual note-to-self, not a dispatched notification.
create table if not exists compliance_reminder (
  id text primary key,
  matter_id text not null references matter(id) on delete cascade,
  workspace_id text not null references workspace(id) on delete cascade,

  remind_on date not null,
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists compliance_reminder_matter_idx on compliance_reminder (matter_id, remind_on);
