-- Document Vault: adds categorization, an updated_at timestamp, and version
-- history to the existing `document` table (see 0003_documents.sql).
--
-- Categories are a UI/organizational label only — they carry no legal
-- meaning and are not derived from any SECP/FBR requirement.
--
-- Replacing a document's contents snapshots the current row into
-- document_version BEFORE overwriting it, and the old blob is kept (not
-- deleted) so prior versions stay downloadable. Deleting the parent document
-- cascades to its version rows; the app layer is responsible for deleting
-- the version blobs from storage before that happens.

alter table document add column if not exists category text not null default 'other'
  check (category in ('corporate', 'secp', 'tax', 'contracts', 'directors', 'shareholders', 'notices', 'other'));

alter table document add column if not exists updated_at timestamptz not null default now();
alter table document add column if not exists version integer not null default 1;

create table if not exists document_version (
  id text primary key,
  document_id text not null references document(id) on delete cascade,
  version integer not null,

  name text not null,
  blob_pathname text not null,
  mime_type text,
  file_size bigint,
  uploaded_by text not null,

  -- When this version was current (its create/replace timestamp), not when
  -- it was superseded.
  created_at timestamptz not null,
  archived_at timestamptz not null default now()
);

create index if not exists document_version_document_idx on document_version (document_id, version desc);
