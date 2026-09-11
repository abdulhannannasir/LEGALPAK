-- LegalPak document vault: files attached to a company (and optionally one
-- matter), stored in Vercel Blob (private access) — this table holds only
-- metadata + the blob pathname; the actual bytes never touch Postgres.

create table if not exists document (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  company_id text not null references company(id) on delete cascade,
  matter_id text references matter(id) on delete set null,

  uploaded_by text not null,

  name text not null,
  blob_pathname text not null,
  mime_type text,
  file_size bigint,

  created_at timestamptz not null default now()
);

create index if not exists document_company_idx on document (company_id);
create index if not exists document_matter_idx on document (matter_id);
