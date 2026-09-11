-- Consultation requests: the lead-capture form that replaces a Cal.com/
-- Calendly embed for now (no account wired up yet). A visitor — logged in or
-- not — submits their contact details and what they need; the practice
-- follows up manually. Can be attached to a specific company/matter when
-- submitted from within the app, or stand alone when submitted from the
-- public marketing page.

create table if not exists consultation_request (
  id text primary key,

  name text not null,
  email text not null,
  phone text,
  topic text not null,
  message text,

  workspace_id text references workspace(id) on delete set null,
  company_id text references company(id) on delete set null,
  matter_id text references matter(id) on delete set null,

  status text not null default 'new'
    check (status in ('new', 'contacted', 'scheduled', 'closed')),

  created_at timestamptz not null default now()
);

create index if not exists consultation_request_created_idx on consultation_request (created_at desc);
