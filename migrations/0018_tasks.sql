-- Task workflow system: turns a compliance obligation or filing into an
-- assignable, trackable checklist ("Gather financial information -> Prepare
-- filing -> Director approval -> Upload documents -> Submit -> Mark
-- completed") instead of a static record. Additive — a task can optionally
-- point at an existing compliance_obligation and/or a single supporting
-- document, but doesn't require either.

create table if not exists task (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  company_id text not null references company(id) on delete cascade,
  obligation_id text references compliance_obligation(id) on delete set null,
  document_id text references document(id) on delete set null,

  title text not null,
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),

  due_date date,
  assignee_id text references "user"(id) on delete set null,

  completed_at timestamptz,
  completed_by text,

  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_workspace_idx on task (workspace_id);
create index if not exists task_company_idx on task (company_id, created_at desc);
create index if not exists task_due_date_idx on task (due_date);
create index if not exists task_obligation_idx on task (obligation_id);
create index if not exists task_assignee_idx on task (assignee_id);

-- The ordered checklist steps shown on a task, e.g. the SECP Annual Return
-- workflow above. Purely a checklist — completing every step does not by
-- itself flip task.status, since "Mark completed" is its own explicit step.
create table if not exists task_step (
  id text primary key,
  task_id text not null references task(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  done boolean not null default false,
  completed_at timestamptz,
  completed_by text,
  created_at timestamptz not null default now()
);

create index if not exists task_step_idx on task_step (task_id, position);

-- Comment thread on a task — same free-form shape as compliance_obligation_note
-- (0016_compliance_engine.sql), scoped to a task instead.
create table if not exists task_comment (
  id text primary key,
  task_id text not null references task(id) on delete cascade,
  workspace_id text not null references workspace(id) on delete cascade,
  body text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists task_comment_idx on task_comment (task_id, created_at desc);
