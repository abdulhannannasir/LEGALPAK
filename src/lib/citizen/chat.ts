import { createServerFn } from "@tanstack/react-start";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { createId } from "@/lib/legalpak/id";
import { INVALID_SESSION_MESSAGE } from "./chat-session";
import { askGemini } from "./gemini";
import { loadHistory, loadTranscript, saveExchange } from "./history";
import { CITIZEN_ADVISOR_SYSTEM_PROMPT } from "./system-prompt";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const CHAT_TOPICS = [
  "family",
  "property",
  "criminal",
  "consumer",
  "labor",
  "corporate",
  "general",
] as const;
export type ChatTopic = (typeof CHAT_TOPICS)[number];

export type { ChatMessage } from "./history";

/**
 * Sends one citizen message and returns the AI's reply. Works anonymously —
 * a fresh session gets a random token (returned once, stored by the client
 * like the client-approval flow's hashed tokens); an existing session must
 * present the matching token to append to it.
 *
 * If the model can't be reached this throws and stores nothing — no unanswered
 * question, no session, no apology saved as if the advisor had said it — so the
 * next turn's history stays clean and the page can hand the user's text back for
 * a retry.
 */
export const sendChatMessageFn = createServerFn({ method: "POST" })
  .validator(
    (input: { sessionId?: string; sessionToken?: string; message: string; topic?: ChatTopic }) =>
      z
        .object({
          sessionId: z.string().min(1).optional(),
          sessionToken: z.string().min(1).optional(),
          message: z.string().trim().min(1).max(4000),
          topic: z.enum(CHAT_TOPICS).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data: input }) => {
    const sql = await getSql();
    const isNewSession = !input.sessionId;
    let sessionId = input.sessionId;
    let sessionToken = input.sessionToken;

    if (sessionId) {
      const rows = await sql.query<{ session_token_hash: string | null }>(
        `select session_token_hash from chat_session where id = $1`,
        [sessionId],
      );
      const session = rows[0];
      if (!session || !sessionToken || session.session_token_hash !== hashToken(sessionToken)) {
        throw new Error(INVALID_SESSION_MESSAGE);
      }
    } else {
      sessionId = createId("chat");
      sessionToken = randomBytes(24).toString("hex");
    }

    const history = isNewSession ? [] : await loadHistory(sql, sessionId);
    history.push({ role: "user", text: input.message });

    let reply: string;
    try {
      reply = await askGemini(CITIZEN_ADVISOR_SYSTEM_PROMPT, history);
    } catch (err) {
      console.error("askGemini failed:", err);
      // Deliberately generic — the underlying cause (missing key, upstream error) stays in the server log.
      throw new Error("The legal advisor is unavailable right now");
    }

    // A new session is only created once there is a reply to store in it, so a failed first
    // message leaves no empty session behind whose token the client never received.
    if (isNewSession) {
      await sql.query(
        `insert into chat_session (id, session_token_hash, topic) values ($1, $2, $3)`,
        [sessionId, hashToken(sessionToken), input.topic ?? null],
      );
    }
    // Stored only now, as one unit — a send still waiting on the model leaves no half-finished
    // exchange for an overlapping send to load (see saveExchange).
    await saveExchange(sql, {
      sessionId,
      id: createId("msg"),
      question: input.message,
      reply,
      at: new Date(),
    });

    return { sessionId, sessionToken, reply };
  });

export const getChatHistoryFn = createServerFn({ method: "POST" })
  .validator((input: { sessionId: string; sessionToken: string }) =>
    z.object({ sessionId: z.string().min(1), sessionToken: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data: input }) => {
    const sql = await getSql();
    const rows = await sql.query<{ session_token_hash: string | null }>(
      `select session_token_hash from chat_session where id = $1`,
      [input.sessionId],
    );
    const session = rows[0];
    if (!session || session.session_token_hash !== hashToken(input.sessionToken)) {
      throw new Error(INVALID_SESSION_MESSAGE);
    }
    return loadTranscript(sql, input.sessionId);
  });
