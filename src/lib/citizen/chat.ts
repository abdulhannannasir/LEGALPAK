import { createServerFn } from "@tanstack/react-start";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { createId } from "@/lib/legalpak/id";
import { askGemini, type ChatTurn } from "./gemini";
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

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  content: string;
  created_at: string;
};

const HISTORY_LIMIT = 20;

async function loadHistory(sessionId: string): Promise<ChatTurn[]> {
  const sql = await getSql();
  const rows = await sql.query<{ sender: "user" | "assistant"; content: string }>(
    `select sender, content from chat_message where session_id = $1 order by created_at asc limit $2`,
    [sessionId, HISTORY_LIMIT],
  );
  return rows.map((r) => ({ role: r.sender === "user" ? "user" : "model", text: r.content }));
}

/**
 * Sends one citizen message and returns the AI's reply. Works anonymously —
 * a fresh session gets a random token (returned once, stored by the client
 * like the client-approval flow's hashed tokens); an existing session must
 * present the matching token to append to it.
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
          message: z.string().min(1).max(4000),
          topic: z.enum(CHAT_TOPICS).optional(),
          companyContext: z.string().max(500).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data: input }) => {
    const sql = await getSql();
    let sessionId = input.sessionId;
    let sessionToken = input.sessionToken;

    if (sessionId) {
      const rows = await sql.query<{ session_token_hash: string | null }>(
        `select session_token_hash from chat_session where id = $1`,
        [sessionId],
      );
      const session = rows[0];
      if (!session || !sessionToken || session.session_token_hash !== hashToken(sessionToken)) {
        throw new Error("Invalid or expired chat session");
      }
    } else {
      sessionId = createId("chat");
      sessionToken = randomBytes(24).toString("hex");
      await sql.query(
        `insert into chat_session (id, session_token_hash, topic) values ($1, $2, $3)`,
        [sessionId, hashToken(sessionToken), input.topic ?? null],
      );
    }

    const history = await loadHistory(sessionId);
    // The context line goes only to Gemini, never to the stored/returned message —
    // the chat bubble and history must show exactly what the user typed.
    const messageForModel =
      input.topic === "corporate" && input.companyContext
        ? `[Company context: ${input.companyContext}]\n\n${input.message}`
        : input.message;
    history.push({ role: "user", text: messageForModel });

    await sql.query(
      `insert into chat_message (id, session_id, sender, content) values ($1, $2, 'user', $3)`,
      [createId("msg"), sessionId, input.message],
    );

    const systemPrompt =
      input.topic === "corporate" ? CORPORATE_COUNSEL_SYSTEM_PROMPT : CITIZEN_ADVISOR_SYSTEM_PROMPT;

    let reply: string;
    try {
      reply = await askGemini(systemPrompt, history);
    } catch (err) {
      console.error("askGemini failed:", err);
      reply =
        input.topic === "corporate"
          ? "Sorry, I couldn't reach AI Counsel just now. Please try again in a moment, or request a consultation with a corporate lawyer directly."
          : "Sorry, I couldn't reach the legal advisor service just now. Please try again in a moment, or use the lawyer directory to speak with a verified advocate directly.";
    }

    await sql.query(
      `insert into chat_message (id, session_id, sender, content) values ($1, $2, 'assistant', $3)`,
      [createId("msg"), sessionId, reply],
    );

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
    return sql.query<ChatMessage>(
      `select id, sender, content, created_at::text as created_at
       from chat_message where session_id = $1 order by created_at asc`,
      [input.sessionId],
    );
  });
