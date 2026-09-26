import type { ChatTurn } from "./gemini";

/** How many of the most recent stored messages are sent to the model as context. */
export const HISTORY_LIMIT = 20;

/** The slice of the SQL client `loadHistory` needs — satisfied by `getSql()` and by test doubles. */
export type HistoryDb = {
  query<T>(text: string, params?: unknown[]): Promise<T[]>;
};

/**
 * Keeps only the exchanges whose question and answer pair up unambiguously: exactly one
 * user turn followed by exactly one model turn. Anything else is left out rather than
 * guessed at — a window that opens on a reply, a question still waiting for its answer
 * (a send in flight), or the interleaved rows two overlapping sends leave behind
 * (user, user, model, model), where there is no telling which answer belongs to which
 * question. Sending a wrong pairing would mislead the model; sending less does not.
 *
 * The result alternates, opens on a user turn and ends on a model turn, so the new
 * question can be appended directly.
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
    `select sender, content from chat_message where session_id = $1 order by created_at desc limit $2`,
    [sessionId, HISTORY_LIMIT],
  );
  return keepPairedExchanges(
    rows
      .reverse()
      .map((r): ChatTurn => ({ role: r.sender === "user" ? "user" : "model", text: r.content })),
  );
}
