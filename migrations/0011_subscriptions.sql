-- Corporate Suite subscription: Citizen Legal Help and the Help Desk & Rights
-- Navigator stay free for everyone; the corporate/compliance tools (Financial
-- Statements, Form A, Form 9, Contracts, Incorporation, Form 21/45, Legal
-- Notices, Tax Assistant, Compliance Calendar, company management) require an
-- active subscription per workspace.
--
-- There's no payment gateway integration here — EasyPaisa has no public
-- self-serve checkout API the way Stripe does; using it for real requires a
-- registered merchant account and API credentials from Telenor Microfinance
-- Bank. Until that's set up, payment is manual: the user sends PKR 3,000 to
-- the EasyPaisa number shown on /billing and submits the transaction id as
-- proof, landing here with status 'pending'. Verification (checking the
-- transaction actually cleared, then flipping status to 'active') happens
-- directly against the database for now, same as lawyer-listing verification
-- elsewhere in this app — see the comment on submitPaymentFn in billing.ts
-- for the exact statement to run.
create table if not exists subscription (
  id text primary key,
  workspace_id text not null references workspace(id) on delete cascade,
  plan text not null default 'corporate_monthly',
  amount_pkr integer not null default 3000,
  payment_method text not null default 'easypaisa',
  payment_reference text,
  payer_phone text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected', 'expired')),
  submitted_by text not null,
  period_start timestamptz,
  period_end timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscription_workspace_idx on subscription (workspace_id, created_at desc);
