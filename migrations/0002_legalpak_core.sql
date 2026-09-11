-- LegalPak core: workspaces, companies, matters.
--
-- IDs are TEXT (app-generated `prefix_<uuid>`), matching Better Auth's user ids
-- so they join cleanly (see migrations/0001_auth.sql). Every row that isn't
-- directly a workspace hangs off workspace_id so access control is a single
-- join on workspace_member for the signed-in user (see
-- src/lib/legalpak/access.ts).
--
-- `created_by` / `user_id` are plain TEXT with NO foreign key to "user" — the
-- disabled-auth dev-user fallback ('dev-user', used locally / in preview) has
-- no row in Better Auth's own "user" table, so an FK here would break local
-- dev the moment auth is off. Ownership is enforced at the application layer
-- (authMiddleware + access.ts), same as every other per-user table in this
-- template (see the `auth` skill's per-user-data guidance).

create table if not exists workspace (
  id text primary key,
  name text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_member (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  user_id text not null,
  role text not null default 'owner'
    check (role in ('owner', 'partner', 'associate', 'paralegal', 'client')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_member_user_idx on workspace_member (user_id);

create table if not exists company (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,

  name text not null,
  cuin text,
  company_type text,

  paid_up_capital numeric,
  turnover numeric,
  employees integer,

  incorporation_date date,
  financial_year_end date,
  agm_date date,

  public_linked boolean not null default false,
  has_subsidiary boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_workspace_idx on company (workspace_id);

create table if not exists matter (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  company_id text not null references company(id) on delete cascade,

  type text not null
    check (type in ('FINANCIAL_STATEMENTS', 'FORM_A', 'FORM_9', 'CONTRACT')),

  title text not null,

  status text not null default 'draft'
    check (status in ('draft', 'review', 'approved', 'signed', 'filed', 'closed')),

  due_date date,

  created_by text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matter_company_idx on matter (company_id);
create index if not exists matter_workspace_idx on matter (workspace_id);
create index if not exists matter_due_date_idx on matter (due_date);

-- One workflow-data row per matter, holding the form's current draft as JSON —
-- avoids a bespoke table per workflow type for four small, evolving forms.
create table if not exists workflow_data (
  id text primary key,
  matter_id text not null references matter(id) on delete cascade,
  workflow_type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (matter_id)
);
