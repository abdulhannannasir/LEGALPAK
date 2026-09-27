-- Company Workspace (Phase 2): fields for the company's registered profile
-- (address, business activity, province/city) and a lifecycle status for
-- archiving a company without deleting its matters/documents/history.
-- "Incorporated vs registration in progress" stays a DERIVED display value
-- from incorporation_date (see companyStatus() in companies.ts) — this
-- status column is the separate active/archived record lifecycle, not that.
alter table company add column if not exists status text not null default 'active'
  check (status in ('active', 'archived'));
alter table company add column if not exists registered_address text;
alter table company add column if not exists business_activity text;
alter table company add column if not exists province text;
alter table company add column if not exists city text;
alter table company add column if not exists archived_at timestamptz;

create index if not exists company_workspace_status_idx on company (workspace_id, status);
