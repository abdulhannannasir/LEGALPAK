import { createServerFn } from "@tanstack/react-start";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { optionalAuthMiddleware } from "@/lib/auth/optional-middleware";
import { requireActiveSubscription } from "@/lib/legalpak/billing";
import { createId } from "@/lib/legalpak/id";
import { INVALID_SESSION_MESSAGE } from "./chat-session";
import { askGemini } from "./gemini";
import { loadHistory, loadTranscript, saveExchange } from "./history";
import { CITIZEN_ADVISOR_SYSTEM_PROMPT, CORPORATE_COUNSEL_SYSTEM_PROMPT } from "./system-prompt";

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
 * Nothing is stored until the model has answered. If the call fails this throws
 * and leaves no trace — no unanswered user message, no apology saved as if the
 * advisor had said it — so the next turn's history stays clean and the page can
 * hand the user's text back for a retry.
 */
export const sendChatMessageFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      sessionId?: string;
      sessionToken?: string;
      message: string;
      topic?: ChatTopic;
      /** AI Counsel only — a short profile line (name, type, CUIN/NTN…) for the currently selected company, woven into the prompt sent to Gemini but never stored/echoed as if the user typed it. */
      companyContext?: string;
    }) =>
      z
        .object({
          sessionId: z.string().min(1).optional(),
          sessionToken: z.string().min(1).optional(),
          message: z.string().trim().min(1).max(4000),
          topic: z.enum(CHAT_TOPICS).optional(),
          companyContext: z.string().max(500).optional(),
        })
        .parse(input),
  )
  .middleware([optionalAuthMiddleware])
  .handler(async ({ context, data: input }) => {
    // The citizen chat stays free and anonymous, but `topic` is chosen by the caller and "corporate" selects the paid
    // AI Counsel advisor — so the AI Counsel page's own gate isn't enough. Enforce sign-in and an active subscription
    // here, on every message: the topic is re-sent each time, so checking only the first would be trivially bypassed.
    if (input.topic === "corporate") {
      if (!context.userId) throw new Error("Unauthorized");
      await requireActiveSubscription(context.userId);
    }

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
    // The context line goes only to Gemini, never to the stored/returned message —
    // the chat bubble and history must show exactly what the user typed.
    const messageForModel =
      input.topic === "corporate" && input.companyContext
        ? `[Company context: ${input.companyContext}]\n\n${input.message}`
        : input.message;
    history.push({ role: "user", text: messageForModel });

    const systemPrompt =
      input.topic === "corporate" ? CORPORATE_COUNSEL_SYSTEM_PROMPT : CITIZEN_ADVISOR_SYSTEM_PROMPT;

    let reply: string;
    try {
      reply = await askGemini(systemPrompt, history);
    } catch (err) {
      console.error("askGemini failed:", err);
      // Deliberately generic — the underlying cause (missing key, upstream error) stays in the server log.
      throw new Error("The legal advisor is unavailable right now");
    }
    const answeredAt = new Date();

    if (isNewSession) {
      await sql.query(
        `insert into chat_session (id, session_token_hash, topic) values ($1, $2, $3)`,
        [sessionId, hashToken(sessionToken), input.topic ?? null],
      );
    }
    // Question and reply go in as one unit, both stamped with when the model answered, so a failure
    // can't leave the message stored without its reply and an overlapping send can't land between them.
    await saveExchange(sql, {
      sessionId,
      id: createId("msg"),
      question: input.message,
      reply,
      at: answeredAt,
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
      throw new Error("Invalid or expired chat session");
    }
    return loadTranscript(sql, input.sessionId);
  });
