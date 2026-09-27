import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { ChatTurn } from "./gemini.ts";
import {
  HISTORY_LIMIT,
  keepPairedExchanges,
  loadHistory,
  loadTranscript,
  saveExchange,
  type HistoryDb,
} from "./history.ts";

const u = (text: string): ChatTurn => ({ role: "user", text });
const m = (text: string): ChatTurn => ({ role: "model", text });
const texts = (turns: ChatTurn[]) => turns.map((t) => t.text);
const migration = (name: string) =>
  readFileSync(new URL(`../../../migrations/${name}`, import.meta.url), "utf8");

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

describe("stored history", () => {
  let pg: PGlite;
  let db: HistoryDb;

  before(async () => {
    pg = new PGlite();
    // The real migrations, so the queries are checked against the real chat tables.
    await pg.exec(migration("0010_citizen_advisor.sql"));
    await pg.exec(migration("0020_chat_pairing_unverified.sql"));
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

  describe("exchanges stored with saveExchange", () => {
    const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds));
    let nextId = 0;
    const exchange = (sessionId: string, label: string, when: Date, id = `ex${++nextId}`) =>
      saveExchange(db, { sessionId, id, question: `q-${label}`, reply: `a-${label}`, at: when });

    it("keeps every question next to its own answer when overlapping sends finish out of order", async () => {
      // Four sends started in the order A, B, C, D but finished B, D, A, C. Storing the question
      // first and the answer later would have interleaved them; each exchange is written whole.
      await pg.query(`insert into chat_session (id) values ('race')`);
      await exchange("race", "B", at(1));
      await exchange("race", "D", at(2));
      await exchange("race", "A", at(3));
      await exchange("race", "C", at(4));

      const expected = ["q-B", "a-B", "q-D", "a-D", "q-A", "a-A", "q-C", "a-C"];
      assert.deepEqual(texts(await loadHistory(db, "race")), expected);
      assert.deepEqual((await loadTranscript(db, "race")).map((r) => r.content), expected);
    });

    it("keeps both exchanges when two finish in the same millisecond", async () => {
      await pg.query(`insert into chat_session (id) values ('tie')`);
      // Stored A first, but B's id sorts first: the tie is settled by id, and each exchange
      // stays whole either way round.
      await exchange("tie", "A", at(1), "z");
      await exchange("tie", "B", at(1), "a");

      const expected = ["q-B", "a-B", "q-A", "a-A"];
      assert.deepEqual(texts(await loadHistory(db, "tie")), expected);
      assert.deepEqual((await loadTranscript(db, "tie")).map((r) => r.content), expected);
    });

    it("does not depend on the order tied rows happen to be stored in", async () => {
      await pg.query(`insert into chat_session (id) values ('scrambled')`);
      // Two exchanges at one instant whose rows are stored reply-first and interleaved — the
      // shape an unordered tie, or one broken by `sender`, would hand back as user, user, model, model.
      const row = (id: string, sender: "user" | "assistant", content: string) =>
        pg.query(
          `insert into chat_message (id, session_id, sender, content, created_at)
           values ($1, 'scrambled', $2, $3, timestamptz '2026-01-01 00:00:05+00')`,
          [id, sender, content],
        );
      await row("m.r", "assistant", "a-A");
      await row("n.q", "user", "q-B");
      await row("m.q", "user", "q-A");
      await row("n.r", "assistant", "a-B");

      const expected = ["q-A", "a-A", "q-B", "a-B"];
      assert.deepEqual(texts(await loadHistory(db, "scrambled")), expected);
      assert.deepEqual((await loadTranscript(db, "scrambled")).map((r) => r.content), expected);
    });

    it("shows a question above its own reply even though both carry the same timestamp", async () => {
      await pg.query(`insert into chat_session (id) values ('order')`);
      for (let i = 1; i <= 12; i++) await exchange("order", String(i), at(i));

      const transcript = await loadTranscript(db, "order");
      assert.deepEqual(
        transcript.map((r) => r.sender),
        Array.from({ length: 12 }, () => ["user", "assistant"]).flat(),
      );
      assert.deepEqual(
        texts(await loadHistory(db, "order")),
        Array.from({ length: 10 }, (_, i) => [`q-${i + 3}`, `a-${i + 3}`]).flat(),
      );
    });

    it("writes exactly the question and its reply for one exchange, stamped with the same instant", async () => {
      await pg.query(`insert into chat_session (id) values ('single')`);
      await exchange("single", "only", at(1), "solo");

      const stored = await db.query<{ id: string; sender: string; content: string; created_at: Date }>(
        `select id, sender, content, created_at from chat_message where session_id = 'single' order by id collate "C"`,
      );
      assert.deepEqual(
        stored.map(({ id, sender, content }) => ({ id, sender, content })),
        [
          { id: "solo.q", sender: "user", content: "q-only" },
          { id: "solo.r", sender: "assistant", content: "a-only" },
        ],
      );
      // Both halves carry the model's answer time exactly — a later reply stamp would let another
      // exchange's rows land between them.
      assert.deepEqual(
        stored.map((r) => r.created_at.getTime()),
        [at(1).getTime(), at(1).getTime()],
      );
    });

    it("refuses an exchange id containing a dot", async () => {
      await pg.query(`insert into chat_session (id) values ('dotted')`);
      await assert.rejects(exchange("dotted", "x", at(1), "a.b"), /must not contain/);
    });
  });
});

