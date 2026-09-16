-- Document Vault v2 (Phase 4): adds description/notes, a lifecycle status,
-- expiry/review dates, and an "employment" category to the existing
-- `document` table (see 0003_documents.sql, 0012_document_vault.sql).
--
-- `status` is a manual active/archived toggle (mirrors `company.status`);
-- "expired" and "review due" are derived at read time from expiry_date /
-- review_date rather than stored, so they never go stale.

alter table document add column if not exists description text;
alter table document add column if not exists notes text;
alter table document add column if not exists status text not null default 'active'
  check (status in ('active', 'archived'));
alter table document add column if not exists expiry_date date;
alter table document add column if not exists review_date date;

alter table document drop constraint if exists document_category_check;
alter table document add constraint document_category_check
  check (category in ('corporate', 'secp', 'tax', 'contracts', 'directors', 'shareholders', 'employment', 'notices', 'other'));

create index if not exists document_expiry_idx on document (expiry_date) where expiry_date is not null;
create index if not exists document_review_idx on document (review_date) where review_date is not null;
