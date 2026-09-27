-- Chat rows written before a question and its reply were stored as one unit recorded the
-- question first and the reply later, so overlapping sends could interleave them
-- (user A, user B, reply A, user C, reply B, ...). Nothing in those rows says which reply
-- answers which question, so replaying them to the model can pair an answer with the wrong
-- question. This flags every existing row whose pairing can't be proven; the model's context
-- leaves flagged rows out. The transcript is untouched — flagged rows are still shown to the user.
--
-- Rows are proven in two ways. Neither reads anything into two rows sharing a timestamp: a
-- tie says nothing about which rows belong together, and treating one as a pair could match
-- a question with some other question's reply.
--   * Stored whole: saveExchange gives a question and its reply the ids `<exchange>.q` and
--     `<exchange>.r`, so when both exist they are one exchange by construction.
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
         count(*) over (partition by session_id, created_at) as rows_at_instant
  from chat_message
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
stored_whole as (
  select q.id as question_id, r.id as reply_id
  from chat_message q
  join chat_message r on r.session_id = q.session_id and r.id = left(q.id, -1) || 'r'
  where q.id like '%.q' and q.sender = 'user' and r.sender = 'assistant'
),
followed as (
  select prev_id as question_id, id as reply_id
  from ordered
  where sender = 'assistant' and prev_sender = 'user' and awaiting = 0
    and rows_at_instant = 1 and prev_rows_at_instant = 1
),
pairs as (
  select question_id, reply_id from stored_whole
  union
  select question_id, reply_id from followed
)
update chat_message m
   set pairing_unverified = true
 where not exists (select 1 from pairs p where m.id in (p.question_id, p.reply_id));