describe("migration 0020: flagging old rows whose pairing can't be proven", () => {
  let pg: PGlite;
  let db: HistoryDb;

  type Legacy = [id: string, sender: "user" | "assistant", content: string, second: number];

  /** Rows as the old write path left them, on a schema that predates the migration. */
  async function legacy(sessionId: string, rows: Legacy[]) {
    await pg.query(`insert into chat_session (id) values ($1)`, [sessionId]);
    for (const [id, sender, content, second] of rows) {
      await pg.query(
        `insert into chat_message (id, session_id, sender, content, created_at)
         values ($1, $2, $3, $4, timestamptz '2026-01-01 00:00:00+00' + ($5 || ' seconds')::interval)`,
        [id, sessionId, sender, content, String(second)],
      );
    }
  }

  const flagged = async (sessionId: string) =>
    (
      await db.query<{ id: string }>(
        `select id from chat_message where session_id = $1 and pairing_unverified order by created_at, id`,
        [sessionId],
      )
    ).map((r) => r.id);

  before(async () => {
    pg = new PGlite();
    db = { query: async <T>(text: string, params?: unknown[]) => (await pg.query<T>(text, params)).rows };
    await pg.exec(migration("0010_citizen_advisor.sql"));

    // Every reply directly follows its question.
    await legacy("clean", [
      ["c1", "user", "q1", 0],
      ["c2", "assistant", "a1", 1],
      ["c3", "user", "q2", 2],
      ["c4", "assistant", "a2", 3],
    ]);
    // Four overlapping sends whose replies land out of step (user A, user B, reply A, user C,
    // reply B, ...), then a quiet exchange. `user C, reply B` looks like a pair but isn't.
    await legacy("crossed", [
      ["x1", "user", "uA", 0],
      ["x2", "user", "uB", 1],
      ["x3", "assistant", "rA", 2],
      ["x4", "user", "uC", 3],
      ["x5", "assistant", "rB", 4],
      ["x6", "user", "uD", 5],
      ["x7", "assistant", "rC", 6],
      ["x8", "assistant", "rD", 7],
      ["x9", "user", "q9", 8],
      ["xa", "assistant", "a9", 9],
    ]);
    // A question that never got its reply (say the server died mid-call), then two more rows.
    await legacy("orphan", [
      ["o1", "user", "q1", 0],
      ["o2", "assistant", "a1", 1],
      ["o3", "user", "lost", 2],
      ["o4", "user", "q2", 3],
      ["o5", "assistant", "a2", 4],
    ]);
    // Question and reply written by one statement, so each pair shares an instant.
    await legacy("atomic", [
      ["p1", "user", "q1", 0],
      ["p2", "assistant", "a1", 0],
      ["p3", "user", "q2", 1],
      ["p4", "assistant", "a2", 1],
    ]);
    // Two exchanges stored at the very same instant, ids chosen so they sort question A,
    // reply B, question B, reply A — an order that would read as two clean pairs, wrongly.
    await legacy("tied", [
      ["t1", "user", "q-A", 0],
      ["t2", "assistant", "a-B", 0],
      ["t3", "user", "q-B", 0],
      ["t4", "assistant", "a-A", 0],
    ]);

    await pg.exec(migration("0020_chat_pairing_unverified.sql"));
  });
  after(() => pg.close());

  it("flags nothing when every reply directly follows its question", async () => {
    assert.deepEqual(await flagged("clean"), []);
    assert.deepEqual(texts(await loadHistory(db, "clean")), ["q1", "a1", "q2", "a2"]);
  });

  it("flags the rows of overlapping sends whose replies could belong to either question", async () => {
    // The exchange after the overlap is provable again: nothing else was awaiting an answer.
    assert.deepEqual(await flagged("crossed"), ["x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8"]);
  });

  it("keeps flagged rows out of the model's context but still shows them in the transcript", async () => {
    assert.deepEqual(texts(await loadHistory(db, "crossed")), ["q9", "a9"]);
    assert.equal((await loadTranscript(db, "crossed")).length, 10);
  });

  it("flags what follows a question that never got a reply, since it can't be told apart", async () => {
    assert.deepEqual(await flagged("orphan"), ["o3", "o4", "o5"]);
    assert.deepEqual(texts(await loadHistory(db, "orphan")), ["q1", "a1"]);
  });

  it("keeps a question and reply that were stored together", async () => {
    assert.deepEqual(await flagged("atomic"), []);
    assert.deepEqual(texts(await loadHistory(db, "atomic")), ["q1", "a1", "q2", "a2"]);
  });

  it("flags two exchanges stored at one instant, whose rows can't be put in order", async () => {
    assert.deepEqual(await flagged("tied"), ["t1", "t2", "t3", "t4"]);
    assert.deepEqual(await loadHistory(db, "tied"), []);
  });

  it("leaves rows written after the migration unflagged", async () => {
    await saveExchange(db, {
      sessionId: "clean",
      id: "fresh",
      question: "q3",
      reply: "a3",
      at: new Date(Date.UTC(2026, 0, 2)),
    });
    assert.deepEqual(await flagged("clean"), []);
    assert.deepEqual(texts(await loadHistory(db, "clean")), ["q1", "a1", "q2", "a2", "q3", "a3"]);
  });
});
