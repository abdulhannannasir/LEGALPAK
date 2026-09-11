-- Client approval: a lawyer generates a secure link for a matter; the client
-- (no LegalPak account) opens it and approves or rejects. Access is gated
-- purely by possession of the unguessable token — only its SHA-256 hash is
-- stored, never the raw token — not by a session, since the client never
-- signs in. Sending the link itself is manual (copy/share) until an email
-- provider is wired up; the model and flow work today either way.

create table if not exists approval_request (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  matter_id text not null references matter(id) on delete cascade,

  requested_by text not null,
  client_email text,

  token_hash text not null unique,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired')),

  expires_at timestamptz not null,
  responded_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists approval_request_matter_idx on approval_request (matter_id);
