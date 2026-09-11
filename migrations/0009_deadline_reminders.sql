create table if not exists deadline_reminder_log (
  id text primary key,
  matter_id text not null references matter(id) on delete cascade,
  days_before integer not null,
  sent_at timestamptz not null default now(),
  unique (matter_id, days_before)
);

create index if not exists deadline_reminder_log_matter_idx on deadline_reminder_log (matter_id);
