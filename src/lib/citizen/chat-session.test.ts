import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INVALID_SESSION_MESSAGE,
  clearStoredSession,
  isInvalidSessionError,
  loadStoredSession,
  saveStoredSession,
  withSessionRecovery,
  type StoredChatSession,
} from "./chat-session.ts";

// The helpers only touch `window.localStorage`, so a Map-backed stand-in is enough outside a browser.
const store = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
};

const KEY = "test:chat-session";
const dead: StoredChatSession = { sessionId: "chat_dead", sessionToken: "old" };
const fresh: StoredChatSession = { sessionId: "chat_fresh", sessionToken: "new" };
const invalid = () => new Error(INVALID_SESSION_MESSAGE);

beforeEach(() => store.clear());

describe("isInvalidSessionError", () => {
  it("recognises the server's invalid-session error", () => {
    assert.equal(isInvalidSessionError(invalid()), true);
  });

  it("does not rely on the value still being an Error instance", () => {
    // Errors crossing the server-function boundary are rebuilt on the client.
    assert.equal(isInvalidSessionError({ message: INVALID_SESSION_MESSAGE }), true);
  });

  it("ignores every other failure", () => {
    assert.equal(isInvalidSessionError(new Error("The legal advisor is unavailable right now")), false);
    assert.equal(isInvalidSessionError(null), false);
    assert.equal(isInvalidSessionError(undefined), false);
    assert.equal(isInvalidSessionError("Invalid or expired chat session"), false);
  });
});

describe("stored session", () => {
  it("round-trips through storage", () => {
    saveStoredSession(KEY, fresh);
    assert.deepEqual(loadStoredSession(KEY), fresh);
  });

  it("is null when nothing is stored", () => {
    assert.equal(loadStoredSession(KEY), null);
  });

  it("is null for anything that is not a session", () => {
    for (const junk of ["not json", "null", "42", "{}", '{"sessionId":1,"sessionToken":"x"}', '{"sessionId":"a"}']) {
      store.set(KEY, junk);
      assert.equal(loadStoredSession(KEY), null, junk);
    }
  });

  it("can be cleared", () => {
    saveStoredSession(KEY, fresh);
    clearStoredSession(KEY);
    assert.equal(loadStoredSession(KEY), null);
  });
});

describe("withSessionRecovery", () => {
  it("hands the current session to the attempt and returns its result", async () => {
    saveStoredSession(KEY, fresh);
    const session = { current: fresh as StoredChatSession | null };
    const seen: (StoredChatSession | null)[] = [];

    const result = await withSessionRecovery(KEY, session, async (s) => {
      seen.push(s);
      return "reply";
    });

    assert.equal(result, "reply");
    assert.deepEqual(seen, [fresh]);
    assert.deepEqual(loadStoredSession(KEY), fresh);
  });

  it("forgets a session the server rejects and retries once with none", async () => {
    saveStoredSession(KEY, dead);
    const session = { current: dead as StoredChatSession | null };
    const seen: (StoredChatSession | null)[] = [];

    const result = await withSessionRecovery(KEY, session, async (s) => {
      seen.push(s);
      if (s) throw invalid();
      return fresh;
    });

    assert.deepEqual(result, fresh);
    assert.deepEqual(seen, [dead, null]);
    assert.equal(session.current, null);
    assert.equal(loadStoredSession(KEY), null);
  });

  it("does not retry, or touch storage, for any other failure", async () => {
    saveStoredSession(KEY, fresh);
    const session = { current: fresh as StoredChatSession | null };
    let calls = 0;

    await assert.rejects(
      withSessionRecovery(KEY, session, async () => {
        calls++;
        throw new Error("The legal advisor is unavailable right now");
      }),
      /unavailable/,
    );

    assert.equal(calls, 1);
    assert.equal(session.current, fresh);
    assert.deepEqual(loadStoredSession(KEY), fresh);
  });

  it("does not retry when there was no session to drop", async () => {
    const session = { current: null as StoredChatSession | null };
    let calls = 0;

    await assert.rejects(
      withSessionRecovery(KEY, session, async () => {
        calls++;
        throw invalid();
      }),
      /Invalid or expired/,
    );

    assert.equal(calls, 1);
  });

  it("retries only once — a second failure reaches the caller", async () => {
    saveStoredSession(KEY, dead);
    const session = { current: dead as StoredChatSession | null };
    let calls = 0;

    await assert.rejects(
      withSessionRecovery(KEY, session, async () => {
        calls++;
        throw invalid();
      }),
      /Invalid or expired/,
    );

    assert.equal(calls, 2);
  });
});
