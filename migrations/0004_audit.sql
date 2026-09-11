-- LegalPak audit trail: an append-only log of who did what, when. Every
-- mutation in the app writes one row here — never edited, never deleted.
-- `user_id` has no FK for the same reason company/matter user columns don't
-- (see 0002_legalpak_core.sql): the disabled-auth dev-user fallback has no
-- row in Better Auth's "user" table.

create table if not exists audit_log (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  company_id text references company(id) on delete cascade,
  matter_id text references matter(id) on delete cascade,

  user_id text not null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists audit_log_matter_idx on audit_log (matter_id, created_at desc);
create index if not exists audit_log_company_idx on audit_log (company_id, created_at desc);
create index if not exists audit_log_workspace_idx on audit_log (workspace_id, created_at desc);
