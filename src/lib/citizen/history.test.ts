import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { ChatTurn } from "./gemini.ts";
import { HISTORY_LIMIT, keepPairedExchanges, loadHistory, type HistoryDb } from "./history.ts";

const u = (text: string): ChatTurn => ({ role: "user", text });
const m = (text: string): ChatTurn => ({ role: "model", text });
const texts = (turns: ChatTurn[]) => turns.map((t) => t.text);

describe("keepPairedExchanges", () => {
  it("leaves a clean alternating conversation untouched", () => {
    const turns = [u("q1"), m("a1"), u("q2"), m("a2")];
    assert.deepEqual(keepPairedExchanges(turns), turns);
  });

  it("drops a reply the window happens to open on", () => {
    assert.deepEqual(keepPairedExchanges([m("a0"), u("q1"), m("a1")]), [u("q1"), m("a1")]);
  });

  it("drops a question still waiting for its answer (a send in flight)", () => {
    assert.deepEqual(keepPairedExchanges([u("q1"), m("a1"), u("pending")]), [u("q1"), m("a1")]);
  });

  it("does not merge or re-pair the rows two overlapping sends interleave", () => {
    // Stored order for overlapping sends A and B: user A, user B, reply A, reply B. Which reply
    // answers which question is unknowable, so the whole block is left out — never merged or guessed.
    const turns = [u("q1"), m("a1"), u("A"), u("B"), m("rA"), m("rB"), u("q2"), m("a2")];
    assert.deepEqual(keepPairedExchanges(turns), [u("q1"), m("a1"), u("q2"), m("a2")]);
  });

  it("drops a question that received two replies", () => {
    assert.deepEqual(keepPairedExchanges([u("q1"), m("a1"), m("a1b"), u("q2"), m("a2")]), [
      u("q2"),
      m("a2"),
    ]);
  });

  it("handles an empty history", () => {
    assert.deepEqual(keepPairedExchanges([]), []);
  });
});

describe("loadHistory", () => {
  let pg: PGlite;
  let db: HistoryDb;

  before(async () => {
    pg = new PGlite();
    // The real migration, so the query is checked against the real chat tables.
    await pg.exec(
      readFileSync(new URL("../../../migrations/0010_citizen_advisor.sql", import.meta.url), "utf8"),
    );
    db = { query: async <T>(text: string, params?: unknown[]) => (await pg.query<T>(text, params)).rows };
  });
  after(() => pg.close());

  /** Stores messages one second apart, oldest first, as a conversation accumulates. */
  async function seed(sessionId: string, messages: [sender: "user" | "assistant", content: string][]) {
    await pg.query(`insert into chat_session (id) values ($1)`, [sessionId]);
    for (const [i, [sender, content]] of messages.entries()) {
      await pg.query(
        `insert into chat_message (id, session_id, sender, content, created_at)
         values ($1, $2, $3, $4, timestamptz '2026-01-01 00:00:00+00' + ($5 || ' seconds')::interval)`,
        [`${sessionId}-${i}`, sessionId, sender, content, String(i)],
      );
    }
  }

  /** m1 (user), m2 (assistant), m3 (user), … — a conversation of `count` alternating messages. */
  const alternating = (count: number) =>
    Array.from({ length: count }, (_, i): ["user" | "assistant", string] => [
      i % 2 === 0 ? "user" : "assistant",
      `m${i + 1}`,
    ]);

  it("sends the newest messages, in chronological order, once a conversation passes the limit", async () => {
    await seed("long", alternating(30));
    const history = await loadHistory(db, "long");

    assert.equal(history.length, HISTORY_LIMIT);
    // m11..m30 — the most recent 20. Sending the oldest 20 (m1..m20) is the bug this guards against.
    assert.deepEqual(
      texts(history),
      Array.from({ length: HISTORY_LIMIT }, (_, i) => `m${i + 11}`),
    );
    assert.equal(history[0].role, "user");
    assert.equal(history.at(-1)?.role, "model");
  });

  it("returns a short conversation whole and in order", async () => {
    await seed("short", alternating(4));
    assert.deepEqual(texts(await loadHistory(db, "short")), ["m1", "m2", "m3", "m4"]);
  });

  it("drops the reply the window opens on and the question still awaiting its answer", async () => {
    // 31 messages: the newest 20 are m12..m31, which opens on a reply (m12) and ends on an unanswered question (m31).
    await seed("odd", alternating(31));
    const history = await loadHistory(db, "odd");

    assert.deepEqual(
      texts(history),
      Array.from({ length: 18 }, (_, i) => `m${i + 13}`),
    );
    assert.equal(history[0].role, "user");
    assert.equal(history.at(-1)?.role, "model");
  });

  it("keeps overlapping sends out of the context instead of merging them", async () => {
    await seed("overlap", [
      ["user", "q1"],
      ["assistant", "a1"],
      ["user", "A"],
      ["user", "B"],
      ["assistant", "rA"],
      ["assistant", "rB"],
      ["user", "q2"],
      ["assistant", "a2"],
      ["user", "still pending"],
    ]);
    assert.deepEqual(texts(await loadHistory(db, "overlap")), ["q1", "a1", "q2", "a2"]);
  });

  it("is empty for a session with no messages", async () => {
    await pg.query(`insert into chat_session (id) values ('empty')`);
    assert.deepEqual(await loadHistory(db, "empty"), []);
  });
});
