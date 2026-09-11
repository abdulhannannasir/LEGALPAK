-- Citizen legal-advice product: AI chat intake + a public lawyer directory.
-- Adapted from a Supabase-style draft to this app's actual conventions:
-- text ids (not uuid), no auth.users FK (Better Auth's dev-user fallback has
-- no row there — see matter/company conventions), and app-layer authorization
-- instead of Postgres RLS (Better Auth doesn't populate auth.uid()).
--
-- Consultation booking + escrow payments and consumer-document DB persistence
-- are intentionally NOT included this round — document drafts are generated
-- client-side like the existing contract generator, and bookings/payments
-- are deferred.

create table if not exists lawyer (
  id text primary key,
  full_name text not null,
  email text not null unique,
  phone text not null,
  bar_council_no text not null unique,
  bar_enrolment_year integer not null,
  court_level text not null
    check (court_level in ('District Courts', 'High Court', 'Supreme Court')),
  city text not null,
  specializations text[] not null default '{}',
  bio text,
  consultation_fee integer not null default 2000,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lawyer_verified_city_idx on lawyer (city) where is_verified = true;

-- No FK to Better Auth's "user" table: chat sessions are usable anonymously
-- (session_token) as well as signed in (user_id) — see reminders.ts and
-- matter/company for why FKs to "user" are avoided in this app.
create table if not exists chat_session (
  id text primary key,
  user_id text,
  session_token_hash text,
  topic text
    check (topic in ('family', 'property', 'criminal', 'consumer', 'labor', 'corporate', 'general')),
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists chat_session_token_idx on chat_session (session_token_hash);
create index if not exists chat_session_user_idx on chat_session (user_id);

create table if not exists chat_message (
  id text primary key,
  session_id text not null references chat_session(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant')),
  content text not null,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create index if not exists chat_message_session_idx on chat_message (session_id, created_at);
