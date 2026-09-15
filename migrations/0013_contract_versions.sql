-- Contract version history: named snapshots of a CONTRACT matter's
-- questionnaire answers + generated draft text, distinct from the generic
-- `workflow_data` row (which only ever holds the CURRENT draft, same as every
-- other matter type). Mirrors the document_version pattern in
-- 0012_document_vault.sql, but snapshots the JSON questionnaire state + the
-- rendered text instead of an uploaded blob.

create table if not exists contract_version (
  id text primary key,
  matter_id text not null references matter(id) on delete cascade,
  version integer not null,

  contract_type text not null,
  data jsonb not null default '{}'::jsonb,
  draft_text text not null default '',
  note text,

  created_by text not null,
  created_at timestamptz not null default now(),

  unique (matter_id, version)
);

create index if not exists contract_version_matter_idx on contract_version (matter_id, version desc);
