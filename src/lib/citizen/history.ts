import type { ChatTurn } from "./gemini";

/** How many of the most recent stored messages are sent to the model as context. */
export const HISTORY_LIMIT = 20;

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  content: string;
  created_at: string;
};

/** The slice of the SQL client these helpers need — satisfied by `getSql()` and by test doubles. */
export type HistoryDb = {
  query<T>(text: string, params?: unknown[]): Promise<T[]>;
};

export type Exchange = {
  sessionId: string;
  /** Names the exchange; the two stored rows' ids are derived from it (`<id>.q`, `<id>.r`). Must not contain a `.`. */
  id: string;
  question: string;
  reply: string;
  /** When the model answered — stamped on both rows. */
  at: Date;
};

/**
 * Chronological order for chat rows. A row's timestamp has millisecond precision and both
 * halves of an exchange share theirs, so two exchanges that finish in the same millisecond
 * tie. Ties fall back to the id, compared as bytes (`"C"` collation, so the result doesn't
 * depend on the database's locale). `saveExchange` gives one exchange ids that share a prefix
 * and end `.q` / `.r`, so an id-ordered run keeps each exchange together with its question
 * first — a tie can never interleave two exchanges' rows.
 */
const CHRONOLOGICAL = `created_at asc, id collate "C" asc`;
const NEWEST_FIRST = `created_at desc, id collate "C" desc`;

/**
 * Stores a question and its answer as one unit: a single statement, both rows carrying the
 * same timestamp. Nothing is stored while the model is still working, so a send in flight
 * never appears in another send's history, and another send's rows can never land between
 * the two halves of an exchange. That is what makes "a user turn immediately followed by a
 * model turn" mean "this question and its answer" for everything written here.
 *
 * The row ids are what keep exchanges apart when timestamps tie — see `CHRONOLOGICAL`.
 */
export async function saveExchange(db: HistoryDb, exchange: Exchange): Promise<void> {
  // Ids sharing a prefix only stay contiguous in id order if no other exchange's id can
  // continue this one's, which a `.` in an id would allow.
  if (exchange.id.includes(".")) throw new Error("Exchange id must not contain '.'");
  await db.query(
    `insert into chat_message (id, session_id, sender, content, created_at)
     values ($1, $2, 'user', $3, $6::timestamptz), ($4, $2, 'assistant', $5, $6::timestamptz)`,
    [
      `${exchange.id}.q`,
      exchange.sessionId,
      exchange.question,
      `${exchange.id}.r`,
      exchange.reply,
      exchange.at.toISOString(),
    ],
  );
}

/**
 * Drops turns that don't form a clean question-then-answer pair: a window that opens on a
 * reply, a question with no answer (or with two), and any run of same-role turns. For
 * exchanges written by `saveExchange` this only trims the edges of the window, since every
 * exchange there is an adjacent pair. The result alternates, opens on a user turn and ends
 * on a model turn, so the new question can be appended directly.
 *
 * It is also a safety net for older rows, which stored the question first and the answer
 * later — two overlapping sends could interleave there. This removes the obvious cases
 * (user, user, model, model), but it cannot untangle crossed pairs such as user A, user B,
 * reply A, user C, reply B: nothing in those rows says which reply answers which question,
 * so row order alone can't be trusted for them.
 */
export function keepPairedExchanges(turns: ChatTurn[]): ChatTurn[] {
  const runs: ChatTurn[][] = [];
  for (const turn of turns) {
    const last = runs[runs.length - 1];
    if (last && last[0].role === turn.role) last.push(turn);
    else runs.push([turn]);
  }

  const kept: ChatTurn[] = [];
  for (let i = 0; i < runs.length; i++) {
    const question = runs[i];
    const answer = runs[i + 1];
    if (
      question[0].role === "user" &&
      question.length === 1 &&
      answer?.[0].role === "model" &&
      answer.length === 1
    ) {
      kept.push(question[0], answer[0]);
      i++; // the answer run is consumed with its question
    }
  }
  return kept;
}

/** The session's most recent exchanges, oldest first, ready to precede the new question. */
export async function loadHistory(db: HistoryDb, sessionId: string): Promise<ChatTurn[]> {
  // Newest first so the limit keeps the latest messages, then flipped back into chronological order.
  const rows = await db.query<{ sender: "user" | "assistant"; content: string }>(
    `select sender, content from chat_message where session_id = $1
     order by ${NEWEST_FIRST} limit $2`,
    [sessionId, HISTORY_LIMIT],
  );
  return keepPairedExchanges(
    rows
      .reverse()
      .map((r): ChatTurn => ({ role: r.sender === "user" ? "user" : "model", text: r.content })),
  );
}

/** The whole conversation, oldest first, for showing it back to the user. */
export async function loadTranscript(db: HistoryDb, sessionId: string): Promise<ChatMessage[]> {
  return db.query<ChatMessage>(
    `select id, sender, content, created_at::text as created_at
     from chat_message where session_id = $1 order by ${CHRONOLOGICAL}`,
    [sessionId],
  );
}
