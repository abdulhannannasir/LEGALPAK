-- Chat rows written before a question and its reply were stored as one unit recorded the
-- question first and the reply later, so overlapping sends could interleave them
-- (user A, user B, reply A, user C, reply B, ...). Nothing in those rows says which reply
-- answers which question, so replaying them to the model can pair an answer with the wrong
-- question. This flags every existing row whose pairing can't be proven; the model's context
-- leaves flagged rows out. The transcript is untouched — flagged rows are still shown to the user.
--
-- Rows are proven in two ways:
--   * Stored together: exactly one question and one reply sharing an instant came from a single
--     statement, so they are an exchange.
--   * A reply that directly follows a question while no other question was awaiting an answer.
--     Replies always follow their question and answer it at most once, so (questions asked -
--     replies given) is the number of questions still awaiting a reply; when it is 0 after this
--     reply, the one question just before it (asked when the count was 0) is the only one it
--     can be answering. Rows that share an instant with another row can't be put in a reliable
--     order, so they never count here.
-- A question that never got a reply keeps the count above 0, so nothing after it is proven.
-- Erring that way only costs context; the alternative would risk a misleading pairing.
--
-- Only rows that exist when this runs are flagged. New rows default to unflagged: they are
-- written whole (see saveExchange in src/lib/citizen/history.ts).

alter table chat_message add column if not exists pairing_unverified boolean not null default false;

with stamped as (
  select id, session_id, sender, created_at,
         count(*) over instant as rows_at_instant,
         count(*) filter (where sender = 'user') over instant as questions_at_instant
  from chat_message
  window instant as (partition by session_id, created_at)
),
ordered as (
  select id, sender, rows_at_instant,
         lag(id) over convo as prev_id,
         lag(sender) over convo as prev_sender,
         lag(rows_at_instant) over convo as prev_rows_at_instant,
         sum(case when sender = 'user' then 1 else -1 end) over convo as awaiting
  from stamped
  window convo as (partition by session_id order by created_at, id)
),
proven as (
  select id from stamped where rows_at_instant = 2 and questions_at_instant = 1
  union
  select id from ordered
   where sender = 'assistant' and prev_sender = 'user' and awaiting = 0
     and rows_at_instant = 1 and prev_rows_at_instant = 1
  union
  select prev_id from ordered
   where sender = 'assistant' and prev_sender = 'user' and awaiting = 0
     and rows_at_instant = 1 and prev_rows_at_instant = 1
)
update chat_message m
   set pairing_unverified = true
 where not exists (select 1 from proven p where p.id = m.id);
