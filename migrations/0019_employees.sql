-- Employees: a per-company staff register that holds every particular the
-- Punjab Labour Code 2026 (Act IX of 2026, s.142) requires an employment
-- agreement to state, so a compliant contract can be generated from the row.
-- Additive — nothing here changes an existing table.

create table if not exists employee (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  company_id text not null references company(id) on delete cascade,

  -- s.142(1)(b): full name, date of birth, gender, residence, CNIC / passport.
  full_name text not null,
  father_name text,
  gender text check (gender in ('male', 'female', 'other')),
  date_of_birth date,
  cnic text,
  passport_no text,
  address text,
  phone text,
  email text,

  -- s.142(1)(c)/(d): place of work, job title, and a detailed description of duties.
  employee_code text,
  job_title text not null,
  department text,
  reports_to text,
  job_description text,
  place_of_work text,
  -- s.5(2) "managerial or administrative employee" — gates the s.163 non-compete carve-out.
  is_managerial boolean not null default false,

  -- s.134-s.144: permanent vs fixed-term (with the objective reason s.138(3) requires),
  -- full/part-time, commencement, and probation (capped at three months, s.144(1)).
  employment_type text not null default 'permanent'
    check (employment_type in ('permanent', 'fixed_term')),
  fixed_term_basis text
    check (fixed_term_basis in ('temporary_work', 'seasonal', 'replacement', 'special_project')),
  fixed_term_reason text,
  work_pattern text not null default 'full_time'
    check (work_pattern in ('full_time', 'part_time')),
  date_of_joining date,
  end_date date,
  probation_months integer not null default 0
    check (probation_months between 0 and 3),

  -- s.142(1)(h): working hours and the weekly rest day.
  weekly_hours integer not null default 48 check (weekly_hours between 1 and 72),
  working_schedule text,
  weekly_rest_day text not null default 'Sunday',

  -- s.142(1)(k): basic wage and any other components, indicated separately.
  basic_salary numeric(14, 2) not null default 0 check (basic_salary >= 0),
  allowances jsonb not null default '[]'::jsonb,

  -- s.142(1)(l): social security / old-age-benefit registration, where already registered.
  social_security_no text,
  eobi_no text,

  status text not null default 'active' check (status in ('active', 'former')),
  left_on date,

  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_workspace_idx on employee (workspace_id);
create index if not exists employee_company_idx on employee (company_id, status, created_at desc);

-- Every contract generated and saved for an employee, kept as an immutable
-- numbered version (mirrors contract_version in 0013): `body` is the exact
-- text that was reviewed and `snapshot` the inputs it was built from, so a
-- later edit to the employee record never rewrites what was actually issued.
create table if not exists employee_contract (
  id text primary key,
  employee_id text not null references employee(id) on delete cascade,
  workspace_id text not null references workspace(id) on delete cascade,
  company_id text not null references company(id) on delete cascade,
  version integer not null,
  title text not null,
  body text not null,
  snapshot jsonb not null default '{}'::jsonb,
  note text,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (employee_id, version)
);

create index if not exists employee_contract_idx on employee_contract (employee_id, version desc);
